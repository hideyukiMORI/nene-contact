<?php

declare(strict_types=1);

namespace NeneContact\Http;

use Nene2\Http\ClockInterface;

/**
 * Builds the `<prefix>-YYYY-MM-DD.csv` name of a CSV download.
 *
 * The clock is UTC (`Nene2\Http\UtcClock`, required by conformance D4 — never read the wall
 * clock directly). A UTC date is right for storage and wrong for a filename: this product is
 * Japan-only (compliance charter, ADR 0011), so an operator exporting at 03:54 JST would
 * receive a file stamped with **yesterday**, which is exactly what happened on production
 * (#534: `submissions-2026-07-29.csv` next to `audit-events-2026-07-28.csv`, minutes apart).
 *
 * So: keep the UTC instant, present it in the operator's zone.
 */
final readonly class ExportFilename
{
    /** The operator-facing zone. Japan-only product; no per-user timezone exists (ADR 0011). */
    private const DISPLAY_TIMEZONE = 'Asia/Tokyo';

    public function __construct(
        private ClockInterface $clock,
    ) {
    }

    public function forPrefix(string $prefix): string
    {
        $localDate = $this->clock->now()
            ->setTimezone(new \DateTimeZone(self::DISPLAY_TIMEZONE))
            ->format('Y-m-d');

        return $prefix . '-' . $localDate . '.csv';
    }
}
