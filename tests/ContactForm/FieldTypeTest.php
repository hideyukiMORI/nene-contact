<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use NeneContact\ContactForm\FieldType;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class FieldTypeTest extends TestCase
{
    /**
     * @return list<array{string}>
     */
    public static function allowedTypes(): array
    {
        return [['text'], ['email'], ['textarea'], ['select'], ['checkbox'], ['date'], ['file'], ['honeypot']];
    }

    #[DataProvider('allowedTypes')]
    public function test_allows_supported_types(string $type): void
    {
        self::assertTrue(FieldType::isAllowed($type));
        self::assertFalse(FieldType::isProhibited($type));
    }

    /**
     * @return list<array{string}>
     */
    public static function prohibitedTypes(): array
    {
        return [
            ['mynumber'],
            ['my_number'],
            ['My-Number'],
            ['individual_number'],
            ['card'],
            ['card_number'],
            ['CreditCard'],
            [' credit_card '],
        ];
    }

    /**
     * A4 (data-protection-compliance.md §8): My Number / raw card number field types
     * cannot be configured and are flagged as prohibited, not merely unsupported.
     */
    #[DataProvider('prohibitedTypes')]
    public function test_prohibits_my_number_and_card_types(string $type): void
    {
        self::assertTrue(FieldType::isProhibited($type), "{$type} must be prohibited");
        self::assertFalse(FieldType::isAllowed($type), "{$type} must not be an allowed type");
    }

    public function test_rejects_unknown_type(): void
    {
        self::assertFalse(FieldType::isAllowed('rating'));
        self::assertFalse(FieldType::isProhibited('rating'));
    }

    public function test_allowed_values_is_the_closed_allowlist(): void
    {
        self::assertSame(
            ['text', 'email', 'textarea', 'select', 'checkbox', 'date', 'file', 'honeypot'],
            FieldType::allowedValues(),
        );
    }
}
