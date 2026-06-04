<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Notification\ChannelSenderInterface;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Submission\Submission;

final class RecordingChannelSender implements ChannelSenderInterface
{
    public int $sent = 0;

    public function __construct(private string $type)
    {
    }

    public function supports(string $channelType): bool
    {
        return $channelType === $this->type;
    }

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
    {
        $this->sent++;
    }
}
