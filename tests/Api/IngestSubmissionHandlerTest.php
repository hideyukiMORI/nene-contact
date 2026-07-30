<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use Nene2\Validation\ValidationException;
use NeneContact\Api\IngestSubmissionHandler;
use NeneContact\Api\IngestSubmissionUseCaseInterface;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\FormField;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;

/**
 * Locks how `POST /api/submissions` addresses the target form (#563, embed 案1 ③): **exactly
 * one** of `contact_form_id` / `public_form_key`, both routes org-scoped and converging on the
 * same validation, throttle and audit path. A first-party relay such as records holds only the
 * public key, so the id route alone would have forced an internal id onto an unauthenticated
 * surface.
 */
final class IngestSubmissionHandlerTest extends TestCase
{
    private function form(string $status = 'active'): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'ayane-contact',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: $status,
            id: 3,
        );
    }

    private function forms(?ContactForm $form): RecordingContactFormRepository
    {
        return new RecordingContactFormRepository($form);
    }

    private function useCase(): RecordingIngestSubmissionUseCase
    {
        return new RecordingIngestSubmissionUseCase();
    }

    private function handler(ContactFormRepositoryInterface $forms, IngestSubmissionUseCaseInterface $useCase): IngestSubmissionHandler
    {
        $psr17 = new Psr17Factory();
        $rateLimit = new class () implements RateLimitStorageInterface {
            /** @var list<string> */
            public array $keys = [];

            /** @return array{count: int, reset_at: int} */
            public function hit(string $key, int $windowSeconds): array
            {
                $this->keys[] = $key;

                return ['count' => 1, 'reset_at' => 0];
            }
        };
        $clock = new class () implements ClockInterface {
            public function now(): \DateTimeImmutable
            {
                return new \DateTimeImmutable('2026-07-30T12:00:00Z');
            }
        };

        return new IngestSubmissionHandler(
            $forms,
            $useCase,
            new JsonResponseFactory($psr17, $psr17),
            $rateLimit,
            new ProblemDetailsResponseFactory($psr17, $psr17),
            $clock,
        );
    }

    /** @param array<string, mixed> $body */
    private function request(array $body): ServerRequest
    {
        return new ServerRequest(
            'POST',
            '/api/submissions',
            ['Content-Type' => 'application/json'],
            json_encode($body, JSON_THROW_ON_ERROR),
        );
    }

    public function test_public_form_key_resolves_the_form_and_creates_the_submission(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        $response = $this->handler($forms, $useCase)->handle($this->request([
            'source' => 'first_party',
            'public_form_key' => 'ayane-contact',
            'field_values' => ['email' => 'visitor@example.com'],
        ]));

        self::assertSame(201, $response->getStatusCode());
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame(99, $body['id']);
        self::assertSame('first_party', $body['source']);

        // Same downstream path as the id route: the resolved form, not the raw identifier.
        self::assertSame(3, $useCase->form?->id);
        self::assertSame(['email' => 'visitor@example.com'], $useCase->values);
        self::assertSame(['key:ayane-contact'], $forms->lookups);
    }

    public function test_contact_form_id_route_is_unchanged(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        $response = $this->handler($forms, $useCase)->handle($this->request([
            'source' => 'concierge',
            'contact_form_id' => 3,
            'field_values' => ['email' => 'visitor@example.com'],
        ]));

        self::assertSame(201, $response->getStatusCode());
        self::assertSame(3, $useCase->form?->id);
        self::assertSame('concierge', $useCase->source);
        self::assertSame(['id:3'], $forms->lookups);
    }

    public function test_both_identifiers_at_once_are_rejected_without_a_precedence_rule(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'contact_form_id' => 3,
                'public_form_key' => 'ayane-contact',
                'field_values' => ['email' => 'visitor@example.com'],
            ]));
            self::fail('Expected a ValidationException for an ambiguous request.');
        } catch (ValidationException $e) {
            $fields = array_map(static fn ($error): string => $error->field, $e->errors());
            self::assertSame(['contact_form_id', 'public_form_key'], $fields);
            self::assertSame('ambiguous', $e->errors()[0]->code);
        }

        // Neither identifier was resolved and nothing was written.
        self::assertSame([], $forms->lookups);
        self::assertNull($useCase->form);
    }

    public function test_neither_identifier_is_rejected(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'field_values' => ['email' => 'visitor@example.com'],
            ]));
            self::fail('Expected a ValidationException when no identifier is given.');
        } catch (ValidationException $e) {
            $fields = array_map(static fn ($error): string => $error->field, $e->errors());
            self::assertSame(['contact_form_id', 'public_form_key'], $fields);
            self::assertSame('required', $e->errors()[0]->code);
        }

        self::assertNull($useCase->form);
    }

    public function test_unknown_public_form_key_is_rejected_like_an_unknown_id(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'public_form_key' => 'not-a-form',
                'field_values' => ['email' => 'visitor@example.com'],
            ]));
            self::fail('Expected a ValidationException for an unknown key.');
        } catch (ValidationException $e) {
            self::assertSame('public_form_key', $e->errors()[0]->field);
            self::assertSame('invalid', $e->errors()[0]->code);
            // Says nothing about whether the key exists in another tenant.
            self::assertSame('No active form with this key in this organization.', $e->errors()[0]->message);
        }

        self::assertNull($useCase->form);
    }

    public function test_another_tenants_key_is_not_resolvable(): void
    {
        // The org-scoped repository returns nothing for a form outside the token's organization.
        $forms = $this->forms(null);
        $useCase = $this->useCase();

        $this->expectException(ValidationException::class);

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'public_form_key' => 'ayane-contact',
                'field_values' => ['email' => 'visitor@example.com'],
            ]));
        } finally {
            self::assertNull($useCase->form);
        }
    }

    public function test_inactive_form_is_rejected_on_the_key_route(): void
    {
        $forms = $this->forms($this->form(status: 'draft'));
        $useCase = $this->useCase();

        $this->expectException(ValidationException::class);

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'public_form_key' => 'ayane-contact',
                'field_values' => ['email' => 'visitor@example.com'],
            ]));
        } finally {
            self::assertNull($useCase->form);
        }
    }

    public function test_key_route_still_enforces_required_fields(): void
    {
        $forms = $this->forms($this->form());
        $useCase = $this->useCase();

        try {
            $this->handler($forms, $useCase)->handle($this->request([
                'source' => 'first_party',
                'public_form_key' => 'ayane-contact',
                'field_values' => [],
            ]));
            self::fail('Expected a ValidationException for the missing required field.');
        } catch (ValidationException $e) {
            self::assertSame('email', $e->errors()[0]->field);
            self::assertSame('required', $e->errors()[0]->code);
        }

        self::assertNull($useCase->form);
    }
}
