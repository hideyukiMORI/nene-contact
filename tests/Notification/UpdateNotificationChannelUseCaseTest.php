<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelNotFoundException;
use NeneContact\Notification\UpdateNotificationChannelInput;
use NeneContact\Notification\UpdateNotificationChannelUseCase;
use PHPUnit\Framework\TestCase;

final class UpdateNotificationChannelUseCaseTest extends TestCase
{
    private function chatworkChannel(): NotificationChannel
    {
        return new NotificationChannel(
            organizationId: 7,
            contactFormId: 3,
            channelType: 'chatwork',
            config: ['api_token' => 'secret-token', 'room_id' => '111'],
            isEnabled: true,
        );
    }

    public function test_toggling_enabled_keeps_the_stored_secret(): void
    {
        $repo = new InMemoryNotificationChannelRepository();
        $id = $repo->seed($this->chatworkChannel());
        $audit = new RecordingAuditEventRepository();

        $useCase = new UpdateNotificationChannelUseCase($repo, new AuditRecorder($audit));
        $channel = $useCase->execute(9, $id, new UpdateNotificationChannelInput(isEnabled: false, config: null));

        self::assertFalse($channel->isEnabled);
        // The token is untouched because config was not provided.
        self::assertSame('secret-token', $repo->findById($id)?->config['api_token']);

        self::assertCount(1, $audit->events);
        self::assertSame('notification_channel.updated', $audit->events[0]->action);
        // Audit snapshots never carry the config (secrets stay out of the trail).
        self::assertArrayNotHasKey('config', $audit->events[0]->after ?? []);
    }

    public function test_blank_secret_field_keeps_stored_token_while_fixing_room_id(): void
    {
        $repo = new InMemoryNotificationChannelRepository();
        $id = $repo->seed($this->chatworkChannel());

        $useCase = new UpdateNotificationChannelUseCase($repo, new AuditRecorder(new RecordingAuditEventRepository()));
        // Operator changes room_id (with a pasted rid prefix) and leaves the token blank.
        $useCase->execute(9, $id, new UpdateNotificationChannelInput(
            isEnabled: null,
            config: ['api_token' => '', 'room_id' => 'rid222'],
        ));

        $after = $repo->findById($id);
        self::assertNotNull($after);
        self::assertSame('secret-token', $after->config['api_token'], 'blank secret keeps the stored token');
        self::assertSame('222', $after->config['room_id'], 'rid prefix is stripped');
    }

    public function test_invalid_effective_config_is_rejected(): void
    {
        $repo = new InMemoryNotificationChannelRepository();
        $id = $repo->seed($this->chatworkChannel());

        $useCase = new UpdateNotificationChannelUseCase($repo, new AuditRecorder(new RecordingAuditEventRepository()));

        $this->expectException(ValidationException::class);
        $useCase->execute(9, $id, new UpdateNotificationChannelInput(isEnabled: null, config: ['room_id' => 'abc']));
    }

    public function test_missing_channel_throws_not_found(): void
    {
        $repo = new InMemoryNotificationChannelRepository();

        $useCase = new UpdateNotificationChannelUseCase($repo, new AuditRecorder(new RecordingAuditEventRepository()));

        $this->expectException(NotificationChannelNotFoundException::class);
        $useCase->execute(9, 404, new UpdateNotificationChannelInput(isEnabled: false, config: null));
    }
}
