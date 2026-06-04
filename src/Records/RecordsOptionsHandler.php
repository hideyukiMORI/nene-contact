<?php

declare(strict_types=1);

namespace NeneContact\Records;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Upstream\UpstreamRequestException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/records/options?source={key} — fetch a Records entity's select options for the
 * form builder (read-only, ManageForms). Upstream failures surface as problem details; the
 * options carry no Contact PII.
 */
final readonly class RecordsOptionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private FetchRecordsOptionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $source = is_string($params['source'] ?? null) ? trim((string) $params['source']) : '';

        if ($source === '') {
            throw new ValidationException([
                new ValidationError('source', 'A Records entity source is required.', 'required'),
            ]);
        }

        try {
            $items = $this->useCase->execute($source);
        } catch (UpstreamRequestException $e) {
            return $this->problemDetails->create($request, 'records-unavailable', 'Records Unavailable', 502, $e->getMessage());
        }

        return $this->response->create(['source' => $source, 'items' => $items]);
    }
}
