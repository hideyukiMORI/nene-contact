<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonResponseFactory;
use NeneContact\ContactForm\ContactForm;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/** GET /api/forms — list contact forms (metadata only) for AI agents. */
final readonly class ListAgentFormsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListAgentFormsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit = max(1, min(100, (int) ($params['limit'] ?? 50)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        return $this->response->create([
            'items' => array_map(
                static fn (ContactForm $form): array => ApiFormResponse::toArray($form),
                $this->useCase->execute($limit, $offset),
            ),
        ]);
    }
}
