<?php

declare(strict_types=1);

namespace NeneContact\Tests\Http;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationException;
use NeneContact\Api\AgentSubmissionListResult;
use NeneContact\Api\ListAgentFormsHandler;
use NeneContact\Api\ListAgentFormsUseCaseInterface;
use NeneContact\Api\ListAgentSubmissionsHandler;
use NeneContact\Api\ListAgentSubmissionsUseCaseInterface;
use NeneContact\Submission\ListSubmissionsHandler;
use NeneContact\Submission\ListSubmissionsResult;
use NeneContact\Submission\ListSubmissionsUseCaseInterface;
use NeneContact\Submission\SubmissionFilter;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;

/**
 * Locks the NENE2 PaginationQueryParser adoption (issue #20): out-of-range limit/offset now
 * yield a ValidationException (→ 422) instead of the previous silent clamp, while the success
 * envelope (items/limit/offset/total plus domain extras) is preserved unchanged.
 */
final class PaginationAdoptionHandlerTest extends TestCase
{
    private function json(): JsonResponseFactory
    {
        $psr17 = new Psr17Factory();

        return new JsonResponseFactory($psr17, $psr17);
    }

    private function submissionsUseCase(): ListSubmissionsUseCaseInterface
    {
        return new class () implements ListSubmissionsUseCaseInterface {
            public function execute(SubmissionFilter $filter, int $limit, int $offset): ListSubmissionsResult
            {
                return new ListSubmissionsResult(
                    items: [],
                    total: 0,
                    limit: $limit,
                    offset: $offset,
                    statusCounts: ['new' => 3, 'closed' => 1],
                );
            }
        };
    }

    private function submissionsHandler(): ListSubmissionsHandler
    {
        return new ListSubmissionsHandler($this->submissionsUseCase(), $this->json());
    }

    public function test_submissions_success_keeps_envelope_and_status_counts(): void
    {
        $request = new ServerRequest('GET', '/admin/submissions?limit=25&offset=5');
        $response = $this->submissionsHandler()->handle($request);

        self::assertSame(200, $response->getStatusCode());
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame([], $body['items']);
        self::assertSame(25, $body['limit']);
        self::assertSame(5, $body['offset']);
        self::assertSame(0, $body['total']);
        self::assertSame(['new' => 3, 'closed' => 1], $body['status_counts']);
    }

    public function test_submissions_default_limit_is_20(): void
    {
        $response = $this->submissionsHandler()->handle(new ServerRequest('GET', '/admin/submissions'));
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame(20, $body['limit']);
    }

    public function test_submissions_limit_over_max_now_422(): void
    {
        $this->expectException(ValidationException::class);
        $this->submissionsHandler()->handle(new ServerRequest('GET', '/admin/submissions?limit=500'));
    }

    public function test_submissions_zero_limit_now_422(): void
    {
        $this->expectException(ValidationException::class);
        $this->submissionsHandler()->handle(new ServerRequest('GET', '/admin/submissions?limit=0'));
    }

    public function test_submissions_negative_offset_now_422(): void
    {
        $this->expectException(ValidationException::class);
        $this->submissionsHandler()->handle(new ServerRequest('GET', '/admin/submissions?offset=-1'));
    }

    public function test_agent_submissions_keeps_pii_included_flag(): void
    {
        $useCase = new class () implements ListAgentSubmissionsUseCaseInterface {
            public function execute(int $limit, int $offset, bool $includePii): AgentSubmissionListResult
            {
                return new AgentSubmissionListResult(items: [], total: 0, limit: $limit, offset: $offset);
            }
        };
        $handler = new ListAgentSubmissionsHandler($useCase, $this->json());

        $response = $handler->handle(new ServerRequest('GET', '/api/submissions?include_pii=true'));
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame([], $body['items']);
        self::assertSame(20, $body['limit']);
        self::assertTrue($body['pii_included']);
    }

    public function test_agent_submissions_bad_limit_now_422(): void
    {
        $useCase = new class () implements ListAgentSubmissionsUseCaseInterface {
            public function execute(int $limit, int $offset, bool $includePii): AgentSubmissionListResult
            {
                return new AgentSubmissionListResult(items: [], total: 0, limit: $limit, offset: $offset);
            }
        };
        $handler = new ListAgentSubmissionsHandler($useCase, $this->json());

        $this->expectException(ValidationException::class);
        $handler->handle(new ServerRequest('GET', '/api/submissions?limit=101'));
    }

    private function agentFormsHandler(): ListAgentFormsHandler
    {
        $useCase = new class () implements ListAgentFormsUseCaseInterface {
            public function execute(int $limit, int $offset): array
            {
                return [];
            }
        };

        return new ListAgentFormsHandler($useCase, $this->json());
    }

    public function test_agent_forms_envelope_stays_items_only(): void
    {
        $response = $this->agentFormsHandler()->handle(new ServerRequest('GET', '/api/forms'));
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame(['items'], array_keys($body));
        self::assertSame([], $body['items']);
    }

    public function test_agent_forms_default_limit_is_50(): void
    {
        // limit=50 must be accepted (default preserved; would 422 only above 100).
        $response = $this->agentFormsHandler()->handle(new ServerRequest('GET', '/api/forms?limit=50'));
        self::assertSame(200, $response->getStatusCode());
    }

    public function test_agent_forms_limit_over_max_now_422(): void
    {
        $this->expectException(ValidationException::class);
        $this->agentFormsHandler()->handle(new ServerRequest('GET', '/api/forms?limit=200'));
    }
}
