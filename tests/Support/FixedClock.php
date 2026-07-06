<?php

declare(strict_types=1);

namespace NeneContact\Tests\Support;

use DateTimeImmutable;
use Nene2\Http\ClockInterface;

/**
 * Deterministic {@see ClockInterface} for tests: always returns the same instant so
 * time-dependent behaviour (token expiry, rate-limit windows, retention cut-offs) is
 * reproducible. Mirrors the reference form adopted in NeNe Clear — no bespoke clock.
 */
final readonly class FixedClock implements ClockInterface
{
    public function __construct(private string $instant = '2026-05-30T09:00:00+00:00')
    {
    }

    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable($this->instant);
    }
}
