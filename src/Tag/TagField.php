<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

/**
 * Parses + validates the tag create/edit payloads (ADR 0019). Labels are ≤ {@see self::MAX_LABEL}
 * chars; colours must be one of the fixed {@see TagColor} tokens. Uniqueness of the label is a
 * conflict decided in the use case (needs the DB), not a field-shape error.
 */
final class TagField
{
    public const MAX_LABEL = 60;

    /**
     * @param array<string, mixed> $body
     *
     * @throws ValidationException
     */
    public static function parseCreate(array $body): CreateTagInput
    {
        $errors = [];

        $label = self::validatedLabel($body['label'] ?? null, $errors, required: true);
        $color = self::validatedColor($body['color'] ?? null, $errors, TagColor::DEFAULT->value);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new CreateTagInput(label: trim((string) $label), color: $color ?? TagColor::DEFAULT->value);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @throws ValidationException
     */
    public static function parseUpdate(array $body): UpdateTagInput
    {
        $errors = [];

        $label = null;
        if (array_key_exists('label', $body)) {
            $label = self::validatedLabel($body['label'], $errors, required: true);
            $label = is_string($label) ? trim($label) : null;
        }

        $color = null;
        if (array_key_exists('color', $body)) {
            $color = self::validatedColor($body['color'], $errors, null);
        }

        $sortOrder = null;
        if (array_key_exists('sort_order', $body)) {
            $value = $body['sort_order'];
            if (!is_int($value) || $value < 0) {
                $errors[] = new ValidationError('sort_order', 'Must be a non-negative integer.', 'invalid');
            } else {
                $sortOrder = $value;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new UpdateTagInput(label: $label, color: $color, sortOrder: $sortOrder);
    }

    /**
     * @param list<ValidationError> $errors
     */
    private static function validatedLabel(mixed $value, array &$errors, bool $required): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            if ($required) {
                $errors[] = new ValidationError('label', 'Label is required.', 'required');
            }

            return null;
        }

        if (mb_strlen(trim($value)) > self::MAX_LABEL) {
            $errors[] = new ValidationError('label', sprintf('Must be at most %d characters.', self::MAX_LABEL), 'too_long');
        }

        return $value;
    }

    /**
     * @param list<ValidationError> $errors
     */
    private static function validatedColor(mixed $value, array &$errors, ?string $default): ?string
    {
        if ($value === null) {
            return $default;
        }

        if (!is_string($value) || !TagColor::isValid($value)) {
            $errors[] = new ValidationError('color', sprintf('Must be one of: %s.', implode(', ', TagColor::values())), 'invalid');

            return $default;
        }

        return $value;
    }
}
