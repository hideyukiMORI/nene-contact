<?php

declare(strict_types=1);

/**
 * Bootstrap CLI: reset an operator's password out-of-band (lost-password recovery).
 *
 * Usage:
 *   php tools/reset-password.php <email> [--dry-run]
 *
 * The new password is read from STDIN, never an argv — a password on the command line leaks
 * into shell history and the process list (`ps`), which would defeat the point even though the
 * audit snapshots omit the hash. On a TTY you are prompted with input hidden; when STDIN is a
 * pipe the first line is used:
 *   printf 'new-secret\n' | php tools/reset-password.php op@example.com
 *
 * The reset goes through AdminResetPasswordUseCase (audited, ADR 0013): it writes a
 * `user.password_changed` event with **actor=null** — a null actor is exactly how an admin
 * reset is told apart from a self-service change (which carries the changer's own id). The
 * audit snapshots (UserResponse) never include the password hash.
 *
 * Why it exists: on launch night the admin password was lost and recovered with a raw SQL
 * UPDATE that left no audit record. This is the audited replacement. The counterpart of the
 * other bootstrap CLIs, for the same reason — the admin API is out of reach (a reverse proxy
 * that strips Authorization) or the console has no UI for it.
 *
 * Known limitation: actor=null means the trail records that an admin reset happened (target +
 * before/after) but not who ran the CLI — the operator with shell access.
 *
 * --dry-run resolves and prints the target user, then exits without writing or reading STDIN.
 */

use NeneContact\Auth\AdminResetPasswordUseCaseInterface;
use NeneContact\Auth\UserNotFoundException;
use NeneContact\Auth\UserRepositoryInterface;
use NeneContact\Http\RuntimeContainerFactory;

require dirname(__DIR__) . '/vendor/autoload.php';

$args = array_values(array_filter(
    array_slice($argv, 1),
    static fn (string $arg): bool => $arg !== '--dry-run',
));
$dryRun = in_array('--dry-run', $argv, true);

$email = $args[0] ?? '';

if ($email === '') {
    fwrite(STDERR, "Usage: php tools/reset-password.php <email> [--dry-run]\n");
    fwrite(STDERR, "The new password is read from STDIN (TTY prompt or piped first line), never argv.\n");
    exit(1);
}

$container = (new RuntimeContainerFactory(dirname(__DIR__)))->create();

// Resolve the target for the dry-run preview and for a friendly not-found message; the use
// case resolves it again by email on the real path (single source of the reset itself).
$users = $container->get(UserRepositoryInterface::class);
assert($users instanceof UserRepositoryInterface);

$target = $users->findByEmail($email);
if ($target === null) {
    fwrite(STDERR, "No user with email '{$email}'.\n");
    exit(1);
}

$describe = "user #{$target->id} <{$target->email}> role={$target->role} org="
    . ($target->organizationId ?? 'null');

if ($dryRun) {
    fwrite(STDOUT, "Dry run: would reset password for {$describe} (not modified).\n");
    exit(0);
}

$newPassword = read_new_password_from_stdin();
if ($newPassword === '') {
    fwrite(STDERR, "Empty password; aborted.\n");
    exit(1);
}

$useCase = $container->get(AdminResetPasswordUseCaseInterface::class);
assert($useCase instanceof AdminResetPasswordUseCaseInterface);

try {
    $user = $useCase->execute($email, $newPassword);
} catch (UserNotFoundException $e) {
    // The user vanished between the preview and the write (a concurrent deletion).
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}

fwrite(STDOUT, "Reset password for user #{$user->id} <{$user->email}> role={$user->role} org="
    . ($user->organizationId ?? 'null') . " (audited: user.password_changed, actor=null).\n");

/**
 * Reads the new password from STDIN without echoing it on a TTY, or as the first piped line.
 * Never touches argv, so the secret stays out of shell history and the process list.
 */
function read_new_password_from_stdin(): string
{
    $isTty = stream_isatty(STDIN);

    if ($isTty) {
        fwrite(STDERR, 'New password (input hidden): ');
        // Restore the terminal's echo even if the script dies while it is off — otherwise a
        // crash mid-read leaves the operator's shell silently non-echoing (a real hazard for a
        // late-night emergency tool). Best-effort; harmless if `stty` is unavailable.
        register_shutdown_function(static function (): void {
            exec('stty echo 2>/dev/null');
        });
        exec('stty -echo 2>/dev/null');
    }

    $line = fgets(STDIN);

    if ($isTty) {
        exec('stty echo 2>/dev/null');
        fwrite(STDERR, "\n");
    }

    return $line === false ? '' : rtrim($line, "\r\n");
}
