<?php

declare(strict_types=1);

/**
 * Bootstrap CLI: update an existing contact form from a partial JSON definition (server-side edit).
 *
 * Usage:
 *   php tools/update-contact-form.php <org_slug> <public_form_key> <json_file> [--dry-run]
 *
 * The JSON file holds only the keys that change (name, description, allowed_origins, fields[],
 * autoreply, appearance, …); each supplied top-level key replaces that key wholly, and everything
 * else is carried over from the live form (see ContactFormBodyPatch). The merged body is validated
 * with ContactFormBodyValidator and applied via UpdateContactFormUseCase (audited, actor=null), so
 * the CLI enforces exactly the same rules as PUT /admin/contact-forms/{id}.
 *
 * The counterpart of create-contact-form.php, for the same reason it exists: editing a form on a
 * host where the admin API is out of reach (a reverse proxy that strips Authorization), or where
 * the console has no UI for the field in question (autoreply). The form content is passed at
 * runtime, so no site-specific content lives in the repository.
 *
 * Identity — id, public_form_key, organization_id, status, created_at — is preserved; naming any
 * of it in the patch is an error rather than a silent no-op. --dry-run prints the merged body and
 * exits without writing.
 */

use Nene2\Http\RequestScopedHolder;
use Nene2\Validation\ValidationException;
use NeneContact\ApplicationServiceProvider;
use NeneContact\ContactForm\ContactFormBodyPatch;
use NeneContact\ContactForm\ContactFormBodyValidator;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\ContactFormResponse;
use NeneContact\ContactForm\UpdateContactFormUseCaseInterface;
use NeneContact\Http\RuntimeContainerFactory;
use NeneContact\Organization\OrganizationRepositoryInterface;

require dirname(__DIR__) . '/vendor/autoload.php';

$args = array_values(array_filter(
    array_slice($argv, 1),
    static fn (string $arg): bool => $arg !== '--dry-run',
));
$dryRun = in_array('--dry-run', $argv, true);

$slug = $args[0] ?? '';
$publicFormKey = $args[1] ?? '';
$jsonFile = $args[2] ?? '';

if ($slug === '' || $publicFormKey === '' || $jsonFile === '') {
    fwrite(STDERR, "Usage: php tools/update-contact-form.php <org_slug> <public_form_key> <json_file> [--dry-run]\n");
    fwrite(STDERR, 'Patchable keys: ' . implode(', ', ContactFormBodyPatch::editableKeys()) . "\n");
    exit(1);
}

if (!is_file($jsonFile) || !is_readable($jsonFile)) {
    fwrite(STDERR, "Cannot read JSON file: {$jsonFile}\n");
    exit(1);
}

$raw = (string) file_get_contents($jsonFile);

try {
    $patch = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    fwrite(STDERR, "Invalid JSON in {$jsonFile}: {$e->getMessage()}\n");
    exit(1);
}

if (!is_array($patch)) {
    fwrite(STDERR, "The JSON root must be an object.\n");
    exit(1);
}

$container = (new RuntimeContainerFactory(dirname(__DIR__)))->create();

// Resolve the target tenant and scope the request-scoped org holder to it, exactly as the
// tenant middleware would over HTTP — the use case and repository read this holder.
$organizations = $container->get(OrganizationRepositoryInterface::class);
assert($organizations instanceof OrganizationRepositoryInterface);

$org = $organizations->findBySlug($slug);
if ($org === null || $org->id === null) {
    fwrite(STDERR, "No organization with slug '{$slug}'.\n");
    exit(1);
}

$orgHolder = $container->get(ApplicationServiceProvider::ORG_ID_HOLDER);
assert($orgHolder instanceof RequestScopedHolder);
$orgHolder->set($org->id);

// The form is addressed by its public key: the stable identifier an operator has at hand, and
// org-scoped here, so a key belonging to another tenant reads as not found.
$forms = $container->get(ContactFormRepositoryInterface::class);
assert($forms instanceof ContactFormRepositoryInterface);

$current = $forms->findByPublicFormKey($publicFormKey);
if ($current === null || $current->id === null) {
    fwrite(STDERR, "No contact form with public_form_key '{$publicFormKey}' in org '{$slug}'.\n");
    exit(1);
}

try {
    $body = ContactFormBodyPatch::apply(ContactFormResponse::toArray($current), $patch);
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, "Invalid patch: {$e->getMessage()}\n");
    exit(1);
}

try {
    $input = ContactFormBodyValidator::parse($body);
} catch (ValidationException $e) {
    fwrite(STDERR, "Validation failed:\n");
    foreach ($e->errors() as $error) {
        fwrite(STDERR, "  - {$error->field}: {$error->message}\n");
    }
    exit(1);
}

if ($dryRun) {
    fwrite(STDOUT, json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
    fwrite(STDOUT, "Dry run: contact form #{$current->id} not modified (patched keys: " . implode(', ', array_keys($patch)) . ").\n");
    exit(0);
}

$useCase = $container->get(UpdateContactFormUseCaseInterface::class);
assert($useCase instanceof UpdateContactFormUseCaseInterface);

// CLI editing has no authenticated operator; the audit trail records actor=null.
$form = $useCase->execute(null, $current->id, $input);

fwrite(STDOUT, "Updated contact form #{$form->id} '{$form->name}' public_form_key={$form->publicFormKey} org={$slug} (patched keys: " . implode(', ', array_keys($patch)) . ")\n");
