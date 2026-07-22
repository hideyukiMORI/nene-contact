<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `PATCH /admin/tags/{id}` (ADR 0019) — edits a tag in the caller's organization. Gated by
 * ManageSettings.
 */
final readonly class UpdateTagHandler implements RequestHandlerInterface
{
    public function __construct(
        private UpdateTagUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = is_array($params) && isset($params['id']) ? (int) $params['id'] : 0;

        $input = TagField::parseUpdate(JsonRequestBodyParser::parse($request));

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $tag = $this->useCase->execute($actorUserId, $id, $input);

        return $this->json->create(TagResponse::toArray($tag));
    }
}
