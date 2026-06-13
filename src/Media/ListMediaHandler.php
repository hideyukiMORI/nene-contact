<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListMediaHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListMediaUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $items = array_map(
            static fn (MediaAsset $a): array => MediaResponse::toArray($a),
            $this->useCase->execute(),
        );

        return $this->response->createList($items);
    }
}
