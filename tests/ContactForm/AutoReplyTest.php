<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use NeneContact\ContactForm\AutoReply;
use PHPUnit\Framework\TestCase;

final class AutoReplyTest extends TestCase
{
    public function test_non_array_input_is_disabled(): void
    {
        [$autoReply, $errors] = AutoReply::parse(null);

        self::assertFalse($autoReply->isEnabled());
        self::assertSame([], $errors);
        self::assertSame(['enabled' => false, 'subject' => [], 'body' => []], $autoReply->toArray());
    }

    public function test_parses_enabled_with_per_locale_copy(): void
    {
        [$autoReply, $errors] = AutoReply::parse([
            'enabled' => true,
            'subject' => ['ja' => 'お問い合わせありがとうございます', 'en' => 'Thanks'],
            'body' => ['ja' => '資料はこちら', 'en' => 'Docs here'],
        ]);

        self::assertSame([], $errors);
        self::assertTrue($autoReply->isEnabled());
        self::assertSame('お問い合わせありがとうございます', $autoReply->subjectFor('ja', 'ja'));
        self::assertSame('Docs here', $autoReply->bodyFor('en', 'ja'));
    }

    public function test_unknown_locale_key_is_an_error(): void
    {
        [, $errors] = AutoReply::parse([
            'enabled' => true,
            'subject' => ['fr' => 'Bonjour'],
            'body' => ['ja' => 'x'],
        ]);

        self::assertNotSame([], $errors);
    }

    public function test_locale_fallback_to_default(): void
    {
        [$autoReply] = AutoReply::parse([
            'enabled' => true,
            'subject' => ['ja' => 'けんめい'],
            'body' => ['ja' => 'ほんぶん'],
        ]);

        // en is not configured → falls back to the default locale's copy.
        self::assertSame('けんめい', $autoReply->subjectFor('en', 'ja'));
        self::assertSame('ほんぶん', $autoReply->bodyFor('en', 'ja'));
    }

    public function test_is_deliverable_requires_enabled_and_default_locale_copy(): void
    {
        [$missingBody] = AutoReply::parse(['enabled' => true, 'subject' => ['ja' => 's'], 'body' => []]);
        self::assertFalse($missingBody->isDeliverable('ja'));

        [$disabled] = AutoReply::parse(['enabled' => false, 'subject' => ['ja' => 's'], 'body' => ['ja' => 'b']]);
        self::assertFalse($disabled->isDeliverable('ja'));

        [$ok] = AutoReply::parse(['enabled' => true, 'subject' => ['ja' => 's'], 'body' => ['ja' => 'b']]);
        self::assertTrue($ok->isDeliverable('ja'));
    }

    public function test_from_stored_round_trips(): void
    {
        $stored = ['enabled' => true, 'subject' => ['ja' => 's'], 'body' => ['ja' => 'b']];

        self::assertSame($stored, AutoReply::fromStored($stored)->toArray());
    }

    public function test_blank_values_are_dropped(): void
    {
        [$autoReply] = AutoReply::parse([
            'enabled' => true,
            'subject' => ['ja' => '  ', 'en' => 'Hi'],
            'body' => ['ja' => 'b'],
        ]);

        // The blank ja subject is dropped, so ja falls back to nothing (en is present).
        self::assertSame(['en' => 'Hi'], $autoReply->toArray()['subject']);
    }
}
