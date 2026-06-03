<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Public, unauthenticated form schema for the embed widget.
 * GET /public/forms/{public_form_key}/schema
 */
final readonly class GetPublicFormSchemaHandler implements RequestHandlerInterface
{
    public function __construct(
        private PublicFormReaderInterface $forms,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $key = (string) ($parameters['public_form_key'] ?? '');

        $form = $this->forms->findByPublicFormKey($key);

        if ($form === null || $form->status !== 'active') {
            return $this->problemDetails->create($request, 'contact-form-not-found', 'Contact Form Not Found', 404, 'The requested form was not found.');
        }

        return $this->response->create(PublicFormSchemaResponse::toArray($form));
    }
}
