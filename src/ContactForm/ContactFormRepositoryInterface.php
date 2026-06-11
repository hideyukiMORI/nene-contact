<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface ContactFormRepositoryInterface
{
    /** Persists the form and its fields; returns the new form id. */
    public function save(ContactForm $form): int;

    /** Replaces the editable columns and the field set of an existing (org-scoped) form. */
    public function update(ContactForm $form): void;

    /** Soft-deletes an (org-scoped) form; deleted forms drop out of every read (ADR 0016). */
    public function softDelete(int $id): void;

    public function findById(int $id): ?ContactForm;

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm;

    /**
     * True when any form (any tenant, including soft-deleted) already uses this public key.
     * The public form URL is global, so a custom key must be globally unique.
     */
    public function publicFormKeyExists(string $publicFormKey): bool;

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
