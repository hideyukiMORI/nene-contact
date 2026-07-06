<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
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
        // Default page size stays 50 (agent form list); envelope intentionally kept items-only.
        $pagination = PaginationQueryParser::parse($request, defaultLimit: 50);

        return $this->response->create([
            'items' => array_map(
                static fn (ContactForm $form): array => ApiFormResponse::toArray($form),
                $this->useCase->execute($pagination->limit, $pagination->offset),
            ),
        ]);
    }
}
