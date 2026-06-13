<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Validation\ValidationError;

/**
 * Per-form embed appearance (builder spec — appearance v1). Drives the embed widget's theme
 * and chrome: display mode, the three theme colours, corner radius, font family, and whether
 * the title/hero band are shown. Carries no PII/secrets, so it travels in the public schema
 * and doubles as part of the form's audit snapshot.
 *
 * All fields have safe defaults that reproduce the widget's original hardcoded look, so a form
 * with no stored appearance (legacy rows) and a partial payload both resolve to a full theme.
 */
final readonly class Appearance
{
    /** @var list<string> */
    public const MODES = ['floating', 'button', 'inline'];

    /** @var list<string> */
    public const FONTS = ['system', 'sans', 'serif'];

    private const MAX_RADIUS = 24;

    public function __construct(
        public string $mode,
        public string $accent,
        public string $surface,
        public string $text,
        public int $radius,
        public string $font,
        public bool $header,
        public bool $hero,
    ) {
    }

    public static function defaults(): self
    {
        return new self(
            mode: 'floating',
            accent: '#2563eb',
            surface: '#ffffff',
            text: '#111827',
            radius: 8,
            font: 'system',
            header: true,
            hero: false,
        );
    }

    /**
     * Validate and normalize a request payload into a full Appearance. Missing or non-array
     * input yields the defaults; provided keys are validated and merged over the defaults.
     *
     * @return array{0: self, 1: list<ValidationError>} the appearance and any field errors
     */
    public static function parse(mixed $raw, string $prefix = 'appearance'): array
    {
        $d = self::defaults();

        if (!is_array($raw)) {
            return [$d, []];
        }

        $errors = [];

        $mode = $d->mode;
        if (array_key_exists('mode', $raw)) {
            $candidate = (string) $raw['mode'];
            if (in_array($candidate, self::MODES, true)) {
                $mode = $candidate;
            } else {
                $errors[] = new ValidationError("{$prefix}.mode", 'Mode must be one of: ' . implode(', ', self::MODES) . '.', 'invalid');
            }
        }

        $font = $d->font;
        if (array_key_exists('font', $raw)) {
            $candidate = (string) $raw['font'];
            if (in_array($candidate, self::FONTS, true)) {
                $font = $candidate;
            } else {
                $errors[] = new ValidationError("{$prefix}.font", 'Font must be one of: ' . implode(', ', self::FONTS) . '.', 'invalid');
            }
        }

        $accent = self::color($raw, 'accent', $prefix, $d->accent, $errors);
        $surface = self::color($raw, 'surface', $prefix, $d->surface, $errors);
        $text = self::color($raw, 'text', $prefix, $d->text, $errors);

        $radius = $d->radius;
        if (array_key_exists('radius', $raw)) {
            $candidate = (int) $raw['radius'];
            if ($candidate < 0 || $candidate > self::MAX_RADIUS) {
                $errors[] = new ValidationError("{$prefix}.radius", 'Radius must be between 0 and ' . self::MAX_RADIUS . ' px.', 'invalid');
            } else {
                $radius = $candidate;
            }
        }

        $header = array_key_exists('header', $raw) ? (bool) $raw['header'] : $d->header;
        $hero = array_key_exists('hero', $raw) ? (bool) $raw['hero'] : $d->hero;

        return [new self($mode, $accent, $surface, $text, $radius, $font, $header, $hero), $errors];
    }

    /**
     * Rebuild from a stored/decoded JSON map (trusted but defensively clamped). null (legacy
     * rows with no stored appearance) yields the defaults.
     *
     * @param array<string, mixed>|null $raw
     */
    public static function fromStored(?array $raw): self
    {
        // Reuse the same normalization; stored values that somehow drifted out of range fall
        // back to defaults per field rather than surfacing as errors.
        [$appearance] = self::parse($raw ?? []);

        return $appearance;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'mode' => $this->mode,
            'accent' => $this->accent,
            'surface' => $this->surface,
            'text' => $this->text,
            'radius' => $this->radius,
            'font' => $this->font,
            'header' => $this->header,
            'hero' => $this->hero,
        ];
    }

    /**
     * @param array<string, mixed> $raw
     * @param list<ValidationError> $errors
     */
    private static function color(array $raw, string $key, string $prefix, string $default, array &$errors): string
    {
        if (!array_key_exists($key, $raw)) {
            return $default;
        }

        $candidate = (string) $raw[$key];
        if (preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $candidate) === 1) {
            return $candidate;
        }

        $errors[] = new ValidationError("{$prefix}.{$key}", 'Colour must be a hex value like #1a2b3c.', 'invalid');

        return $default;
    }
}
