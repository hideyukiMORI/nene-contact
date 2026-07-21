<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Notification\GetNotificationChannelUseCase;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelNotFoundException;
use PHPUnit\Framework\TestCase;

final class GetNotificationChannelUseCaseTest extends TestCase
{
    public function test_returns_the_channel_when_present(): void
    {
        $repo = new InMemoryNotificationChannelRepository();
        $id = $repo->seed(new NotificationChannel(
            organizationId: 7,
            contactFormId: 3,
            channelType: 'slack',
            config: ['webhook_url' => 'https://hooks.slack.com/services/x'],
            isEnabled: true,
        ));

        $channel = (new GetNotificationChannelUseCase($repo))->execute($id);

        self::assertSame($id, $channel->id);
        self::assertSame('slack', $channel->channelType);
    }

    public function test_soft_deleted_channel_reads_as_not_found(): void
    {
        $repo = new InMemoryNotificationChannelRepository();
        $id = $repo->seed(new NotificationChannel(
            organizationId: 7,
            contactFormId: 3,
            channelType: 'email',
            config: ['recipient' => 'ops@example.com'],
            isEnabled: true,
        ));
        $repo->softDelete($id);

        $this->expectException(NotificationChannelNotFoundException::class);
        (new GetNotificationChannelUseCase($repo))->execute($id);
    }
}
