<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\FormField;
use NeneContact\Submission\CorrectSubmissionUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class CorrectSubmissionUseCaseTest extends TestCase
{
    private function submissionRepo(?Submission $seed): SubmissionRepositoryInterface
    {
        return new class ($seed) implements SubmissionRepositoryInterface {
            /** @var array<string, mixed>|null */
            public ?array $updatedValues = null;

            public function __construct(private ?Submission $current)
            {
            }

            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->current;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            /** @param array<string, mixed> $values */
            public function updateFieldValues(int $id, array $values): void
            {
                $this->updatedValues = $values;
                if ($this->current !== null) {
                    $this->current = new Submission(
                        organizationId: $this->current->organizationId,
                        contactFormId: $this->current->contactFormId,
                        fieldValues: $values,
                        status: $this->current->status,
                        id: $this->current->id,
                    );
                }
            }

            /** @return list<Submission> */
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

    private function formRepo(?ContactForm $form): ContactFormRepositoryInterface
    {
        return new class ($form) implements ContactFormRepositoryInterface {
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
                return $this->form;
            }

            public function publicFormKeyExists(string $publicFormKey): bool
            {
                return false;
            }

            public function findByPublicFormKey(string $publicFormKey): ?ContactForm
            {
                return $this->form;
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
        };
    }

    private function form(): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [
                new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0),
                new FormField(fieldType: 'text', name: 'name', label: ['ja' => '氏名'], required: false, sortOrder: 1),
            ],
            status: 'active',
            id: 2,
        );
    }

    public function test_corrects_value_and_audits_changed_fields_without_pii(): void
    {
        $repo = $this->submissionRepo(new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'old@example.com', 'name' => 'Aki'], status: 'open', id: 9));
        $audit = new InMemoryAuditEventRepository();

        $useCase = new CorrectSubmissionUseCase($repo, $this->formRepo($this->form()), new AuditRecorder($audit));
        $result = $useCase->execute(5, 9, ['email' => 'new@example.com']);

        // Merge: corrected key replaced, untouched key preserved.
        self::assertSame(['email' => 'new@example.com', 'name' => 'Aki'], $result->fieldValues);

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('submission.corrected', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(['email'], $event->after['changed_fields'] ?? null);
        // No raw values (old or new) in the audit trail (§10).
        $json = json_encode([$event->before, $event->after], JSON_THROW_ON_ERROR);
        self::assertStringNotContainsString('old@example.com', $json);
        self::assertStringNotContainsString('new@example.com', $json);
    }

    public function test_rejects_unknown_field(): void
    {
        $repo = $this->submissionRepo(new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'a@example.com'], status: 'open', id: 9));
        $useCase = new CorrectSubmissionUseCase($repo, $this->formRepo($this->form()), new AuditRecorder(new InMemoryAuditEventRepository()));

        $this->expectException(ValidationException::class);

        $useCase->execute(5, 9, ['mynumber' => '123']);
    }

    public function test_rejects_unknown_submission(): void
    {
        $useCase = new CorrectSubmissionUseCase($this->submissionRepo(null), $this->formRepo($this->form()), new AuditRecorder(new InMemoryAuditEventRepository()));

        $this->expectException(SubmissionNotFoundException::class);

        $useCase->execute(5, 404, ['email' => 'x@example.com']);
    }
}
