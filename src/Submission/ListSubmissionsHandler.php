<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListSubmissionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListSubmissionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit = max(1, min(100, (int) ($params['limit'] ?? 20)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        $filter = new SubmissionFilter(
            status: $this->stringParam($params, 'status'),
            contactFormId: isset($params['contact_form_id']) && $params['contact_form_id'] !== ''
                ? (int) $params['contact_form_id']
                : null,
            from: $this->stringParam($params, 'from'),
            to: $this->stringParam($params, 'to'),
            q: $this->stringParam($params, 'q'),
        );

        $result = $this->useCase->execute($filter, $limit, $offset);

        // Items are masked (charter §11) — the bulk list never discloses raw PII.
        return $this->response->create([
            'items' => array_map(
                static fn (Submission $s): array => SubmissionResponse::toListItem($s),
                $result->items,
            ),
            'limit' => $result->limit,
            'offset' => $result->offset,
            'total' => $result->total,
            'status_counts' => $result->statusCounts,
        ]);
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
