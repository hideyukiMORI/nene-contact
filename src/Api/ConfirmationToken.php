<?php

declare(strict_types=1);

namespace NeneContact\Api;

/**
 * Stateless two-step confirmation token for agent writes (charter §11): a write tool first
 * returns a token bound to the exact intended action + arguments; the same call must echo the
 * token back to actually execute. This forces a deliberate second step — no autonomous outbound
 * action — and the binding means a token issued for one change cannot apply a different one.
 *
 * The token is `{expiry}.{hmac}`, signed server-side (the caller cannot forge it), short-lived.
 * Fails closed when no signing secret is configured.
 */
final readonly class ConfirmationToken
{
    public function __construct(
        private string $secret,
        private int $ttlSeconds = 300,
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->secret !== '';
    }

    public function ttlSeconds(): int
    {
        return $this->ttlSeconds;
    }

    /** Issues a token bound to ($action, $argsHash); valid for {@see ttlSeconds()} seconds. */
    public function issue(string $action, string $argsHash): string
    {
        $exp = time() + $this->ttlSeconds;

        return $exp . '.' . $this->sign($action, $argsHash, $exp);
    }

    /** True only when $token is a valid, unexpired signature for exactly ($action, $argsHash). */
    public function verify(string $token, string $action, string $argsHash): bool
    {
        if ($this->secret === '') {
            return false;
        }

        $parts = explode('.', $token, 2);
        if (count($parts) !== 2) {
            return false;
        }

        [$expRaw, $signature] = $parts;
        if (!ctype_digit($expRaw)) {
            return false;
        }

        $exp = (int) $expRaw;
        if ($exp < time()) {
            return false;
        }

        return hash_equals($this->sign($action, $argsHash, $exp), $signature);
    }

    /** ISO-8601 expiry encoded in a token, or null when it cannot be parsed. */
    public function expiresAt(string $token): ?string
    {
        $parts = explode('.', $token, 2);
        if (count($parts) !== 2 || !ctype_digit($parts[0])) {
            return null;
        }

        return date('c', (int) $parts[0]);
    }

    /**
     * Canonical hash of arguments to bind a token to (order-independent).
     *
     * @param array<string, mixed> $args
     */
    public static function argsHash(array $args): string
    {
        ksort($args);

        return hash('sha256', json_encode($args, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    }

    private function sign(string $action, string $argsHash, int $exp): string
    {
        return hash_hmac('sha256', 'contact-confirm:v1|' . $action . '|' . $argsHash . '|' . $exp, $this->secret);
    }
}
