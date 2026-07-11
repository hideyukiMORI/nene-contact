<?php

declare(strict_types=1);

/**
 * Bootstrap CLI: create a contact form from a JSON definition (server-side provisioning).
 *
 * Usage:
 *   php tools/create-contact-form.php <org_slug> <json_file>
 *
 * The JSON file uses the same body shape POST /admin/contact-forms accepts (name, locales,
 * allowed_origins, fields[], optional public_form_key, autoreply, appearance, …). It is
 * validated with ContactFormBodyValidator and created via CreateContactFormUseCase (audited,
 * actor=null), so the CLI enforces exactly the same rules as the HTTP API.
 *
 * Use this where the admin console/API is unavailable for provisioning — e.g. a host whose
 * reverse proxy strips the Authorization header. The form definition is passed at runtime, so
 * no site-specific content lives in the repository.
 *
 * Idempotent when the JSON pins a custom `public_form_key`: if a form with that key already
 * exists (any tenant), the command reports it and exits 0.
 */

use Nene2\Http\RequestScopedHolder;
use Nene2\Validation\ValidationException;
use NeneContact\ApplicationServiceProvider;
use NeneContact\ContactForm\ContactFormBodyValidator;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\CreateContactFormUseCaseInterface;
use NeneContact\Http\RuntimeContainerFactory;
use NeneContact\Organization\OrganizationRepositoryInterface;

require dirname(__DIR__) . '/vendor/autoload.php';

$slug = $argv[1] ?? '';
$jsonFile = $argv[2] ?? '';

if ($slug === '' || $jsonFile === '') {
    fwrite(STDERR, "Usage: php tools/create-contact-form.php <org_slug> <json_file>\n");
    exit(1);
}

if (!is_file($jsonFile) || !is_readable($jsonFile)) {
    fwrite(STDERR, "Cannot read JSON file: {$jsonFile}\n");
    exit(1);
}

$raw = (string) file_get_contents($jsonFile);

try {
    $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    fwrite(STDERR, "Invalid JSON in {$jsonFile}: {$e->getMessage()}\n");
    exit(1);
}

if (!is_array($body)) {
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
    fwrite(STDERR, "No organization with slug '{$slug}'. Create it first with create-organization.php.\n");
    exit(1);
}

$orgHolder = $container->get(ApplicationServiceProvider::ORG_ID_HOLDER);
assert($orgHolder instanceof RequestScopedHolder);
$orgHolder->set($org->id);

// Idempotency on a pinned public key (the public URL is shared across tenants).
$forms = $container->get(ContactFormRepositoryInterface::class);
assert($forms instanceof ContactFormRepositoryInterface);

$requestedKey = is_string($body['public_form_key'] ?? null) ? trim((string) $body['public_form_key']) : '';
if ($requestedKey !== '' && $forms->publicFormKeyExists($requestedKey)) {
    fwrite(STDOUT, "A form with public_form_key '{$requestedKey}' already exists; nothing to do.\n");
    exit(0);
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

$useCase = $container->get(CreateContactFormUseCaseInterface::class);
assert($useCase instanceof CreateContactFormUseCaseInterface);

// CLI provisioning has no authenticated operator; the audit trail records actor=null.
$form = $useCase->execute(null, $input);

fwrite(STDOUT, "Created contact form #{$form->id} '{$form->name}' public_form_key={$form->publicFormKey} org={$slug}\n");
