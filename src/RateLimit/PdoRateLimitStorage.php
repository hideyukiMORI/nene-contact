<?php

declare(strict_types=1);

namespace NeneContact\RateLimit;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Middleware\RateLimitStorageInterface;

/**
 * Persistent fixed-window rate-limit storage backed by the application database.
 *
 * NENE2 ships only an in-memory store (per-process, resets each request). Contact targets
 * shared hosting where a shared store is needed but Redis may be unavailable, so counters
 * live in a `rate_limits` table. A future Redis adapter can replace this via an ADR.
 */
final readonly class PdoRateLimitStorage implements RateLimitStorageInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    /**
     * @return array{count: int, reset_at: int}
     */
    public function hit(string $key, int $windowSeconds): array
    {
        $now = time();
        $row = $this->query->fetchOne('SELECT hit_count, reset_at FROM rate_limits WHERE rl_key = ?', [$key]);

        if ($row === null) {
            $resetAt = $now + $windowSeconds;
            $this->query->execute('INSERT INTO rate_limits (rl_key, hit_count, reset_at) VALUES (?, ?, ?)', [$key, 1, $resetAt]);

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $resetAt = (int) $row['reset_at'];

        if ($resetAt <= $now) {
            $resetAt = $now + $windowSeconds;
            $this->query->execute('UPDATE rate_limits SET hit_count = 1, reset_at = ? WHERE rl_key = ?', [$resetAt, $key]);

            return ['count' => 1, 'reset_at' => $resetAt];
        }

        $count = (int) $row['hit_count'] + 1;
        $this->query->execute('UPDATE rate_limits SET hit_count = ? WHERE rl_key = ?', [$count, $key]);

        return ['count' => $count, 'reset_at' => $resetAt];
    }
}
