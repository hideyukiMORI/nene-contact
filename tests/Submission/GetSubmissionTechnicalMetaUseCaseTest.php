<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\GetSubmissionTechnicalMetaUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class GetSubmissionTechnicalMetaUseCaseTest extends TestCase
{
    public function test_returns_ip_and_user_agent_and_records_redacted_audit(): void
    {
        $submission = new Submission(
            organizationId: 7,
            contactFormId: 3,
            fieldValues: ['email' => 'visitor@example.com'],
            status: 'open',
            ip: '203.0.113.9',
            userAgent: 'curl/8',
            id: 42,
        );

        $auditRepo = new InMemoryAuditEventRepository();
        $useCase = new GetSubmissionTechnicalMetaUseCase($this->repoReturning($submission), new AuditRecorder($auditRepo));

        $result = $useCase->execute(99, 42);

        // The caller gets the technical fields back.
        self::assertSame('203.0.113.9', $result->ip);
        self::assertSame('curl/8', $result->userAgent);

        // The disclosure is audited as a sensitive read (ADR 0018) with the operator as actor.
        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('submission_technical_meta.viewed', $event->action);
        self::assertSame('submission', $event->entityType);
        self::assertSame(42, $event->entityId);
        self::assertSame(99, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNull($event->before);

        // The IP/UA values themselves are never written into the audit trail (charter §10).
        $after = json_encode($event->after, JSON_THROW_ON_ERROR);
        self::assertStringNotContainsString('203.0.113.9', $after);
        self::assertStringNotContainsString('curl/8', $after);
        self::assertStringNotContainsString('visitor@example.com', $after);
    }

    public function test_throws_when_submission_not_found(): void
    {
        $auditRepo = new InMemoryAuditEventRepository();
        $useCase = new GetSubmissionTechnicalMetaUseCase($this->repoReturning(null), new AuditRecorder($auditRepo));

        $this->expectException(SubmissionNotFoundException::class);

        try {
            $useCase->execute(99, 404);
        } finally {
            // A miss discloses nothing, so it records nothing.
            self::assertCount(0, $auditRepo->events);
        }
    }

    private function repoReturning(?Submission $submission): SubmissionRepositoryInterface
    {
        return new class ($submission) implements SubmissionRepositoryInterface {
            public function __construct(private ?Submission $submission)
            {
            }

            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->submission;
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
    }
}
