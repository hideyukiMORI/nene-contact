<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * PATCH /admin/settings/organization — update the caller's own organization settings. The org is
 * taken from the token (org_id claim); there is no path id, so this is always self-scoped.
 */
final readonly class UpdateOrganizationHandler implements RequestHandlerInterface
{
    private const MAX_DISPLAY_NAME = 100;

    private const MAX_SIGNATURE = 2000;

    public function __construct(
        private UpdateOrganizationUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        if (!array_key_exists('sender_display_name', $body)) {
            throw new ValidationException([
                new ValidationError('sender_display_name', 'sender_display_name is required.', 'required'),
            ]);
        }

        if (!array_key_exists('email_signature', $body)) {
            throw new ValidationException([
                new ValidationError('email_signature', 'email_signature is required.', 'required'),
            ]);
        }

        $senderDisplayName = $this->parseDisplayName($body['sender_display_name']);
        $emailSignature = $this->parseSignature($body['email_signature']);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;
        $callerOrgId = is_array($claims) && isset($claims['org_id']) && is_int($claims['org_id']) ? $claims['org_id'] : null;

        $org = $this->useCase->execute($actorUserId, $callerOrgId, new UpdateOrganizationInput($senderDisplayName, $emailSignature));

        return $this->response->create([
            'id' => $org->id,
            'name' => $org->name,
            'sender_display_name' => $org->senderDisplayName,
            'email_signature' => $org->emailSignature,
        ]);
    }

    /**
     * A blank value clears the display name (From falls back to the org name); otherwise it must
     * be a printable single line within the length cap.
     */
    private function parseDisplayName(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        if (!is_string($raw)) {
            throw new ValidationException([
                new ValidationError('sender_display_name', 'sender_display_name must be a string.', 'invalid'),
            ]);
        }

        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        if (mb_strlen($trimmed) > self::MAX_DISPLAY_NAME) {
            throw new ValidationException([
                new ValidationError('sender_display_name', 'sender_display_name must be at most ' . self::MAX_DISPLAY_NAME . ' characters.', 'too_long'),
            ]);
        }

        if (preg_match('/[\x00-\x1F\x7F]/u', $trimmed) === 1) {
            throw new ValidationException([
                new ValidationError('sender_display_name', 'sender_display_name must not contain control characters.', 'invalid'),
            ]);
        }

        return $trimmed;
    }

    /**
     * The signature is a multi-line block, so newlines are allowed; a blank value clears it.
     * Other control characters are rejected.
     */
    private function parseSignature(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        if (!is_string($raw)) {
            throw new ValidationException([
                new ValidationError('email_signature', 'email_signature must be a string.', 'invalid'),
            ]);
        }

        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        if (mb_strlen($trimmed) > self::MAX_SIGNATURE) {
            throw new ValidationException([
                new ValidationError('email_signature', 'email_signature must be at most ' . self::MAX_SIGNATURE . ' characters.', 'too_long'),
            ]);
        }

        // Allow tab (\x09), LF (\x0A), CR (\x0D); reject other control chars.
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $trimmed) === 1) {
            throw new ValidationException([
                new ValidationError('email_signature', 'email_signature must not contain control characters.', 'invalid'),
            ]);
        }

        return $trimmed;
    }
}
