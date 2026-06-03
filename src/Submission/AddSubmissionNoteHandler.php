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

final readonly class AddSubmissionNoteHandler implements RequestHandlerInterface
{
    public function __construct(
        private AddSubmissionNoteUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $text = trim((string) ($body['body'] ?? ''));

        if ($text === '') {
            throw new ValidationException([new ValidationError('body', 'Note body is required.', 'required')]);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $note = $this->useCase->execute($actorUserId, $submissionId, $text);

        return $this->response->create(SubmissionNoteResponse::toArray($note), 201);
    }
}
