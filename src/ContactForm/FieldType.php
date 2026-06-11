<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

/**
 * Single source of truth for contact-form field types (declarative JSON only —
 * no operator JavaScript, ADR 0010).
 *
 * Compliance (data-protection-compliance.md §8, Definition of Done A4): the
 * allowlist is **closed**, so any unknown type is rejected, and there is no
 * field type for 要配慮個人情報 — it is never a silent default. My Number and raw
 * payment card numbers are additionally named in {@see PROHIBITED} so the
 * prohibition is intentional, auditable, and testable rather than incidental.
 */
enum FieldType: string
{
    case Text = 'text';
    case Email = 'email';
    case Textarea = 'textarea';
    case Select = 'select';
    case Checkbox = 'checkbox';
    case Date = 'date';
    case File = 'file';
    case Honeypot = 'honeypot';

    /**
     * Identifiers Contact will never accept as a field type. APPI charter §8 prohibits
     * collecting My Number (マイナンバー) and raw payment card numbers; these variants are
     * listed so a prohibited configuration fails with a compliance-specific error, not a
     * generic "unsupported type".
     *
     * @var list<string>
     */
    public const PROHIBITED = [
        'mynumber',
        'my_number',
        'my-number',
        'individual_number',
        'individualnumber',
        'card',
        'card_number',
        'cardnumber',
        'credit_card',
        'creditcard',
    ];

    /** @return list<string> */
    public static function allowedValues(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }

    public static function isAllowed(string $value): bool
    {
        return self::tryFrom($value) !== null;
    }

    public static function isProhibited(string $value): bool
    {
        return in_array(strtolower(trim($value)), self::PROHIBITED, true);
    }
}
