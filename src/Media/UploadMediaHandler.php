<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UploadMediaHandler implements RequestHandlerInterface
{
    public function __construct(
        private UploadMediaUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $file = $request->getUploadedFiles()['file'] ?? null;
        if (!$file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException([new ValidationError('file', 'A file upload is required.', 'required')]);
        }

        $bytes = (string) $file->getStream();
        $originalName = $file->getClientFilename();

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $asset = $this->useCase->execute($actorUserId, $bytes, $originalName);

        return $this->response->create(MediaResponse::toArray($asset), 201);
    }
}
