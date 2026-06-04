<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use NeneContact\Api\IngestSubmissionUseCase;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\SubmissionNotifierInterface;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class IngestSubmissionUseCaseTest extends TestCase
{
    private function form(bool $consentRequired = false): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'pubkey',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            consentRequired: $consentRequired,
            consentLabel: $consentRequired ? ['ja' => '同意します'] : null,
            id: 3,
        );
    }

    /** @return array{repo: SubmissionRepositoryInterface, created: array<int, Submission>} */
    private function repo(): array
    {
        $created = [];
        $repo = new class ($created) implements SubmissionRepositoryInterface {
            /** @param array<int, Submission> $created */
            public function __construct(public array &$created)
            {
            }

            public function create(Submission $submission): int
            {
                $this->created[] = $submission;

                return 99;
            }

            public function findById(int $id): ?Submission
            {
                return null;
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

        return ['repo' => $repo, 'created' => &$repo->created];
    }

    /** @param array{events: list<AuditEvent>} $capture */
    private function audit(array &$capture): AuditRecorder
    {
        $repo = new class ($capture) implements AuditEventRepositoryInterface {
            /** @param array{events: list<AuditEvent>} $capture */
            public function __construct(private array &$capture)
            {
            }

            public function append(AuditEvent $event): int
            {
                $this->capture['events'][] = $event;

                return count($this->capture['events']);
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->capture['events'];
            }

            public function count(): int
            {
                return count($this->capture['events']);
            }
        };

        return new AuditRecorder($repo);
    }

    public function test_ingest_persists_source_audits_and_notifies(): void
    {
        $r = $this->repo();
        $capture = ['events' => []];
        $spy = new class () implements SubmissionNotifierInterface {
            public int $calls = 0;

            public ?string $source = null;

            public function notify(ContactForm $form, Submission $submission): void
            {
                $this->calls++;
                $this->source = $submission->source;
            }
        };

        $useCase = new IngestSubmissionUseCase($r['repo'], $this->audit($capture), $spy);
        $submission = $useCase->execute($this->form(), ['email' => 'visitor@example.com'], 'concierge');

        self::assertSame(99, $submission->id);
        self::assertSame('concierge', $submission->source);
        self::assertCount(1, $r['created']);
        self::assertSame('concierge', $r['created'][0]->source);
        self::assertNull($r['created'][0]->ip);

        self::assertCount(1, $capture['events']);
        self::assertSame('submission.created', $capture['events'][0]->action);
        self::assertSame('concierge', $capture['events'][0]->after['source'] ?? null);
        // No raw PII in the audit trail (field keys only).
        self::assertStringNotContainsString('visitor@example.com', json_encode($capture['events'][0]->after, JSON_THROW_ON_ERROR));

        self::assertSame(1, $spy->calls);
        self::assertSame('concierge', $spy->source);
    }

    public function test_ingest_snapshots_consent_when_required(): void
    {
        $r = $this->repo();
        $capture = ['events' => []];
        $spy = new class () implements SubmissionNotifierInterface {
            public function notify(ContactForm $form, Submission $submission): void
            {
            }
        };

        $useCase = new IngestSubmissionUseCase($r['repo'], $this->audit($capture), $spy);
        $submission = $useCase->execute($this->form(consentRequired: true), ['email' => 'v@example.com'], 'import');

        self::assertNotNull($submission->consentGivenAt);
        self::assertSame(['ja' => '同意します'], $submission->consentLabel);
        self::assertSame('import', $submission->source);
    }
}
