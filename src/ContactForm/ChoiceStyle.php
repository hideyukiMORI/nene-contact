<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

/**
 * Single source of truth for choice-field display styles (choice-field management UI,
 * builder spec v2.0). Each style internalizes its selection logic — "radio = single",
 * "checkbox = multiple" — so the operator picks a look and the logic follows (no separate
 * single/multiple toggle). Mirrors the frontend STYLES catalog (choice-core.ts) and is
 * kept in sync with it.
 *
 * Declarative JSON only — no operator JavaScript (ADR 0010). The allowlist is closed, so an
 * unknown style is rejected rather than silently accepted.
 */
enum ChoiceStyle: string
{
    case Radio = 'radio';       // single
    case Dropdown = 'dropdown'; // single
    case Segment = 'segment';   // single
    case Checkbox = 'checkbox'; // multiple
    case Tags = 'tags';         // multiple
    case Chips = 'chips';       // multiple

    /** Selection logic internalized by the style. */
    public function logic(): string
    {
        return match ($this) {
            self::Radio, self::Dropdown, self::Segment => 'single',
            self::Checkbox, self::Tags, self::Chips => 'multiple',
        };
    }

    /** Picture choice (image cards) is only meaningful for the vertical list styles. */
    public function allowsImage(): bool
    {
        return $this === self::Radio || $this === self::Checkbox;
    }

    public static function isAllowed(string $value): bool
    {
        return self::tryFrom($value) !== null;
    }
}
