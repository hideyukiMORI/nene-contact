<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Notification\ChannelConfigValidator;
use PHPUnit\Framework\TestCase;

final class ChannelConfigValidatorTest extends TestCase
{
    public function test_strips_pasted_rid_prefix_from_chatwork_room_id(): void
    {
        $normalized = ChannelConfigValidator::normalize('chatwork', ['api_token' => ' t ', 'room_id' => 'rid78725877']);

        self::assertSame('78725877', $normalized['room_id']);
        self::assertSame('t', $normalized['api_token'], 'strings are trimmed');
        self::assertSame([], ChannelConfigValidator::validate('chatwork', $normalized));
    }

    public function test_rejects_non_numeric_chatwork_room_id(): void
    {
        // A garbled value ("ridABC") is not a bare rid+digits, so it is not stripped and fails.
        $normalized = ChannelConfigValidator::normalize('chatwork', ['api_token' => 'tok', 'room_id' => 'ridABC']);
        $errors = ChannelConfigValidator::validate('chatwork', $normalized);

        self::assertCount(1, $errors);
        self::assertSame('config.room_id', $errors[0]->field);
    }

    public function test_requires_chatwork_token(): void
    {
        $errors = ChannelConfigValidator::validate('chatwork', ['room_id' => '123']);

        self::assertCount(1, $errors);
        self::assertSame('config.api_token', $errors[0]->field);
    }

    public function test_slack_requires_hooks_slack_com_url(): void
    {
        self::assertNotSame([], ChannelConfigValidator::validate('slack', ['webhook_url' => 'https://example.com/x']));
        self::assertSame([], ChannelConfigValidator::validate('slack', ['webhook_url' => 'https://hooks.slack.com/services/T/B/x']));
    }

    public function test_email_requires_valid_recipient(): void
    {
        self::assertNotSame([], ChannelConfigValidator::validate('email', ['recipient' => 'not-an-email']));
        self::assertSame([], ChannelConfigValidator::validate('email', ['recipient' => 'ops@example.com']));
    }

    public function test_webhook_requires_url_and_secret(): void
    {
        self::assertCount(2, ChannelConfigValidator::validate('webhook', []));
        self::assertSame([], ChannelConfigValidator::validate('webhook', ['url' => 'https://example.com/hook', 'secret' => 's']));
    }
}
