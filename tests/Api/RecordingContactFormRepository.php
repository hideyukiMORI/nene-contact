<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;

/**
 * Test double for the org-scoped form repository. `findById` and `findByPublicFormKey` both
 * filter by `organization_id` in SQL, so a form belonging to another tenant is modelled here
 * as simply absent (construct with `null`). Every lookup is recorded so a test can assert
 * which identifier route was taken.
 */
final class RecordingContactFormRepository implements ContactFormRepositoryInterface
{
    /** @var list<string> */
    public array $lookups = [];

    public function __construct(private ?ContactForm $form)
    {
    }

    public function save(ContactForm $form): int
    {
        return 1;
    }

    public function update(ContactForm $form): void
    {
    }

    public function softDelete(int $id): void
    {
    }

    public function findById(int $id): ?ContactForm
    {
        $this->lookups[] = 'id:' . $id;

        return $this->form !== null && $this->form->id === $id ? $this->form : null;
    }

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm
    {
        $this->lookups[] = 'key:' . $publicFormKey;

        return $this->form !== null && $this->form->publicFormKey === $publicFormKey ? $this->form : null;
    }

    public function publicFormKeyExists(string $publicFormKey): bool
    {
        return false;
    }

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array
    {
        return [];
    }

    public function count(): int
    {
        return 0;
    }
}
