<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Attachment\AttachmentRepositoryInterface;
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
        private AttachmentRepositoryInterface $attachments,
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

        // Consent (charter §3): when required, the submission is rejected unless consent is
        // affirmatively given (the embed checkbox is never pre-checked).
        if ($form->consentRequired && ($body['consent'] ?? null) !== true) {
            $errors[] = new ValidationError('consent', 'Consent is required to submit this form.', 'consent_required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $serverParams = $request->getServerParams();
        $ip = isset($serverParams['REMOTE_ADDR']) ? (string) $serverParams['REMOTE_ADDR'] : null;
        $userAgent = $request->getHeaderLine('User-Agent') !== '' ? $request->getHeaderLine('User-Agent') : null;

        // Reception meta (ADR 0018): the embed host page the form was submitted from. The
        // widget sends `source_url`; fall back to the Referer header when it is absent.
        $sourceUrl = $this->sourceUrl($body['source_url'] ?? null, $request->getHeaderLine('Referer'));

        // Locale the visitor submitted in — accepted only when it is one of the form's locales.
        $locale = $this->locale($body['locale'] ?? null, $form);

        $submission = $this->useCase->execute($form, $values, $ip, $userAgent, $sourceUrl, $locale);

        // Link any attachments uploaded for this form to the new submission (D12). Invalid
        // or already-linked ids are ignored — they never fail the submission.
        if ($submission->id !== null && $form->id !== null && is_array($body['attachment_ids'] ?? null)) {
            foreach ($body['attachment_ids'] as $rawId) {
                $attachmentId = (int) $rawId;
                if ($attachmentId <= 0) {
                    continue;
                }

                if ($this->attachments->findPendingForLink($attachmentId, $form->organizationId, $form->id) !== null) {
                    $this->attachments->linkToSubmission($attachmentId, $form->organizationId, $submission->id);
                }
            }
        }

        return $this->response->create(['id' => $submission->id, 'status' => $submission->status], 201);
    }

    /**
     * Normalises the submitted source URL: prefers the client-sent value, falls back to the
     * Referer header. Only http(s) URLs are accepted and the result is capped to the column
     * width (1024); anything else is dropped to null.
     */
    private function sourceUrl(mixed $bodyValue, string $referer): ?string
    {
        $candidate = is_string($bodyValue) && trim($bodyValue) !== '' ? trim($bodyValue) : trim($referer);

        if ($candidate === '' || !str_starts_with($candidate, 'http')) {
            return null;
        }

        return mb_substr($candidate, 0, 1024);
    }

    /**
     * Accepts the submitted locale only when it is one of the form's declared locales;
     * anything else (unknown, spoofed, absent) is dropped to null.
     */
    private function locale(mixed $value, ContactForm $form): ?string
    {
        return is_string($value) && in_array($value, $form->locales, true) ? $value : null;
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
