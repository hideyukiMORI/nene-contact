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
        $a = $appearance->toArray();
        self::assertSame('modal', $a['mode']);
        self::assertSame('nene', $a['preset']);
        self::assertSame('#dc5b34', $a['colors']['accent']);
        self::assertSame(14, $a['radius']['form']);
        self::assertSame(1.5, $a['border']['width']);
        self::assertTrue($a['hero']['on']);
    }

    public function test_partial_payload_deep_merges_over_defaults(): void
    {
        [$appearance, $errors] = Appearance::parse([
            'mode' => 'chat',
            'colors' => ['accent' => '#2f8f86'],
            'radius' => ['input' => 12],
            'hero' => ['height' => 200 ],
        ]);

        self::assertSame([], $errors);
        $a = $appearance->toArray();
        self::assertSame('chat', $a['mode']);
        self::assertSame('#2f8f86', $a['colors']['accent']);
        // Sibling colours keep defaults.
        self::assertSame('#ffffff', $a['colors']['surface']);
        self::assertSame(12, $a['radius']['input']);
        self::assertSame(14, $a['radius']['form']);
        self::assertSame(200, $a['hero']['height']);
        self::assertTrue($a['hero']['on']);
    }

    public function test_invalid_leaves_report_prefixed_errors_and_keep_defaults(): void
    {
        [$appearance, $errors] = Appearance::parse([
            'mode' => 'floating',
            'theme' => 'neon',
            'colors' => ['accent' => 'red'],
            'radius' => ['form' => 999],
            'modal' => ['width' => 9999, 'backdrop' => 5],
            'focus' => ['shape' => 'square'],
        ]);

        $fields = array_map(static fn ($e): string => $e->field, $errors);
        self::assertContains('appearance.mode', $fields);
        self::assertContains('appearance.theme', $fields);
        self::assertContains('appearance.colors.accent', $fields);
        self::assertContains('appearance.radius.form', $fields);
        self::assertContains('appearance.modal.width', $fields);
        self::assertContains('appearance.modal.backdrop', $fields);
        self::assertContains('appearance.focus.shape', $fields);

        $a = $appearance->toArray();
        self::assertSame('modal', $a['mode']);
        self::assertSame('light', $a['theme']);
        self::assertSame('#dc5b34', $a['colors']['accent']);
        self::assertSame(14, $a['radius']['form']);
        self::assertSame(460, $a['modal']['width']);
    }

    public function test_pill_radius_sentinel_is_accepted(): void
    {
        // The "pop" preset / pill mode emit radius.button = 999.
        [$appearance, $errors] = Appearance::parse(['radius' => ['button' => 999]]);

        self::assertSame([], $errors);
        self::assertSame(999, $appearance->toArray()['radius']['button']);
    }

    public function test_from_stored_null_yields_defaults(): void
    {
        self::assertEquals(Appearance::defaults()->toArray(), Appearance::fromStored(null)->toArray());
    }

    public function test_valid_hero_media_is_kept_without_errors(): void
    {
        $valid = [
            'm-office',                      // built-in gradient token
            '/media/7/3f8a9c2b1d.png',       // uploaded media path
            'https://cdn.example.com/hero.jpg', // absolute https url
            '',                              // empty = no media
        ];

        foreach ($valid as $media) {
            [$appearance, $errors] = Appearance::parse(['hero' => ['media' => $media]]);

            self::assertSame([], $errors, "expected no errors for hero.media={$media}");
            self::assertSame($media, $appearance->toArray()['hero']['media']);
        }
    }

    public function test_invalid_hero_media_is_rejected_and_falls_back(): void
    {
        $invalid = [
            'data:image/svg+xml,<svg/>',        // data: URI
            'm-team");background:url(evil',      // CSS-breaking characters
            'javascript:alert(1)',              // other scheme
            '/media/../../etc/passwd',          // path traversal
            123,                                 // non-string
        ];

        foreach ($invalid as $media) {
            [$appearance, $errors] = Appearance::parse(['hero' => ['media' => $media]]);

            $fields = array_map(static fn ($e): string => $e->field, $errors);
            self::assertContains('appearance.hero.media', $fields, 'expected a hero.media error for: ' . var_export($media, true));
            self::assertSame('m-team', $appearance->toArray()['hero']['media']);
        }
    }

    public function test_round_trips_through_to_array(): void
    {
        [$appearance] = Appearance::parse(['mode' => 'inline', 'density' => 'comfortable']);
        [$again] = Appearance::parse($appearance->toArray());

        self::assertEquals($appearance->toArray(), $again->toArray());
    }
}
