<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use NeneContact\Api\ConfirmationToken;
use PHPUnit\Framework\TestCase;

final class ConfirmationTokenTest extends TestCase
{
    public function test_issued_token_verifies_for_same_action_and_args(): void
    {
        $ct = new ConfirmationToken('server-secret');
        $hash = ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']);

        $token = $ct->issue('update_submission_status', $hash);

        self::assertTrue($ct->verify($token, 'update_submission_status', $hash));
    }

    public function test_token_does_not_verify_for_different_args(): void
    {
        $ct = new ConfirmationToken('server-secret');
        $token = $ct->issue('update_submission_status', ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']));

        // A token issued to "resolve #7" must not apply "spam #7" or "resolve #8".
        self::assertFalse($ct->verify($token, 'update_submission_status', ConfirmationToken::argsHash(['id' => 7, 'status' => 'spam'])));
        self::assertFalse($ct->verify($token, 'update_submission_status', ConfirmationToken::argsHash(['id' => 8, 'status' => 'resolved'])));
    }

    public function test_token_does_not_verify_for_different_action(): void
    {
        $ct = new ConfirmationToken('server-secret');
        $hash = ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']);
        $token = $ct->issue('update_submission_status', $hash);

        self::assertFalse($ct->verify($token, 'delete_submission', $hash));
    }

    public function test_tampered_signature_is_rejected(): void
    {
        $ct = new ConfirmationToken('server-secret');
        $hash = ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']);
        $token = $ct->issue('update_submission_status', $hash);

        self::assertFalse($ct->verify($token . 'x', 'update_submission_status', $hash));
        self::assertFalse($ct->verify('garbage', 'update_submission_status', $hash));
    }

    public function test_expired_token_is_rejected(): void
    {
        $ct = new ConfirmationToken('server-secret', -1); // already expired
        $hash = ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']);
        $token = $ct->issue('update_submission_status', $hash);

        self::assertFalse($ct->verify($token, 'update_submission_status', $hash));
    }

    public function test_token_signed_with_other_secret_is_rejected(): void
    {
        $hash = ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']);
        $token = (new ConfirmationToken('secret-a'))->issue('update_submission_status', $hash);

        self::assertFalse((new ConfirmationToken('secret-b'))->verify($token, 'update_submission_status', $hash));
    }

    public function test_unconfigured_secret_fails_closed(): void
    {
        $ct = new ConfirmationToken('');

        self::assertFalse($ct->isConfigured());
        self::assertFalse($ct->verify('anything', 'update_submission_status', 'h'));
    }

    public function test_args_hash_is_order_independent(): void
    {
        self::assertSame(
            ConfirmationToken::argsHash(['id' => 7, 'status' => 'resolved']),
            ConfirmationToken::argsHash(['status' => 'resolved', 'id' => 7]),
        );
    }
}
