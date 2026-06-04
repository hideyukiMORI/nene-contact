<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;
use Throwable;

/**
 * Dispatches a new submission to every enabled channel of the form, routing each to the
 * {@see ChannelSenderInterface} that supports its type. Per-channel failures are isolated:
 * one channel erroring never blocks the others or the submission (best-effort, charter §7).
 */
final readonly class CompositeSubmissionNotifier implements SubmissionNotifierInterface
{
    /**
     * @param list<ChannelSenderInterface> $senders
     */
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private array $senders,
    ) {
    }

    public function notify(ContactForm $form, Submission $submission): void
    {
        if ($form->id === null) {
            return;
        }

        foreach ($this->channels->findEnabledByContactForm($form->id, $form->organizationId) as $channel) {
            foreach ($this->senders as $sender) {
                if (!$sender->supports($channel->channelType)) {
                    continue;
                }

                try {
                    $sender->send($channel, $form, $submission);
                } catch (Throwable) {
                    // Best-effort: a channel failure is swallowed so other channels and the
                    // submission are unaffected (delivery is observed/retried out of band).
                }

                break;
            }
        }
    }
}
