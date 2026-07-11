<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Middleware\RateLimitStorageInterface;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FieldType;
use NeneContact\Submission\PiiMasker;
use NeneContact\Submission\Submission;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Throwable;

/**
 * Sends the per-form sender auto-reply on a successful public submit (#360).
 *
 * Guarantees (the GO conditions):
 *  1. **Fixed template** — subject/body are the operator's per-locale copy; no submission value
 *     is ever interpolated, so a hostile submission cannot be reflected into mail to a spoofed
 *     address (backscatter mitigation).
 *  2. **Per-recipient cooldown** — a distinct layer from the submit rate limit: at most one
 *     auto-reply per (form, recipient) within {@see COOLDOWN_SECONDS}. The address is hashed,
 *     never stored raw (§10).
 *  3. **Best-effort** — never throws into the submit path; every outcome (sent / suppressed /
 *     failed) is recorded as an audit event so delivery is observable.
 *  4. **No PII in the trail** — the recipient is masked in the audit snapshot.
 */
final readonly class SenderAutoReply implements SenderAutoReplyInterface
{
    /** One auto-reply per (form, recipient) per this window. */
    private const COOLDOWN_SECONDS = 600;

    public function __construct(
        private MailerInterface $mailer,
        private string $fromAddress,
        private RateLimitStorageInterface $cooldown,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function send(ContactForm $form, Submission $submission): void
    {
        if ($form->id === null || $submission->id === null) {
            return;
        }

        $autoReply = $form->autoReply;
        if ($autoReply === null || !$autoReply->isDeliverable($form->defaultLocale)) {
            return;
        }

        $recipient = $this->recipientEmail($form, $submission);
        if ($recipient === null) {
            return;
        }

        // Per-recipient cooldown (condition 2). The window is consumed on the first hit; a
        // repeat within it is suppressed regardless of the earlier send's success — this bounds
        // how many auto-replies a spoofed address can be made to receive.
        $key = 'autoreply:' . $form->id . ':' . hash('sha256', mb_strtolower($recipient));
        if ($this->cooldown->hit($key, self::COOLDOWN_SECONDS)['count'] > 1) {
            $this->record($form, $submission, $recipient, 'autoreply.suppressed');

            return;
        }

        $locale = $submission->locale ?? $form->defaultLocale;

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->fromAddress)
                    ->to($recipient)
                    ->subject($autoReply->subjectFor($locale, $form->defaultLocale))
                    ->text($autoReply->bodyFor($locale, $form->defaultLocale)),
            );
            $this->record($form, $submission, $recipient, 'autoreply.sent');
        } catch (Throwable) {
            // Best-effort (condition 3): the submission already succeeded; record and move on.
            $this->record($form, $submission, $recipient, 'autoreply.failed');
        }
    }

    /**
     * The reply goes to the value of the form's first `email` field, when it is a valid address.
     * No email field / no value → no auto-reply.
     */
    private function recipientEmail(ContactForm $form, Submission $submission): ?string
    {
        foreach ($form->fields as $field) {
            if ($field->fieldType !== FieldType::Email->value) {
                continue;
            }

            $value = $submission->fieldValues[$field->name] ?? null;
            if (is_string($value) && filter_var(trim($value), FILTER_VALIDATE_EMAIL) !== false) {
                return trim($value);
            }
        }

        return null;
    }

    /**
     * Record the outcome (ADR 0013). The recipient is masked (PiiMasker) — the trail carries no
     * raw personal data (§10).
     */
    private function record(ContactForm $form, Submission $submission, string $recipient, string $action): void
    {
        $this->audit->record(
            null,
            $submission->organizationId,
            $action,
            'autoreply',
            $submission->id,
            null,
            [
                'contact_form_id' => $form->id,
                'recipient' => PiiMasker::maskValues(['email' => $recipient])['email'],
            ],
        );
    }
}
