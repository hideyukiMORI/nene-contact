<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Submission\SubmitPublicFormUseCase;
use PHPUnit\Framework\TestCase;

final class SubmitPublicFormUseCaseTest extends TestCase
{
    public function test_stores_submission_and_records_redacted_audit(): void
    {
        $repo = new class () implements SubmissionRepositoryInterface {
            /** @var list<Submission> */
            public array $created = [];

            public function create(Submission $submission): int
            {
                $this->created[] = $submission;

                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->created[0] ?? null;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->created;
            }

            public function count(): int
            {
                return count($this->created);
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

        $form = new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            id: 3,
        );

        $notifier = new class () implements \NeneContact\Notification\SubmissionNotifierInterface {
            public function notify(\NeneContact\ContactForm\ContactForm $form, Submission $submission): void
            {
            }
        };

        $useCase = new SubmitPublicFormUseCase($repo, new AuditRecorder($auditRepo), $notifier);
        $submission = $useCase->execute($form, ['email' => 'visitor@example.com'], '203.0.113.9', 'curl/8');

        self::assertCount(1, $repo->created);
        self::assertSame(7, $repo->created[0]->organizationId);
        self::assertSame(3, $repo->created[0]->contactFormId);
        self::assertSame('open', $submission->status);

        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('submission.created', $event->action);
        self::assertNull($event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNull($event->before);
        // Redacted: field keys only, never the submitted email value.
        self::assertSame(['field_keys' => ['email']], ['field_keys' => $event->after['field_keys'] ?? null]);
        self::assertStringNotContainsString('visitor@example.com', json_encode($event->after, JSON_THROW_ON_ERROR));

        // No consent required → no consent evidence recorded.
        self::assertNull($repo->created[0]->consentGivenAt);
        self::assertNull($repo->created[0]->consentLabel);
    }

    public function test_records_immutable_consent_evidence_when_form_requires_consent(): void
    {
        $repo = new class () implements SubmissionRepositoryInterface {
            /** @var list<Submission> */
            public array $created = [];

            public function create(Submission $submission): int
            {
                $this->created[] = $submission;

                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->created[0] ?? null;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->created;
            }

            public function count(): int
            {
                return count($this->created);
            }
        };

        $form = new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            consentRequired: true,
            consentLabel: ['ja' => '個人情報の取扱いに同意します'],
            id: 3,
        );

        $useCase = new SubmitPublicFormUseCase($repo, new AuditRecorder($this->nullAuditRepo()), $this->nullNotifier());
        $submission = $useCase->execute($form, ['email' => 'visitor@example.com'], null, null);

        self::assertNotNull($submission->consentGivenAt);
        self::assertSame(['ja' => '個人情報の取扱いに同意します'], $submission->consentLabel);
        self::assertSame($submission->consentGivenAt, $repo->created[0]->consentGivenAt);
    }

    private function nullAuditRepo(): AuditEventRepositoryInterface
    {
        return new class () implements AuditEventRepositoryInterface {
            public function append(AuditEvent $event): int
            {
                return 1;
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };
    }

    private function nullNotifier(): \NeneContact\Notification\SubmissionNotifierInterface
    {
        return new class () implements \NeneContact\Notification\SubmissionNotifierInterface {
            public function notify(\NeneContact\ContactForm\ContactForm $form, Submission $submission): void
            {
            }
        };
    }
}
