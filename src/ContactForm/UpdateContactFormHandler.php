<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UpdateContactFormHandler implements RequestHandlerInterface
{
    public function __construct(
        private UpdateContactFormUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $input = ContactFormBodyValidator::parse(JsonRequestBodyParser::parse($request));

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $form = $this->useCase->execute($actorUserId, $id, $input);

        return $this->response->create(ContactFormResponse::toArray($form));
    }
}
