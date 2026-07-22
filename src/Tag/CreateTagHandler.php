<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `POST /admin/tags` (ADR 0019) — creates a tag in the caller's organization. Gated by
 * ManageSettings ({@see \NeneContact\Auth\CapabilityResolver}).
 */
final readonly class CreateTagHandler implements RequestHandlerInterface
{
    public function __construct(
        private CreateTagUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $input = TagField::parseCreate(JsonRequestBodyParser::parse($request));

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $tag = $this->useCase->execute($actorUserId, $input);

        return $this->json->create(TagResponse::toArray($tag), 201);
    }
}
