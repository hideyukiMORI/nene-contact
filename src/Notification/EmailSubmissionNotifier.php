<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Submission\Submission;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * Sends a transactional email to each enabled `email` channel of the form. The body is a
 * field summary (labels + values) for the operator who owns the data; no secrets are
 * included (charter §7). Slack/Chatwork channels are stored but not yet dispatched.
 */
final readonly class EmailSubmissionNotifier implements SubmissionNotifierInterface
{
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private MailerInterface $mailer,
        private string $fromAddress,
    ) {
    }

    public function notify(ContactForm $form, Submission $submission): void
    {
        if ($form->id === null) {
            return;
        }

        foreach ($this->channels->findEnabledByContactForm($form->id, $form->organizationId) as $channel) {
            if ($channel->channelType !== 'email') {
                continue;
            }

            $recipient = isset($channel->config['recipient']) ? trim((string) $channel->config['recipient']) : '';
            if ($recipient === '') {
                continue;
            }

            $this->mailer->send(
                (new Email())
                    ->from($this->fromAddress)
                    ->to($recipient)
                    ->subject('New submission: ' . $form->name)
                    ->text($this->body($form, $submission)),
            );
        }
    }

    private function body(ContactForm $form, Submission $submission): string
    {
        $labels = [];
        foreach ($form->fields as $field) {
            if ($field->fieldType === 'honeypot') {
                continue;
            }
            $labels[$field->name] = $this->label($field, $form->defaultLocale);
        }

        $lines = ['New submission for "' . $form->name . '":', ''];
        foreach ($submission->fieldValues as $name => $value) {
            $label = $labels[$name] ?? $name;
            $lines[] = $label . ': ' . (is_scalar($value) ? (string) $value : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        }

        return implode("\n", $lines) . "\n";
    }

    private function label(FormField $field, string $locale): string
    {
        if (isset($field->label[$locale]) && $field->label[$locale] !== '') {
            return $field->label[$locale];
        }

        return $field->name;
    }
}
