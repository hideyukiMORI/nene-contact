<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Audit\AuditRecorder;
use NeneContact\Notification\DeleteNotificationChannelUseCase;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelNotFoundException;
use PHPUnit\Framework\TestCase;

final class DeleteNotificationChannelUseCaseTest extends TestCase
{
    private function seededRepo(): InMemoryNotificationChannelRepository
    {
        $repo = new InMemoryNotificationChannelRepository();
        $repo->seed(new NotificationChannel(
            organizationId: 7,
            contactFormId: 3,
            channelType: 'chatwork',
            config: ['api_token' => 'secret', 'room_id' => 'rid78725877'],
            isEnabled: true,
            id: 1,
        ));

        return $repo;
    }

    public function test_soft_deletes_and_audits_without_leaking_config(): void
    {
        $repo = $this->seededRepo();
        $audit = new RecordingAuditEventRepository();

        $useCase = new DeleteNotificationChannelUseCase($repo, new AuditRecorder($audit));
        $useCase->execute(5, 1);

        self::assertNull($repo->findById(1), 'the channel is hidden from reads after deletion');
        self::assertSame([], $repo->listByContactForm(3), 'and drops out of the form listing');

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('notification_channel.deleted', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNotNull($event->before);
        self::assertArrayNotHasKey('config', $event->before ?? []);
        self::assertNull($event->after);
    }

    public function test_missing_channel_throws_not_found(): void
    {
        $useCase = new DeleteNotificationChannelUseCase(new InMemoryNotificationChannelRepository(), new AuditRecorder(new RecordingAuditEventRepository()));

        $this->expectException(NotificationChannelNotFoundException::class);
        $useCase->execute(5, 99);
    }
}
