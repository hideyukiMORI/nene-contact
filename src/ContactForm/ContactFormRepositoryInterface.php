<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface ContactFormRepositoryInterface
{
    /** Persists the form and its fields; returns the new form id. */
    public function save(ContactForm $form): int;

    /** Replaces the editable columns and the field set of an existing (org-scoped) form. */
    public function update(ContactForm $form): void;

    public function findById(int $id): ?ContactForm;

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm;

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
