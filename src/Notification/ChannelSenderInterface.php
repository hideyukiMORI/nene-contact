<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;

/**
 * Dispatches a new submission to one notification channel type. Implementations may throw;
 * {@see CompositeSubmissionNotifier} isolates per-channel failures (charter §7).
 */
interface ChannelSenderInterface
{
    public function supports(string $channelType): bool;

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void;
}
