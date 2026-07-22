<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Http\JsonResponseFactory;
use NeneContact\Submission\ListSubmissionsHandler;
use NeneContact\Submission\ListSubmissionsResult;
use NeneContact\Submission\ListSubmissionsUseCaseInterface;
use NeneContact\Submission\SubmissionFilter;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;

/**
 * The inbox `tag_id` filter parsing (ADR 0019): repeatable array form and comma-separated form
 * both become a de-duplicated list of positive ints on the SubmissionFilter.
 */
final class SubmissionListTagFilterTest extends TestCase
{
    private function newCapture(): ListSubmissionsUseCaseInterface&CapturesFilter
    {
        return new class () implements ListSubmissionsUseCaseInterface, CapturesFilter {
            public ?SubmissionFilter $captured = null;

            public function execute(SubmissionFilter $filter, int $limit, int $offset): ListSubmissionsResult
            {
                $this->captured = $filter;

                return new ListSubmissionsResult(items: [], total: 0, limit: $limit, offset: $offset);
            }

            public function captured(): ?SubmissionFilter
            {
                return $this->captured;
            }
        };
    }

    private function handle(ListSubmissionsUseCaseInterface $uc, mixed $tagIdParam): void
    {
        $psr17 = new Psr17Factory();
        $handler = new ListSubmissionsHandler($uc, new JsonResponseFactory($psr17, $psr17));

        $query = ['limit' => '20', 'offset' => '0'];
        if ($tagIdParam !== null) {
            $query['tag_id'] = $tagIdParam;
        }
        $handler->handle((new ServerRequest('GET', '/admin/submissions'))->withQueryParams($query));
    }

    public function test_parses_repeatable_array_tag_ids_deduped(): void
    {
        $uc = $this->newCapture();
        $this->handle($uc, ['2', '5', '2']);
        self::assertSame([2, 5], $uc->captured()?->tagIds);
    }

    public function test_parses_comma_separated_tag_ids(): void
    {
        $uc = $this->newCapture();
        $this->handle($uc, '3,7');
        self::assertSame([3, 7], $uc->captured()?->tagIds);
    }

    public function test_no_tag_filter_by_default(): void
    {
        $uc = $this->newCapture();
        $this->handle($uc, null);
        self::assertSame([], $uc->captured()?->tagIds);
    }
}

/**
 * Test-only accessor so the captured filter is reachable through a typed interface.
 */
interface CapturesFilter
{
    public function captured(): ?SubmissionFilter;
}
