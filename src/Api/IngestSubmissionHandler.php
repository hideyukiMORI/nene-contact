<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\FieldType;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/submissions — ingest a submission from a service client (e.g. a Concierge
 * scenario) into the shared inbox (concierge-ingest-contract, M6). Machine-key authed and
 * org-scoped: the `contact_form_id` must belong to the resolved organization (no cross-tenant
 * writes). Field values are validated against the form like the public submit.
 */
final readonly class IngestSubmissionHandler implements RequestHandlerInterface
{
    /** @var list<string> */
    private const SOURCES = ['concierge', 'import', 'api'];

    public function __construct(
        private ContactFormRepositoryInterface $forms,
        private IngestSubmissionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $source = is_string($body['source'] ?? null) ? (string) $body['source'] : '';
        if (!in_array($source, self::SOURCES, true)) {
            throw new ValidationException([
                new ValidationError('source', 'Source must be one of: ' . implode(', ', self::SOURCES) . '.', 'invalid'),
            ]);
        }

        $formId = (int) ($body['contact_form_id'] ?? 0);
        // Organization-scoped lookup: a form from another tenant simply isn't found here.
        $form = $formId > 0 ? $this->forms->findById($formId) : null;
        if ($form === null || $form->status !== 'active') {
            throw new ValidationException([
                new ValidationError('contact_form_id', 'No active form with this id in this organization.', 'invalid'),
            ]);
        }

        $fieldValues = is_array($body['field_values'] ?? null) ? $body['field_values'] : [];

        $errors = [];
        $values = [];

        // Purpose limitation: only schema-declared fields are stored (no honeypot needed —
        // this is a trusted service, not a browser).
        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::Honeypot->value) {
                continue;
            }

            $raw = $fieldValues[$field->name] ?? null;
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

        if ($form->consentRequired && ($body['consent'] ?? null) !== true) {
            $errors[] = new ValidationError('consent', 'Consent is required for this form.', 'consent_required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $submission = $this->useCase->execute($form, $values, $source);

        return $this->response->create([
            'id' => $submission->id,
            'status' => $submission->status,
            'source' => $submission->source,
        ], 201);
    }
}
