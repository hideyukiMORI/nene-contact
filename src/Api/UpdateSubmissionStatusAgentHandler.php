<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Submission\UpdateSubmissionStatusUseCaseInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * PATCH /api/submissions/{id} — agent write (update status) behind a two-step confirmation
 * token (charter §11). Without a valid token it returns a preview + token and changes nothing;
 * with the token it applies the update. The token binds to this exact submission + status, so a
 * confirmation cannot be replayed against a different change.
 */
final readonly class UpdateSubmissionStatusAgentHandler implements RequestHandlerInterface
{
    private const ACTION = 'update_submission_status';

    /** @var list<string> */
    private const STATUSES = ['open', 'in_progress', 'resolved', 'spam'];

    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private UpdateSubmissionStatusUseCaseInterface $useCase,
        private ConfirmationToken $confirmation,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (!$this->confirmation->isConfigured()) {
            return $this->problemDetails->create($request, 'agent-writes-disabled', 'Agent Writes Disabled', 503, 'Agent writes are not configured (set NENE2_LOCAL_JWT_SECRET).');
        }

        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $status = (string) ($body['status'] ?? '');

        if (!in_array($status, self::STATUSES, true)) {
            throw new ValidationException([
                new ValidationError('status', 'Status must be one of: ' . implode(', ', self::STATUSES) . '.', 'invalid'),
            ]);
        }

        $submission = $this->submissions->findById($id);
        if ($submission === null) {
            throw new SubmissionNotFoundException($id);
        }

        $argsHash = ConfirmationToken::argsHash(['id' => $id, 'status' => $status]);
        $token = is_string($body['confirmation_token'] ?? null) ? (string) $body['confirmation_token'] : '';

        // Phase 1 — no valid token yet: return a preview + token, change nothing.
        if ($token === '' || !$this->confirmation->verify($token, self::ACTION, $argsHash)) {
            $issued = $this->confirmation->issue(self::ACTION, $argsHash);

            return $this->response->create([
                'requires_confirmation' => true,
                'action' => self::ACTION,
                'confirmation_token' => $issued,
                'expires_at' => $this->confirmation->expiresAt($issued),
                'preview' => [
                    'submission_id' => $id,
                    'current_status' => $submission->status,
                    'requested_status' => $status,
                ],
            ]);
        }

        // Phase 2 — valid token: apply (audited inside the use case; actor null = not an operator).
        $updated = $this->useCase->execute(null, $id, $status);

        return $this->response->create([
            'requires_confirmation' => false,
            'confirmed' => true,
            'submission' => ApiSubmissionResponse::toArray($updated, false),
        ]);
    }
}
