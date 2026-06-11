<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormNotFoundException;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\CreateContactFormInput;
use NeneContact\ContactForm\FormField;
use NeneContact\ContactForm\UpdateContactFormUseCase;
use PHPUnit\Framework\TestCase;

final class UpdateContactFormUseCaseTest extends TestCase
{
    private function repoWithForm(): ContactFormRepositoryInterface
    {
        $repo = new class () implements ContactFormRepositoryInterface {
            /** @var array<int, ContactForm> */
            public array $byId = [];

            public function save(ContactForm $form): int
            {
                return 0;
            }

            public function update(ContactForm $form): void
            {
                // Persist exactly what was passed, stamping updated_at like the real store.
                $this->byId[(int) $form->id] = new ContactForm(
                    organizationId: $form->organizationId,
                    name: $form->name,
                    publicFormKey: $form->publicFormKey,
                    defaultLocale: $form->defaultLocale,
                    locales: $form->locales,
                    allowedOrigins: $form->allowedOrigins,
                    fields: $form->fields,
                    status: $form->status,
                    consentRequired: $form->consentRequired,
                    consentLabel: $form->consentLabel,
                    retentionDays: $form->retentionDays,
                    id: $form->id,
                    createdAt: $form->createdAt,
                    updatedAt: '2026-06-05 00:00:00',
                );
            }

            public function softDelete(int $id): void
            {
                unset($this->byId[$id]);
            }

            public function findById(int $id): ?ContactForm
            {
                return $this->byId[$id] ?? null;
            }

            public function publicFormKeyExists(string $publicFormKey): bool
            {
                return false;
            }

            public function findByPublicFormKey(string $publicFormKey): ?ContactForm
            {
                return null;
            }

            /** @return list<ContactForm> */
            public function findAll(int $limit, int $offset): array
            {
                return array_values($this->byId);
            }

            public function count(): int
            {
                return count($this->byId);
            }
        };

        $repo->byId[1] = new ContactForm(
            organizationId: 7,
            name: 'Old name',
            publicFormKey: 'fixed-public-key',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'text', name: 'name', label: ['ja' => '氏名'], required: false, sortOrder: 0)],
            status: 'active',
            id: 1,
            createdAt: '2026-06-04 00:00:00',
            updatedAt: '2026-06-04 00:00:00',
        );

        return $repo;
    }

    /**
     * @return object{events: list<AuditEvent>}&AuditEventRepositoryInterface
     */
    private function auditRepo(): AuditEventRepositoryInterface
    {
        return new class () implements AuditEventRepositoryInterface {
            /** @var list<AuditEvent> */
            public array $events = [];

            public function append(AuditEvent $event): int
            {
                $this->events[] = $event;

                return count($this->events);
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->events;
            }

            public function count(): int
            {
                return count($this->events);
            }
        };
    }

    public function test_updates_editable_fields_keeps_key_and_audits(): void
    {
        $repo = $this->repoWithForm();
        $auditRepo = $this->auditRepo();

        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set(7);

        $useCase = new UpdateContactFormUseCase($repo, new AuditRecorder($auditRepo), $holder);

        $updated = $useCase->execute(5, 1, new CreateContactFormInput(
            name: 'New name',
            defaultLocale: 'ja',
            locales: ['ja', 'en'],
            allowedOrigins: ['https://example.com'],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール', 'en' => 'Email'], required: true, sortOrder: 0)],
        ));

        self::assertSame('New name', $updated->name);
        self::assertSame('fixed-public-key', $updated->publicFormKey, 'public key must be immutable');
        self::assertSame(7, $updated->organizationId);
        self::assertSame('2026-06-04 00:00:00', $updated->createdAt, 'created_at is preserved');
        self::assertCount(1, $updated->fields);
        self::assertSame('email', $updated->fields[0]->name);

        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('contact_form.updated', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNotNull($event->before);
        self::assertNotNull($event->after);
        self::assertSame('Old name', $event->before['name'] ?? null);
        self::assertSame('New name', $event->after['name'] ?? null);
    }

    public function test_missing_form_throws_not_found(): void
    {
        $repo = $this->repoWithForm();

        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set(7);

        $useCase = new UpdateContactFormUseCase($repo, new AuditRecorder($this->auditRepo()), $holder);

        $this->expectException(ContactFormNotFoundException::class);
        $useCase->execute(5, 99, new CreateContactFormInput(
            name: 'X',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'text', name: 'a', label: ['ja' => 'A'], required: false, sortOrder: 0)],
        ));
    }
}
