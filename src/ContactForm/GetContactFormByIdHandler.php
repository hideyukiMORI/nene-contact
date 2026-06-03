<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class GetContactFormByIdHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetContactFormByIdUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        return $this->response->create(ContactFormResponse::toArray($this->useCase->execute($id)));
    }
}
