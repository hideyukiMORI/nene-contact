<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
use Nene2\Http\PaginationResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListSubmissionsHandler implements RequestHandlerInterface
{
    /** @var list<string> Allowed inbox sort keys. */
    private const SORTS = ['date_desc', 'date_asc', 'status', 'form'];

    public function __construct(
        private ListSubmissionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $pagination = PaginationQueryParser::parse($request);

        $params = $request->getQueryParams();
        $sort = $this->stringParam($params, 'sort');

        $filter = new SubmissionFilter(
            status: $this->stringParam($params, 'status'),
            contactFormId: isset($params['contact_form_id']) && $params['contact_form_id'] !== ''
                ? (int) $params['contact_form_id']
                : null,
            from: $this->stringParam($params, 'from'),
            to: $this->stringParam($params, 'to'),
            q: $this->stringParam($params, 'q'),
            sort: in_array($sort, self::SORTS, true) ? $sort : null,
        );

        $result = $this->useCase->execute($filter, $pagination->limit, $pagination->offset);

        // Items are masked (charter §11) — the bulk list never discloses raw PII.
        $body = (new PaginationResponse(
            items: array_map(
                static fn (Submission $s): array => SubmissionResponse::toListItem($s),
                $result->items,
            ),
            limit: $result->limit,
            offset: $result->offset,
            total: $result->total,
        ))->toArray();
        $body['status_counts'] = $result->statusCounts;

        return $this->response->create($body);
    }

    /**
     * @param array<string, mixed> $params
     */
    private function stringParam(array $params, string $key): ?string
    {
        $value = $params[$key] ?? null;
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
