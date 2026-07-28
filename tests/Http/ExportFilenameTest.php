<?php

declare(strict_types=1);

namespace NeneContact\Tests\Http;

use Nene2\Http\ClockInterface;
use NeneContact\Http\ExportFilename;
use PHPUnit\Framework\TestCase;

final class ExportFilenameTest extends TestCase
{
    public function test_names_the_file_after_the_operators_local_date_not_utc(): void
    {
        // 2026-07-28 18:54 UTC is 2026-07-29 03:54 JST — the window where the two dates differ.
        // On production this shipped `audit-events-2026-07-28.csv` minutes after
        // `submissions-2026-07-29.csv` (#534).
        $filename = new ExportFilename($this->clockAt('2026-07-28T18:54:00+00:00'));

        self::assertSame('audit-events-2026-07-29.csv', $filename->forPrefix('audit-events'));
        self::assertSame('submissions-2026-07-29.csv', $filename->forPrefix('submissions'));
    }

    public function test_uses_the_same_date_when_utc_and_jst_agree(): void
    {
        $filename = new ExportFilename($this->clockAt('2026-07-29T02:00:00+00:00'));

        self::assertSame('audit-events-2026-07-29.csv', $filename->forPrefix('audit-events'));
    }

    public function test_a_late_jst_evening_does_not_roll_forward(): void
    {
        // 2026-07-29 14:00 UTC = 2026-07-29 23:00 JST — still the same JST day.
        $filename = new ExportFilename($this->clockAt('2026-07-29T14:00:00+00:00'));

        self::assertSame('submissions-2026-07-29.csv', $filename->forPrefix('submissions'));
    }

    private function clockAt(string $instant): ClockInterface
    {
        return new class ($instant) implements ClockInterface {
            public function __construct(private string $instant)
            {
            }

            public function now(): \DateTimeImmutable
            {
                return new \DateTimeImmutable($this->instant, new \DateTimeZone('UTC'));
            }
        };
    }
}
