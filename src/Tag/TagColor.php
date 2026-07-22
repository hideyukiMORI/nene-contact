<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * The fixed set of tag colour tokens (ADR 0019). Tags reuse the console badge palette rather
 * than free hex, so the UI stays visually coherent in light and dark. `slate` is the default.
 */
enum TagColor: string
{
    case Slate = 'slate';
    case Wisteria = 'wisteria';
    case Teal = 'teal';
    case Green = 'green';
    case Amber = 'amber';
    case Rose = 'rose';
    case Orange = 'orange';

    public const DEFAULT = self::Slate;

    public static function isValid(string $value): bool
    {
        return self::tryFrom($value) !== null;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $c): string => $c->value, self::cases());
    }
}
