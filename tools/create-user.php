<?php

declare(strict_types=1);

/**
 * Bootstrap CLI: create an operator user.
 *
 * Usage:
 *   php tools/create-user.php <email> <password> <role> [organization_id]
 *
 * Roles: superadmin | admin | editor. organization_id is omitted for superadmin.
 */

use NeneContact\Auth\Role;
use NeneContact\Auth\UserRepositoryInterface;
use NeneContact\Http\RuntimeContainerFactory;

require dirname(__DIR__) . '/vendor/autoload.php';

$email = $argv[1] ?? '';
$password = $argv[2] ?? '';
$role = $argv[3] ?? '';
$organizationId = isset($argv[4]) && $argv[4] !== '' ? (int) $argv[4] : null;

if ($email === '' || $password === '' || $role === '') {
    fwrite(STDERR, "Usage: php tools/create-user.php <email> <password> <role> [organization_id]\n");
    exit(1);
}

if (Role::tryFrom($role) === null) {
    fwrite(STDERR, "Invalid role '{$role}'. Use: superadmin | admin | editor.\n");
    exit(1);
}

$container = (new RuntimeContainerFactory(dirname(__DIR__)))->create();
$users = $container->get(UserRepositoryInterface::class);
assert($users instanceof UserRepositoryInterface);

if ($users->findByEmail($email) !== null) {
    fwrite(STDERR, "A user with email '{$email}' already exists.\n");
    exit(1);
}

$user = $users->create(
    email: $email,
    passwordHash: password_hash($password, PASSWORD_DEFAULT),
    role: $role,
    organizationId: $role === Role::Superadmin->value ? null : $organizationId,
);

fwrite(STDOUT, "Created user #{$user->id} <{$user->email}> role={$user->role} org_id=" . ($user->organizationId ?? 'null') . "\n");
