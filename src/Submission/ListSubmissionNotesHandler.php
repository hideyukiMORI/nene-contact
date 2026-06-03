<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListSubmissionNotesHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListSubmissionNotesUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($parameters['id'] ?? 0);

        return $this->response->create([
            'items' => array_map(
                static fn (SubmissionNote $n): array => SubmissionNoteResponse::toArray($n),
                $this->useCase->execute($submissionId),
            ),
        ]);
    }
}
