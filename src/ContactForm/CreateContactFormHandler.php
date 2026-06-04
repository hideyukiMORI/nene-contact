<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateContactFormHandler implements RequestHandlerInterface
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['ja', 'en'];

    public function __construct(
        private CreateContactFormUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $errors = [];

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        $defaultLocale = (string) ($body['default_locale'] ?? 'ja');
        if (!in_array($defaultLocale, self::SUPPORTED_LOCALES, true)) {
            $errors[] = new ValidationError('default_locale', 'Locale must be ja or en.', 'invalid');
        }

        $locales = self::stringList($body['locales'] ?? []);
        if ($locales === []) {
            $errors[] = new ValidationError('locales', 'At least one locale is required.', 'required');
        } elseif (array_diff($locales, self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('locales', 'Locales must be a subset of {ja, en}.', 'invalid');
        } elseif (!in_array($defaultLocale, $locales, true)) {
            $errors[] = new ValidationError('default_locale', 'Default locale must be one of the form locales.', 'invalid');
        }

        $allowedOrigins = self::stringList($body['allowed_origins'] ?? []);

        // Consent (charter §3): when required, a per-locale label for the default locale is
        // mandatory, and labels are restricted to {ja, en} (ADR 0011).
        $consentRequired = (bool) ($body['consent_required'] ?? false);
        /** @var array<string, string> $consentLabel */
        $consentLabel = is_array($body['consent_label'] ?? null)
            ? array_map(static fn ($v): string => (string) $v, $body['consent_label'])
            : [];

        if ($consentLabel !== [] && array_diff(array_keys($consentLabel), self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('consent_label', 'Consent label locales must be a subset of {ja, en}.', 'invalid');
        }

        if ($consentRequired && (!isset($consentLabel[$defaultLocale]) || trim($consentLabel[$defaultLocale]) === '')) {
            $errors[] = new ValidationError('consent_label', "A consent label for the default locale ({$defaultLocale}) is required when consent is required.", 'required');
        }

        $rawFields = is_array($body['fields'] ?? null) ? $body['fields'] : [];
        $fields = [];
        $sort = 0;

        foreach (array_values($rawFields) as $i => $raw) {
            if (!is_array($raw)) {
                $errors[] = new ValidationError("fields.{$i}", 'Field must be an object.', 'invalid');
                continue;
            }

            $fieldType = (string) ($raw['field_type'] ?? '');
            $fieldName = trim((string) ($raw['name'] ?? ''));
            /** @var array<string, string> $label */
            $label = is_array($raw['label'] ?? null) ? array_map(static fn ($v): string => (string) $v, $raw['label']) : [];
            $required = (bool) ($raw['required'] ?? false);
            /** @var list<array<string, mixed>>|null $options */
            $options = is_array($raw['options'] ?? null) ? array_values(array_filter($raw['options'], 'is_array')) : null;

            if (FieldType::isProhibited($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", "Field type '{$fieldType}' is prohibited (APPI compliance, charter §8).", 'prohibited');
            } elseif (!FieldType::isAllowed($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", 'Unsupported field type.', 'invalid');
            }

            if ($fieldName === '') {
                $errors[] = new ValidationError("fields.{$i}.name", 'Field name is required.', 'required');
            }

            if (!isset($label[$defaultLocale]) || $label[$defaultLocale] === '') {
                $errors[] = new ValidationError("fields.{$i}.label", "Label for the default locale ({$defaultLocale}) is required.", 'required');
            }

            if ($fieldType === FieldType::Select->value && ($options === null || $options === [])) {
                $errors[] = new ValidationError("fields.{$i}.options", 'Select fields require options.', 'required');
            }

            $fields[] = new FormField(
                fieldType: $fieldType,
                name: $fieldName,
                label: $label,
                required: $required,
                sortOrder: $sort++,
                options: $options,
            );
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $form = $this->useCase->execute($actorUserId, new CreateContactFormInput(
            name: $name,
            defaultLocale: $defaultLocale,
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            consentRequired: $consentRequired,
            consentLabel: $consentLabel === [] ? null : $consentLabel,
        ));

        return $this->response->create(
            ContactFormResponse::toArray($form),
            201,
            ['Location' => '/admin/contact-forms/' . $form->id],
        );
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            }
        }

        return $out;
    }
}
