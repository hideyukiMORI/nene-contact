<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Validation\ValidationError;

/**
 * Per-form embed appearance (Appearance Studio — appearance v2). Drives the embed widget's
 * theme, chrome and display mode. Carries no PII/secrets, so it travels in the public schema
 * and doubles as part of the form's audit snapshot.
 *
 * The shape mirrors the studio model (`window.STUDIO.DEFAULT`): a nested token tree. Every leaf
 * has a default reproducing the current NeNe look, so a legacy row (no stored appearance) and a
 * partial payload both resolve to a complete theme. `parse()` validates each provided leaf and
 * fills the rest from defaults; `toArray()` returns the canonical JSON persisted in
 * `appearance_json` and served in the schema.
 */
final readonly class Appearance
{
    /** @var list<string> */
    public const MODES = ['modal', 'chat', 'inline'];
    /** @var list<string> */
    public const THEMES = ['light', 'dark'];
    /** @var list<string> */
    public const FONTS = ['system', 'sans', 'serif'];
    /** @var list<string> */
    public const BORDER_STYLES = ['solid', 'dashed', 'dotted'];
    /** @var list<string> */
    public const FOCUS_SHAPES = ['ring', 'solid', 'glow'];
    /** @var list<string> */
    public const MOTIONS = ['fade', 'slide', 'scale'];
    /** @var list<string> */
    public const DENSITIES = ['compact', 'cozy', 'comfortable'];
    /** @var list<string> */
    public const BUTTON_STYLES = ['solid', 'outline', 'soft'];
    /** @var list<string> */
    public const MODAL_POSITIONS = ['center', 'right'];
    /** @var list<string> */
    public const LAUNCHER_SIDES = ['left', 'right'];
    /** @var list<string> */
    public const LAUNCHER_SHAPES = ['pill', 'circle'];
    /** @var list<string> */
    public const INLINE_ALIGNS = ['left', 'center', 'right'];
    /** @var list<string> */
    public const HERO_FITS = ['cover', 'contain'];

    /** @var list<string> the eight individually-themeable colour keys (§4B) */
    private const COLOR_KEYS = [
        'accent', 'surface', 'text', 'muted', 'border', 'inputBg', 'error', 'buttonText',
    ];

    /** @param array<string, mixed> $data normalized, complete token tree */
    private function __construct(
        private array $data,
    ) {
    }

    /** @return array<string, mixed> the complete default token tree (current NeNe look) */
    public static function defaultData(): array
    {
        return [
            'mode' => 'modal',
            'preset' => 'nene',
            'theme' => 'light',
            'font' => 'sans',
            'fontH' => 'sans',
            'colors' => [
                'accent' => '#dc5b34',
                'surface' => '#ffffff',
                'text' => '#161a22',
                'muted' => '#5a6273',
                'border' => '#e2e6eb',
                'inputBg' => '#ffffff',
                'error' => '#d14343',
                'buttonText' => '#ffffff',
            ],
            'radius' => ['form' => 14, 'input' => 8, 'button' => 8],
            'border' => ['width' => 1.5, 'style' => 'solid', 'color' => '#e2e6eb'],
            'focus' => ['color' => '#dc5b34', 'width' => 3.5, 'shape' => 'ring'],
            'motion' => ['anim' => 'scale', 'speed' => 320],
            'density' => 'cozy',
            'button' => ['style' => 'solid', 'pill' => false],
            'modal' => ['width' => 460, 'position' => 'center', 'backdrop' => 0.45],
            'chat' => ['oneByOne' => true, 'progress' => true, 'typing' => true],
            'launcher' => ['side' => 'right', 'shape' => 'pill', 'label' => 'お問い合わせ'],
            'inline' => ['align' => 'center'],
            'hero' => [
                'on' => true,
                'media' => 'm-team',
                'fit' => 'cover',
                'height' => 150,
                'inset' => 0,
                'overlay' => 0.28,
                'overlayTitle' => true,
            ],
        ];
    }

    public static function defaults(): self
    {
        return new self(self::defaultData());
    }

    /**
     * Validate + normalize a request payload into a full Appearance. Missing or non-array input
     * yields the defaults; provided leaves are validated and merged over the defaults.
     *
     * @return array{0: self, 1: list<ValidationError>}
     */
    public static function parse(mixed $raw, string $prefix = 'appearance'): array
    {
        $d = self::defaultData();

        if (!is_array($raw)) {
            return [new self($d), []];
        }

        $errors = [];

        $d['mode'] = self::enum($raw, 'mode', self::MODES, $d['mode'], $prefix, $errors);
        $d['theme'] = self::enum($raw, 'theme', self::THEMES, $d['theme'], $prefix, $errors);
        $d['font'] = self::enum($raw, 'font', self::FONTS, $d['font'], $prefix, $errors);
        $d['fontH'] = self::enum($raw, 'fontH', self::FONTS, $d['fontH'], $prefix, $errors);
        if (is_string($raw['preset'] ?? null)) {
            $d['preset'] = mb_substr((string) $raw['preset'], 0, 32);
        }

        $colors = is_array($raw['colors'] ?? null) ? $raw['colors'] : [];
        /** @var array<string, string> $colorDefaults */
        $colorDefaults = $d['colors'];
        foreach (self::COLOR_KEYS as $key) {
            $colorDefaults[$key] = self::color($colors, $key, $colorDefaults[$key], "{$prefix}.colors", $errors);
        }
        $d['colors'] = $colorDefaults;

        $radius = is_array($raw['radius'] ?? null) ? $raw['radius'] : [];
        $d['radius'] = [
            'form' => self::int($radius, 'form', 0, 28, 14, "{$prefix}.radius", $errors),
            'input' => self::int($radius, 'input', 0, 28, 8, "{$prefix}.radius", $errors),
            // Allows the pill sentinel (999) presets/pill mode emit; the studio slider caps at 28.
            'button' => self::int($radius, 'button', 0, 999, 8, "{$prefix}.radius", $errors),
        ];

        $border = is_array($raw['border'] ?? null) ? $raw['border'] : [];
        $d['border'] = [
            'width' => self::num($border, 'width', 0.0, 4.0, 1.5, "{$prefix}.border", $errors),
            'style' => self::enum($border, 'style', self::BORDER_STYLES, 'solid', "{$prefix}.border", $errors),
            'color' => self::color($border, 'color', '#e2e6eb', "{$prefix}.border", $errors),
        ];

        $focus = is_array($raw['focus'] ?? null) ? $raw['focus'] : [];
        $d['focus'] = [
            'color' => self::color($focus, 'color', '#dc5b34', "{$prefix}.focus", $errors),
            'width' => self::num($focus, 'width', 0.0, 6.0, 3.5, "{$prefix}.focus", $errors),
            'shape' => self::enum($focus, 'shape', self::FOCUS_SHAPES, 'ring', "{$prefix}.focus", $errors),
        ];

        $motion = is_array($raw['motion'] ?? null) ? $raw['motion'] : [];
        $d['motion'] = [
            'anim' => self::enum($motion, 'anim', self::MOTIONS, 'scale', "{$prefix}.motion", $errors),
            'speed' => self::int($motion, 'speed', 120, 600, 320, "{$prefix}.motion", $errors),
        ];

        $d['density'] = self::enum($raw, 'density', self::DENSITIES, $d['density'], $prefix, $errors);

        $button = is_array($raw['button'] ?? null) ? $raw['button'] : [];
        $d['button'] = [
            'style' => self::enum($button, 'style', self::BUTTON_STYLES, 'solid', "{$prefix}.button", $errors),
            'pill' => self::bool($button, 'pill', false),
        ];

        $modal = is_array($raw['modal'] ?? null) ? $raw['modal'] : [];
        $d['modal'] = [
            'width' => self::int($modal, 'width', 360, 680, 460, "{$prefix}.modal", $errors),
            'position' => self::enum($modal, 'position', self::MODAL_POSITIONS, 'center', "{$prefix}.modal", $errors),
            'backdrop' => self::num($modal, 'backdrop', 0.0, 0.8, 0.45, "{$prefix}.modal", $errors),
        ];

        $chat = is_array($raw['chat'] ?? null) ? $raw['chat'] : [];
        $d['chat'] = [
            'oneByOne' => self::bool($chat, 'oneByOne', true),
            'progress' => self::bool($chat, 'progress', true),
            'typing' => self::bool($chat, 'typing', true),
        ];

        $launcher = is_array($raw['launcher'] ?? null) ? $raw['launcher'] : [];
        $d['launcher'] = [
            'side' => self::enum($launcher, 'side', self::LAUNCHER_SIDES, 'right', "{$prefix}.launcher", $errors),
            'shape' => self::enum($launcher, 'shape', self::LAUNCHER_SHAPES, 'pill', "{$prefix}.launcher", $errors),
            'label' => is_string($launcher['label'] ?? null) ? mb_substr((string) $launcher['label'], 0, 60) : 'お問い合わせ',
        ];

        $inline = is_array($raw['inline'] ?? null) ? $raw['inline'] : [];
        $d['inline'] = [
            'align' => self::enum($inline, 'align', self::INLINE_ALIGNS, 'center', "{$prefix}.inline", $errors),
        ];

        $hero = is_array($raw['hero'] ?? null) ? $raw['hero'] : [];
        $d['hero'] = [
            'on' => self::bool($hero, 'on', true),
            'media' => is_string($hero['media'] ?? null) ? mb_substr((string) $hero['media'], 0, 64) : 'm-team',
            'fit' => self::enum($hero, 'fit', self::HERO_FITS, 'cover', "{$prefix}.hero", $errors),
            'height' => self::int($hero, 'height', 80, 280, 150, "{$prefix}.hero", $errors),
            'inset' => self::int($hero, 'inset', 0, 28, 0, "{$prefix}.hero", $errors),
            'overlay' => self::num($hero, 'overlay', 0.0, 0.7, 0.28, "{$prefix}.hero", $errors),
            'overlayTitle' => self::bool($hero, 'overlayTitle', true),
        ];

        return [new self($d), $errors];
    }

    /**
     * Rebuild from a stored/decoded JSON map (trusted but defensively re-normalized). null
     * (legacy rows) yields the defaults.
     *
     * @param array<string, mixed>|null $raw
     */
    public static function fromStored(?array $raw): self
    {
        [$appearance] = self::parse($raw ?? []);

        return $appearance;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return $this->data;
    }

    // ---- leaf validators (collect a ValidationError, fall back to default on bad input) ----

    /**
     * @param array<string, mixed> $src
     * @param list<string>         $allowed
     * @param list<ValidationError> $errors
     */
    private static function enum(array $src, string $key, array $allowed, string $default, string $prefix, array &$errors): string
    {
        if (!array_key_exists($key, $src)) {
            return $default;
        }
        $value = (string) $src[$key];
        if (in_array($value, $allowed, true)) {
            return $value;
        }
        $errors[] = new ValidationError("{$prefix}.{$key}", 'Must be one of: ' . implode(', ', $allowed) . '.', 'invalid');

        return $default;
    }

    /**
     * @param array<string, mixed>  $src
     * @param list<ValidationError> $errors
     */
    private static function color(array $src, string $key, string $default, string $prefix, array &$errors): string
    {
        if (!array_key_exists($key, $src)) {
            return $default;
        }
        $value = (string) $src[$key];
        if (preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $value) === 1) {
            return $value;
        }
        $errors[] = new ValidationError("{$prefix}.{$key}", 'Colour must be a hex value like #1a2b3c.', 'invalid');

        return $default;
    }

    /**
     * @param array<string, mixed>  $src
     * @param list<ValidationError> $errors
     */
    private static function int(array $src, string $key, int $min, int $max, int $default, string $prefix, array &$errors): int
    {
        if (!array_key_exists($key, $src)) {
            return $default;
        }
        $value = (int) $src[$key];
        if ($value < $min || $value > $max) {
            $errors[] = new ValidationError("{$prefix}.{$key}", "Must be between {$min} and {$max}.", 'invalid');

            return $default;
        }

        return $value;
    }

    /**
     * @param array<string, mixed>  $src
     * @param list<ValidationError> $errors
     */
    private static function num(array $src, string $key, float $min, float $max, float $default, string $prefix, array &$errors): float
    {
        if (!array_key_exists($key, $src)) {
            return $default;
        }
        $value = (float) $src[$key];
        if ($value < $min || $value > $max) {
            $errors[] = new ValidationError("{$prefix}.{$key}", "Must be between {$min} and {$max}.", 'invalid');

            return $default;
        }

        return $value;
    }

    /** @param array<string, mixed> $src */
    private static function bool(array $src, string $key, bool $default): bool
    {
        return array_key_exists($key, $src) ? (bool) $src[$key] : $default;
    }
}
