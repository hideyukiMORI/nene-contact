<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * Sends a transactional email to an `email` channel's recipient (charter §7).
 */
final readonly class EmailChannelSender implements ChannelSenderInterface
{
    public function __construct(
        private MailerInterface $mailer,
        private OrganizationMailSettingsResolver $mailSettings,
    ) {
    }

    public function supports(string $channelType): bool
    {
        return $channelType === 'email';
    }

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
    {
        $recipient = isset($channel->config['recipient']) ? trim((string) $channel->config['recipient']) : '';
        if ($recipient === '') {
            return;
        }

        $settings = $this->mailSettings->resolve($form->organizationId);

        $this->mailer->send(
            (new Email())
                ->from($settings->from)
                ->to($recipient)
                ->subject('New submission: ' . $form->name)
                ->text($settings->applyTo(SubmissionSummary::text($form, $submission))),
        );
    }
}
