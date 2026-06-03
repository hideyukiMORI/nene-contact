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

final readonly class UpdateSubmissionStatusHandler implements RequestHandlerInterface
{
    /** @var list<string> */
    private const STATUSES = ['open', 'in_progress', 'resolved', 'spam'];

    public function __construct(
        private UpdateSubmissionStatusUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $status = (string) ($body['status'] ?? '');

        if (!in_array($status, self::STATUSES, true)) {
            throw new ValidationException([
                new ValidationError('status', 'Status must be one of: ' . implode(', ', self::STATUSES) . '.', 'invalid'),
            ]);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        return $this->response->create(SubmissionResponse::toArray($this->useCase->execute($actorUserId, $id, $status)));
    }
}
