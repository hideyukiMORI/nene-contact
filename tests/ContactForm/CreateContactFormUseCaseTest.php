<?php

declare(strict_types=1);

namespace NeneContact\Tests\ContactForm;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\CreateContactFormInput;
use NeneContact\ContactForm\CreateContactFormUseCase;
use NeneContact\ContactForm\FormField;
use PHPUnit\Framework\TestCase;

final class CreateContactFormUseCaseTest extends TestCase
{
    public function test_creates_form_with_key_org_scope_and_audit(): void
    {
        $repo = new class () implements ContactFormRepositoryInterface {
            /** @var array<int, ContactForm> */
            public array $byId = [];
            private int $next = 1;

            public function save(ContactForm $form): int
            {
                $id = $this->next++;
                $this->byId[$id] = new ContactForm(
                    organizationId: $form->organizationId,
                    name: $form->name,
                    publicFormKey: $form->publicFormKey,
                    defaultLocale: $form->defaultLocale,
                    locales: $form->locales,
                    allowedOrigins: $form->allowedOrigins,
                    fields: $form->fields,
                    status: $form->status,
                    id: $id,
                    createdAt: '2026-06-04 00:00:00',
                    updatedAt: '2026-06-04 00:00:00',
                );

                return $id;
            }

            public function update(ContactForm $form): void
            {
                $this->byId[(int) $form->id] = $form;
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

        $auditRepo = new class () implements AuditEventRepositoryInterface {
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

        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set(7);

        $useCase = new CreateContactFormUseCase($repo, new AuditRecorder($auditRepo), $holder);

        $field = new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール', 'en' => 'Email'], required: true, sortOrder: 0);
        $form = $useCase->execute(5, new CreateContactFormInput(
            name: 'Contact us',
            defaultLocale: 'ja',
            locales: ['ja', 'en'],
            allowedOrigins: ['https://example.com'],
            fields: [$field],
        ));

        self::assertGreaterThan(0, $form->id);
        self::assertSame(7, $form->organizationId);
        self::assertSame(32, strlen($form->publicFormKey));
        self::assertCount(1, $form->fields);

        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('contact_form.created', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNull($event->before);
        self::assertNotNull($event->after);
    }
}
