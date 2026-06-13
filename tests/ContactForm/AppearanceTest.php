<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use NeneContact\ContactForm\Appearance;
use PHPUnit\Framework\TestCase;

final class AppearanceTest extends TestCase
{
    public function test_absent_payload_yields_defaults_without_errors(): void
    {
        [$appearance, $errors] = Appearance::parse(null);

        self::assertSame([], $errors);
        self::assertEquals(Appearance::defaults()->toArray(), $appearance->toArray());
        self::assertSame('floating', $appearance->mode);
        self::assertTrue($appearance->header);
        self::assertFalse($appearance->hero);
    }

    public function test_partial_payload_merges_over_defaults(): void
    {
        [$appearance, $errors] = Appearance::parse(['accent' => '#ff0000', 'radius' => 16, 'hero' => true]);

        self::assertSame([], $errors);
        self::assertSame('#ff0000', $appearance->accent);
        self::assertSame(16, $appearance->radius);
        self::assertTrue($appearance->hero);
        // Untouched keys keep their defaults.
        self::assertSame('#ffffff', $appearance->surface);
        self::assertSame('floating', $appearance->mode);
    }

    public function test_invalid_values_report_field_errors_and_keep_defaults(): void
    {
        [$appearance, $errors] = Appearance::parse([
            'mode' => 'chat',
            'font' => 'comic',
            'accent' => 'red',
            'radius' => 999,
        ]);

        $fields = array_map(static fn ($e): string => $e->field, $errors);
        self::assertContains('appearance.mode', $fields);
        self::assertContains('appearance.font', $fields);
        self::assertContains('appearance.accent', $fields);
        self::assertContains('appearance.radius', $fields);

        // Invalid values do not overwrite the defaults.
        self::assertSame('floating', $appearance->mode);
        self::assertSame('system', $appearance->font);
        self::assertSame('#2563eb', $appearance->accent);
        self::assertSame(8, $appearance->radius);
    }

    public function test_accepts_three_and_six_digit_hex(): void
    {
        [$appearance, $errors] = Appearance::parse(['accent' => '#fff', 'text' => '#0A0B0C']);

        self::assertSame([], $errors);
        self::assertSame('#fff', $appearance->accent);
        self::assertSame('#0A0B0C', $appearance->text);
    }

    public function test_from_stored_null_yields_defaults(): void
    {
        self::assertEquals(Appearance::defaults()->toArray(), Appearance::fromStored(null)->toArray());
    }
}
