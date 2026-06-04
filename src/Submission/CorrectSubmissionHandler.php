<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Corrects a submission's stored field values (data-subject correction right, charter §4).
 * PATCH /admin/submissions/{id}/field-values
 */
final readonly class CorrectSubmissionHandler implements RequestHandlerInterface
{
    public function __construct(
        private CorrectSubmissionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $values = $body['field_values'] ?? null;

        if (!is_array($values) || $values === []) {
            throw new ValidationException([
                new ValidationError('field_values', 'field_values must be a non-empty object.', 'required'),
            ]);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        return $this->response->create(SubmissionResponse::toArray($this->useCase->execute($actorUserId, $id, $values)));
    }
}
