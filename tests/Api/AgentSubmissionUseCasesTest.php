<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Api\GetAgentSubmissionUseCase;
use NeneContact\Api\ListAgentSubmissionsUseCase;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class AgentSubmissionUseCasesTest extends TestCase
{
    /** @param list<Submission> $seed */
    private function submissions(array $seed, ?Submission $one = null): SubmissionRepositoryInterface
    {
        return new class ($seed, $one) implements SubmissionRepositoryInterface {
            /** @param list<Submission> $all */
            public function __construct(private array $all, private ?Submission $one)
            {
            }

            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->one;
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
                return $this->all;
            }

            public function count(): int
            {
                return count($this->all);
            }
        };
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

    /** @return RequestScopedHolder<int> */
    private function org(int $id): RequestScopedHolder
    {
        /** @var RequestScopedHolder<int> $h */
        $h = new RequestScopedHolder();
        $h->set($id);

        return $h;
    }

    private function submission(): Submission
    {
        return new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'visitor@example.com'], status: 'open', id: 9);
    }

    public function test_list_default_is_not_audited(): void
    {
        $capture = ['events' => []];
        $uc = new ListAgentSubmissionsUseCase($this->submissions([$this->submission()]), $this->audit($capture), $this->org(7));

        $result = $uc->execute(20, 0, false);

        self::assertSame(1, $result->total);
        self::assertCount(0, $capture['events']);
    }

    public function test_list_with_pii_is_audited_as_export(): void
    {
        $capture = ['events' => []];
        $uc = new ListAgentSubmissionsUseCase($this->submissions([$this->submission()]), $this->audit($capture), $this->org(7));

        $uc->execute(20, 0, true);

        self::assertCount(1, $capture['events']);
        self::assertSame('submission.exported', $capture['events'][0]->action);
        self::assertSame(true, $capture['events'][0]->after['include_pii'] ?? null);
        self::assertSame(1, $capture['events'][0]->after['count'] ?? null);
    }

    public function test_get_default_is_not_audited(): void
    {
        $capture = ['events' => []];
        $uc = new GetAgentSubmissionUseCase($this->submissions([], $this->submission()), $this->audit($capture));

        $s = $uc->execute(9, false);

        self::assertSame(9, $s->id);
        self::assertCount(0, $capture['events']);
    }

    public function test_get_with_pii_is_audited_as_viewed(): void
    {
        $capture = ['events' => []];
        $uc = new GetAgentSubmissionUseCase($this->submissions([], $this->submission()), $this->audit($capture));

        $uc->execute(9, true);

        self::assertCount(1, $capture['events']);
        self::assertSame('submission.viewed', $capture['events'][0]->action);
        self::assertSame(9, $capture['events'][0]->entityId);
    }

    public function test_get_rejects_unknown_submission(): void
    {
        $capture = ['events' => []];
        $uc = new GetAgentSubmissionUseCase($this->submissions([], null), $this->audit($capture));

        $this->expectException(SubmissionNotFoundException::class);
        $uc->execute(404, false);
    }
}
