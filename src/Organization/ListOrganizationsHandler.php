<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListOrganizationsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListOrganizationsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit = max(1, min(100, (int) ($params['limit'] ?? 20)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        $output = $this->useCase->execute(new ListOrganizationsInput(limit: $limit, offset: $offset));

        return $this->response->create([
            'items' => array_map(
                static fn (ListOrganizationItem $item): array => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'external_id' => $item->externalId,
                    'custom_domain' => $item->customDomain,
                    'plan' => $item->plan,
                    'is_active' => $item->isActive,
                    'created_at' => $item->createdAt,
                    'updated_at' => $item->updatedAt,
                ],
                $output->items,
            ),
            'limit' => $output->limit,
            'offset' => $output->offset,
            'total' => $output->total,
        ]);
    }
}
