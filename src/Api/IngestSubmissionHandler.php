<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
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
    private const SOURCES = ['concierge', 'import', 'api', 'first_party'];

    /**
     * Per-org/per-form ingest throttle (embed 案1, #388). The public submit throttle
     * ({@see \NeneContact\RateLimit\PublicSubmitThrottleMiddleware}) is keyed per client IP —
     * useless here because a first-party relay (records) submits from a single fixed IP, so the
     * ingest surface is bounded per organization and per form instead.
     */
    private const THROTTLE_WINDOW_SECONDS = 60;
    private const PER_ORG_LIMIT = 300;
    private const PER_FORM_LIMIT = 120;

    public function __construct(
        private ContactFormRepositoryInterface $forms,
        private IngestSubmissionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
        private RateLimitStorageInterface $rateLimit,
        private ProblemDetailsResponseFactory $problemDetails,
        private ClockInterface $clock,
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

        // Per-org/per-form throttle (fixed window). Exceeding either bucket returns 429; the
        // form is only ever looked up within the resolved org, so the org key is safe to trust.
        $orgResult = $this->rateLimit->hit('ingest:org:' . $form->organizationId, self::THROTTLE_WINDOW_SECONDS);
        if ($orgResult['count'] > self::PER_ORG_LIMIT) {
            return $this->tooManyRequests(self::PER_ORG_LIMIT, $orgResult['reset_at'], $request);
        }

        $formResult = $this->rateLimit->hit('ingest:form:' . (int) $form->id, self::THROTTLE_WINDOW_SECONDS);
        if ($formResult['count'] > self::PER_FORM_LIMIT) {
            return $this->tooManyRequests(self::PER_FORM_LIMIT, $formResult['reset_at'], $request);
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

    private function tooManyRequests(int $limit, int $resetAt, ServerRequestInterface $request): ResponseInterface
    {
        $retryAfter = max(0, $resetAt - $this->clock->now()->getTimestamp());

        return $this->problemDetails
            ->create(
                $request,
                'rate-limited',
                'Too Many Requests',
                429,
                sprintf('Rate limit of %d requests per %d seconds exceeded. Try again in %d seconds.', $limit, self::THROTTLE_WINDOW_SECONDS, $retryAfter),
            )
            ->withHeader('Retry-After', (string) $retryAfter)
            ->withHeader('X-RateLimit-Limit', (string) $limit)
            ->withHeader('X-RateLimit-Remaining', '0')
            ->withHeader('X-RateLimit-Reset', (string) $resetAt);
    }
}
