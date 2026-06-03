<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;

/**
 * Dispatches transactional notifications for a new submission to the form's configured
 * channels (charter §7). Best-effort: implementations may throw, but callers must not let
 * a notification failure fail the submission.
 */
interface SubmissionNotifierInterface
{
    public function notify(ContactForm $form, Submission $submission): void;
}
