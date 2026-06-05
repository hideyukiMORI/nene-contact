<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Submission\ListSubmissionsResult;
use NeneContact\Submission\ListSubmissionsUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionFilter;
use NeneContact\Submission\SubmissionResponse;
use NeneContact\Submission\SubmissionSearchRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class SubmissionListMaskingTest extends TestCase
{
    public function testListItemMasksFieldValues(): void
    {
        $submission = new Submission(
            organizationId: 1,
            contactFormId: 3,
            fieldValues: ['email' => 'john.doe@example.com', 'name' => 'Yamada'],
            status: 'open',
            id: 9,
            submittedAt: '2026-06-04 00:00:00',
        );

        $item = SubmissionResponse::toListItem($submission);

        // Raw PII must never appear in the bulk list (charter §11).
        self::assertSame('open', $item['status']);
        self::assertIsArray($item['field_values']);
        self::assertNotSame('john.doe@example.com', $item['field_values']['email']);
        self::assertNotSame('Yamada', $item['field_values']['name']);
        self::assertStringContainsString('***', (string) $item['field_values']['email']);
        // Consent copy is not part of the list item.
        self::assertArrayNotHasKey('consent_label', $item);
    }

    public function testUseCasePassesFilterAndReturnsStatusCounts(): void
    {
        $repo = new class () implements SubmissionSearchRepositoryInterface {
            public ?SubmissionFilter $captured = null;

            public function search(SubmissionFilter $filter, int $limit, int $offset): array
            {
                $this->captured = $filter;

                return [];
            }

            public function countMatching(SubmissionFilter $filter): int
            {
                return 0;
            }

            public function statusCounts(SubmissionFilter $filter): array
            {
                return ['open' => 2, 'resolved' => 1];
            }
        };

        $useCase = new ListSubmissionsUseCase($repo);
        $filter = new SubmissionFilter(status: 'open', q: 'hello');
        $result = $useCase->execute($filter, 20, 0);

        self::assertInstanceOf(ListSubmissionsResult::class, $result);
        self::assertSame($filter, $repo->captured);
        self::assertSame(['open' => 2, 'resolved' => 1], $result->statusCounts);
    }
}
