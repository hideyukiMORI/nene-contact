<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FieldType;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Public, unauthenticated submission endpoint for the embed widget.
 * POST /public/forms/{public_form_key}/submissions
 *
 * Security (ADR 0010): allowed-origin check, honeypot silent-accept, purpose limitation
 * (only schema-declared fields are stored). Body size is capped by the runtime.
 */
final readonly class SubmitPublicFormHandler implements RequestHandlerInterface
{
    public function __construct(
        private PublicFormReaderInterface $forms,
        private SubmitPublicFormUseCaseInterface $useCase,
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

        if (!$this->originAllowed($request, $form)) {
            return $this->problemDetails->create($request, 'origin-not-allowed', 'Origin Not Allowed', 403, 'This origin is not allowed to submit this form.');
        }

        $body = JsonRequestBodyParser::parse($request);

        // Honeypot: any non-empty honeypot value → accept silently, do not store (ADR 0010).
        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::Honeypot->value && trim((string) ($body[$field->name] ?? '')) !== '') {
                return $this->response->createEmpty(204);
            }
        }

        $errors = [];
        $values = [];

        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::Honeypot->value) {
                continue;
            }

            $raw = $body[$field->name] ?? null;
            $isEmpty = $raw === null || $raw === '' || $raw === [];

            if ($field->required && $isEmpty) {
                $errors[] = new ValidationError($field->name, 'This field is required.', 'required');
                continue;
            }

            if (!$isEmpty && $field->fieldType === FieldType::Email->value && is_string($raw) && filter_var($raw, FILTER_VALIDATE_EMAIL) === false) {
                $errors[] = new ValidationError($field->name, 'Must be a valid email address.', 'invalid_email');
                continue;
            }

            if (!$isEmpty) {
                $values[$field->name] = $raw;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $serverParams = $request->getServerParams();
        $ip = isset($serverParams['REMOTE_ADDR']) ? (string) $serverParams['REMOTE_ADDR'] : null;
        $userAgent = $request->getHeaderLine('User-Agent') !== '' ? $request->getHeaderLine('User-Agent') : null;

        $submission = $this->useCase->execute($form, $values, $ip, $userAgent);

        return $this->response->create(['id' => $submission->id, 'status' => $submission->status], 201);
    }

    private function originAllowed(ServerRequestInterface $request, ContactForm $form): bool
    {
        if ($form->allowedOrigins === []) {
            return true; // operator has not restricted origins
        }

        $origin = $request->getHeaderLine('Origin');

        return $origin !== '' && in_array($origin, $form->allowedOrigins, true);
    }
}
