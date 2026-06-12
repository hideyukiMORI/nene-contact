<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

/**
 * Normalizes the declarative display config of a choice (select) field into the bounded,
 * snake_case shape persisted in form_fields.config_json (choice-field management UI, builder
 * spec v2.0). Mirrors the frontend useChoiceField state.
 *
 * Defensive by design: unknown keys are dropped, numbers are clamped, and derived constraints
 * are enforced server-side so a hand-crafted request cannot persist an inconsistent field —
 * `defaults` is filtered to real option values (and collapsed to one for single-logic styles),
 * and image settings are cleared for styles that cannot show images.
 */
final readonly class ChoiceFieldConfig
{
    private const MAX_OTHER_LEN = 2000;
    private const LAYOUTS = ['card', 'list'];
    private const RATIOS = ['1:1', '4:3', '16:9'];

    /**
     * @param array<string, mixed> $raw
     * @param list<string>         $optionValues the field's option values (defaults reference these)
     *
     * @return array<string, mixed>
     */
    public static function normalize(array $raw, ChoiceStyle $style, array $optionValues): array
    {
        $single = $style->logic() === 'single';

        // Initial selection: only real option values; single-logic keeps at most one.
        $defaults = [];
        $rawDefaults = is_array($raw['defaults'] ?? null) ? $raw['defaults'] : [];
        foreach ($rawDefaults as $value) {
            if (is_string($value) && in_array($value, $optionValues, true) && !in_array($value, $defaults, true)) {
                $defaults[] = $value;
            }
        }
        if ($single && count($defaults) > 1) {
            $defaults = [$defaults[0]];
        }

        $other = (bool) ($raw['other'] ?? false);
        $rawOther = is_array($raw['other_config'] ?? null) ? $raw['other_config'] : [];
        $maxLen = self::int($rawOther['max_len'] ?? 0, 0, self::MAX_OTHER_LEN, 0);
        $otherConfig = [
            'label' => self::str($rawOther['label'] ?? '', 100, 'その他'),
            'placeholder' => self::str($rawOther['placeholder'] ?? '', 255, ''),
            'required' => (bool) ($rawOther['required'] ?? false),
            'max_len' => $maxLen,
        ];

        // Selection-count rule only applies to multiple-logic styles.
        $rawCount = is_array($raw['count_rule'] ?? null) ? $raw['count_rule'] : [];
        $countRule = $single
            ? ['min_on' => false, 'min' => 1, 'max_on' => false, 'max' => 1]
            : [
                'min_on' => (bool) ($rawCount['min_on'] ?? false),
                'min' => self::int($rawCount['min'] ?? 1, 1, 999, 1),
                'max_on' => (bool) ($rawCount['max_on'] ?? false),
                'max' => self::int($rawCount['max'] ?? 1, 1, 999, 1),
            ];

        // Picture choice (image cards) — only the list styles can show images.
        $rawImage = is_array($raw['image'] ?? null) ? $raw['image'] : [];
        $imageEnabled = $style->allowsImage() && (bool) ($rawImage['enabled'] ?? false);
        $layout = self::oneOf($rawImage['layout'] ?? null, self::LAYOUTS, 'card');
        $image = [
            'enabled' => $imageEnabled,
            'layout' => $layout,
            'cols' => self::int($rawImage['cols'] ?? 2, 2, 3, 2),
            'ratio' => self::oneOf($rawImage['ratio'] ?? null, self::RATIOS, '1:1'),
        ];

        return [
            'style' => $style->value,
            'defaults' => $defaults,
            'other' => $other,
            'other_config' => $otherConfig,
            'count_rule' => $countRule,
            'image' => $image,
        ];
    }

    private static function str(mixed $value, int $max, string $fallback): string
    {
        if (!is_string($value)) {
            return $fallback;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? $fallback : mb_substr($trimmed, 0, $max);
    }

    private static function int(mixed $value, int $min, int $max, int $fallback): int
    {
        if (!is_int($value) && !(is_string($value) && is_numeric($value))) {
            return $fallback;
        }

        return max($min, min($max, (int) $value));
    }

    /**
     * @param list<string> $allowed
     */
    private static function oneOf(mixed $value, array $allowed, string $fallback): string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : $fallback;
    }
}
