<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface ContactFormRepositoryInterface
{
    /** Persists the form and its fields; returns the new form id. */
    public function save(ContactForm $form): int;

    public function findById(int $id): ?ContactForm;

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm;

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
