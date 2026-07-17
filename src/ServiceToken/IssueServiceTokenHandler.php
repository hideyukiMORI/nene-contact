<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `POST /admin/service-tokens` (#388) — issues a service token for the caller's organization.
 * The plaintext token is returned **once** in the 201 response and never again. Gated by
 * ManageSettings ({@see \NeneContact\Auth\CapabilityResolver}).
 */
final readonly class IssueServiceTokenHandler implements RequestHandlerInterface
{
    public function __construct(
        private IssueServiceTokenUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $input = ServiceTokenField::parse(JsonRequestBodyParser::parse($request));

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $result = $this->useCase->execute($actorUserId, $input);

        return $this->json->create(ServiceTokenResponse::toCreatedArray($result), 201);
    }
}
