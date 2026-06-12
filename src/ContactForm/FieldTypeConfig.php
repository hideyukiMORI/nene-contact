<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

/**
 * Normalizes the declarative per-type config of a non-choice field into the bounded, snake_case
 * shape persisted in form_fields.config_json (field-config UI, builder spec v1.0 / 総合実装指示書).
 * Mirrors the frontend FIELD_TYPES state. Select fields use {@see ChoiceFieldConfig} instead;
 * checkbox/honeypot carry no config (null).
 *
 * Defensive by design: unknown keys are dropped, enums fall back to a safe default, and numbers
 * are clamped — a hand-crafted request cannot persist an out-of-range or inconsistent field.
 */
final readonly class FieldTypeConfig
{
    private const TEXT_FORMATS = ['none', 'kana', 'alnum'];
    private const PHONE_FORMATS = ['jp', 'jp-nohyphen', 'intl'];
    private const DOMAIN_MODES = ['none', 'allow', 'block'];
    private const ROWS = ['sm', 'md', 'lg'];
    private const DATE_MODES = ['date', 'datetime', 'time'];
    private const DATE_RANGES = ['none', 'future', 'past', 'between'];
    private const DATE_DEFAULTS = ['none', 'today'];
    private const FILE_SIZES = [5, 10, 25];
    private const MAX_LEN = 9999;

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>|null null for types without a config (checkbox/honeypot/select)
     */
    public static function normalize(string $type, array $raw): ?array
    {
        return match ($type) {
            FieldType::Text->value => self::textLike($raw),
            FieldType::Textarea->value => self::textareaConfig($raw),
            FieldType::Email->value => self::emailConfig($raw),
            FieldType::Phone->value => ['format' => self::oneOf($raw['format'] ?? null, self::PHONE_FORMATS, 'jp')],
            FieldType::Date->value => self::dateConfig($raw),
            FieldType::File->value => self::fileConfig($raw),
            default => null,
        };
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function textLike(array $raw): array
    {
        return [
            'format' => self::oneOf($raw['format'] ?? null, self::TEXT_FORMATS, 'none'),
            ...self::charLimit($raw),
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function textareaConfig(array $raw): array
    {
        return [
            'rows' => self::oneOf($raw['rows'] ?? null, self::ROWS, 'md'),
            ...self::charLimit($raw),
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function charLimit(array $raw): array
    {
        return [
            'min_on' => (bool) ($raw['min_on'] ?? false),
            'min' => self::int($raw['min'] ?? 1, 1, self::MAX_LEN, 1),
            'max_on' => (bool) ($raw['max_on'] ?? false),
            'max' => self::int($raw['max'] ?? 100, 1, self::MAX_LEN, 100),
            'counter' => (bool) ($raw['counter'] ?? false),
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function emailConfig(array $raw): array
    {
        $domainMode = self::oneOf($raw['domain_mode'] ?? null, self::DOMAIN_MODES, 'none');

        return [
            'confirm' => (bool) ($raw['confirm'] ?? false),
            'domain_mode' => $domainMode,
            // Domains only matter when restricted; comma-separated, bounded.
            'domains' => $domainMode === 'none' ? '' : self::str($raw['domains'] ?? '', 500),
            'autoreply' => (bool) ($raw['autoreply'] ?? false),
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function dateConfig(array $raw): array
    {
        $range = self::oneOf($raw['range'] ?? null, self::DATE_RANGES, 'none');

        return [
            'mode' => self::oneOf($raw['mode'] ?? null, self::DATE_MODES, 'date'),
            'range' => $range,
            'from' => $range === 'between' ? self::str($raw['from'] ?? '', 20) : '',
            'to' => $range === 'between' ? self::str($raw['to'] ?? '', 20) : '',
            'def' => self::oneOf($raw['def'] ?? null, self::DATE_DEFAULTS, 'none'),
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array<string, mixed>
     */
    private static function fileConfig(array $raw): array
    {
        $multiple = (bool) ($raw['multiple'] ?? false);
        $size = self::int($raw['max_size'] ?? 10, 5, 25, 10);

        return [
            'fmt_image' => (bool) ($raw['fmt_image'] ?? false),
            'fmt_pdf' => (bool) ($raw['fmt_pdf'] ?? false),
            'fmt_doc' => (bool) ($raw['fmt_doc'] ?? false),
            'max_size' => in_array($size, self::FILE_SIZES, true) ? $size : 10,
            'multiple' => $multiple,
            'max_count' => $multiple ? self::int($raw['max_count'] ?? 3, 2, 20, 3) : 1,
        ];
    }

    private static function str(mixed $value, int $max): string
    {
        return is_string($value) ? mb_substr(trim($value), 0, $max) : '';
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
