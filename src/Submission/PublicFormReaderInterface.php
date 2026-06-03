<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\ContactForm\ContactForm;

/**
 * Reads a contact form by its public_form_key WITHOUT organization scoping. The key is
 * globally unique and is itself the tenant locator for the public embed surface
 * (ADR 0014) — this is the one deliberate cross-tenant read, used only by public routes.
 */
interface PublicFormReaderInterface
{
    public function findByPublicFormKey(string $publicFormKey): ?ContactForm;
}
