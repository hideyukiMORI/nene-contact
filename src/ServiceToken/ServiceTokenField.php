<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\ServiceApi\ServiceScope;

/**
 * Parses + validates the service-token issuance payload (`POST /admin/service-tokens`, #388).
 * Scopes must be a non-empty subset of the registered {@see ServiceScope} values; the subject
 * defaults to the records connect principal.
 */
final class ServiceTokenField
{
    public const DEFAULT_SUBJECT = 'service:records';

    private const MAX_TEXT = 255;

    /**
     * Issuance TTL bounds (seconds): 1 hour … 1 year. A records connect token is a permanent
     * integration credential, so the default is the maximum (1 year) — managed by revocation
     * or renewal, never a short default that silently expires the link (hub review, TTL ruling).
     */
    public const MIN_TTL_SECONDS = 3600;
    public const MAX_TTL_SECONDS = 31_536_000;
    public const DEFAULT_TTL_SECONDS = 31_536_000;

    /**
     * @param array<string, mixed> $body
     *
     * @throws ValidationException
     */
    public static function parse(array $body): IssueServiceTokenInput
    {
        $errors = [];

        $label = $body['label'] ?? null;
        if (!is_string($label) || trim($label) === '') {
            $errors[] = new ValidationError('label', 'Label is required.', 'required');
            $label = '';
        } elseif (mb_strlen($label) > self::MAX_TEXT) {
            $errors[] = new ValidationError('label', sprintf('Must be at most %d characters.', self::MAX_TEXT), 'too_long');
        }

        $scopes = self::parseScopes($body['scopes'] ?? null, $errors);

        $subject = $body['subject'] ?? self::DEFAULT_SUBJECT;
        if (!is_string($subject) || trim($subject) === '') {
            $errors[] = new ValidationError('subject', 'Subject must be a non-empty string.', 'invalid');
            $subject = self::DEFAULT_SUBJECT;
        } elseif (mb_strlen($subject) > self::MAX_TEXT) {
            $errors[] = new ValidationError('subject', sprintf('Must be at most %d characters.', self::MAX_TEXT), 'too_long');
        }

        $ttl = $body['ttl_seconds'] ?? self::DEFAULT_TTL_SECONDS;
        if (!is_int($ttl) || $ttl < self::MIN_TTL_SECONDS || $ttl > self::MAX_TTL_SECONDS) {
            $errors[] = new ValidationError(
                'ttl_seconds',
                sprintf('TTL must be an integer between %d and %d seconds.', self::MIN_TTL_SECONDS, self::MAX_TTL_SECONDS),
                'invalid',
            );
            $ttl = self::DEFAULT_TTL_SECONDS;
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new IssueServiceTokenInput(
            label: trim($label),
            scopes: $scopes,
            subject: trim($subject),
            ttlSeconds: $ttl,
        );
    }

    /**
     * @param list<ValidationError> $errors
     * @return list<string>
     */
    private static function parseScopes(mixed $value, array &$errors): array
    {
        if (!is_array($value) || $value === []) {
            $errors[] = new ValidationError('scopes', 'At least one scope is required.', 'required');

            return [];
        }

        $allowed = array_map(static fn (ServiceScope $s): string => $s->value, ServiceScope::cases());
        $scopes = [];

        foreach ($value as $scope) {
            if (!is_string($scope) || !in_array($scope, $allowed, true)) {
                $errors[] = new ValidationError('scopes', sprintf('Each scope must be one of: %s.', implode(', ', $allowed)), 'invalid');

                return [];
            }

            if (!in_array($scope, $scopes, true)) {
                $scopes[] = $scope;
            }
        }

        return $scopes;
    }
}
