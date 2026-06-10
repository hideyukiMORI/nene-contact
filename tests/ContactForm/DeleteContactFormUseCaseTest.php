<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormNotFoundException;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\DeleteContactFormUseCase;
use NeneContact\ContactForm\FormField;
use PHPUnit\Framework\TestCase;

final class DeleteContactFormUseCaseTest extends TestCase
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
            }

            public function softDelete(int $id): void
            {
                // A soft delete hides the form from every read.
                unset($this->byId[$id]);
            }

            public function findById(int $id): ?ContactForm
            {
                return $this->byId[$id] ?? null;
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
            name: 'Contact us',
            publicFormKey: 'k',
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

    public function test_soft_deletes_and_audits(): void
    {
        $repo = $this->repoWithForm();
        $auditRepo = $this->auditRepo();

        $useCase = new DeleteContactFormUseCase($repo, new AuditRecorder($auditRepo));

        $useCase->execute(5, 1);

        self::assertNull($repo->findById(1), 'the form is hidden from reads after deletion');

        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('contact_form.deleted', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNotNull($event->before);
        self::assertNull($event->after);
        self::assertSame('Contact us', $event->before['name'] ?? null);
    }

    public function test_missing_form_throws_not_found(): void
    {
        $repo = $this->repoWithForm();

        $useCase = new DeleteContactFormUseCase($repo, new AuditRecorder($this->auditRepo()));

        $this->expectException(ContactFormNotFoundException::class);
        $useCase->execute(5, 99);
    }
}
