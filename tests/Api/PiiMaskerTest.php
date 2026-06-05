<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use NeneContact\Submission\PiiMasker;
use PHPUnit\Framework\TestCase;

final class PiiMaskerTest extends TestCase
{
    public function test_masks_email_keeping_only_hints(): void
    {
        $masked = PiiMasker::maskValues(['email' => 'john.doe@example.com']);

        self::assertSame('j***@e***.com', $masked['email']);
        self::assertStringNotContainsString('john.doe', $masked['email']);
        self::assertStringNotContainsString('example', $masked['email']);
    }

    public function test_masks_free_text_without_revealing_length(): void
    {
        $masked = PiiMasker::maskValues(['name' => 'Yamada Taro']);

        self::assertSame('Y***', $masked['name']);
        self::assertStringNotContainsString('amada', $masked['name']);
    }

    public function test_leaves_non_string_selections_legible(): void
    {
        $masked = PiiMasker::maskValues(['agree' => true, 'quantity' => 3]);

        self::assertTrue($masked['agree']);
        self::assertSame(3, $masked['quantity']);
    }

    public function test_masks_array_values_recursively(): void
    {
        $masked = PiiMasker::maskValues(['tags' => ['alpha', 'bravo']]);

        self::assertSame(['a***', 'b***'], $masked['tags']);
    }

    public function test_empty_string_stays_empty(): void
    {
        $masked = PiiMasker::maskValues(['note' => '']);

        self::assertSame('', $masked['note']);
    }
}
