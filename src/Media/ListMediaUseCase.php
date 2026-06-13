<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Http\RequestScopedHolder;

final readonly class ListMediaUseCase implements ListMediaUseCaseInterface
{
    /** @param RequestScopedHolder<int> $orgId */
    public function __construct(
        private MediaAssetRepositoryInterface $assets,
        private RequestScopedHolder $orgId,
    ) {
    }

    /** @return list<MediaAsset> */
    public function execute(): array
    {
        return $this->assets->listByOrganization($this->orgId->get());
    }
}
