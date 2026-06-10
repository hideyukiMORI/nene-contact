<?php

declare(strict_types=1);

/**
 * Bootstrap CLI: create an organization (tenant).
 *
 * Usage:
 *   php tools/create-organization.php <name> <slug> [plan]
 *
 * In single-tenant resolution (TENANT_RESOLUTION=single) the resolver needs an
 * organization whose slug matches ORG_SLUG (default: "default"). Run this once
 * on a fresh database, e.g.:
 *
 *   php tools/create-organization.php "Default" default
 *
 * Idempotent: if an organization with <slug> already exists it is left
 * unchanged and the command exits 0, so it is safe to re-run during bootstrap.
 */

use NeneContact\Http\RuntimeContainerFactory;
use NeneContact\Organization\CreateOrganizationInput;
use NeneContact\Organization\CreateOrganizationUseCaseInterface;
use NeneContact\Organization\OrganizationRepositoryInterface;

require dirname(__DIR__) . '/vendor/autoload.php';

$name = $argv[1] ?? '';
$slug = $argv[2] ?? '';
$plan = isset($argv[3]) && $argv[3] !== '' ? $argv[3] : 'free';

if ($name === '' || $slug === '') {
    fwrite(STDERR, "Usage: php tools/create-organization.php <name> <slug> [plan]\n");
    exit(1);
}

$container = (new RuntimeContainerFactory(dirname(__DIR__)))->create();

$organizations = $container->get(OrganizationRepositoryInterface::class);
assert($organizations instanceof OrganizationRepositoryInterface);

$existing = $organizations->findBySlug($slug);
if ($existing !== null) {
    fwrite(STDOUT, "Organization with slug '{$slug}' already exists (#{$existing->id}); nothing to do.\n");
    exit(0);
}

$useCase = $container->get(CreateOrganizationUseCaseInterface::class);
assert($useCase instanceof CreateOrganizationUseCaseInterface);

// CLI provisioning has no authenticated operator; the audit trail records actor=null.
$output = $useCase->execute(null, new CreateOrganizationInput(name: $name, slug: $slug, plan: $plan));

fwrite(STDOUT, "Created organization #{$output->id} '{$output->name}' slug={$output->slug} plan={$output->plan}\n");
