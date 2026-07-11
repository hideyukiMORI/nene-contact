<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;

/**
 * Sends the per-form sender auto-reply for a successful public submit (#360). Best-effort:
 * implementations must never throw into the submit path — a delivery failure is swallowed and
 * recorded, never fatal (charter §7).
 */
interface SenderAutoReplyInterface
{
    public function send(ContactForm $form, Submission $submission): void;
}
