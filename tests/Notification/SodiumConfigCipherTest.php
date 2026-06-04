<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Notification\SodiumConfigCipher;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class SodiumConfigCipherTest extends TestCase
{
    private function key(): string
    {
        return base64_encode(sodium_crypto_secretbox_keygen());
    }

    public function test_round_trips_and_hides_plaintext(): void
    {
        $cipher = new SodiumConfigCipher($this->key());
        $plaintext = '{"token":"xoxb-super-secret","webhook":"https://hooks.slack.com/abc"}';

        $encrypted = $cipher->encrypt($plaintext);

        self::assertStringStartsWith('v1:', $encrypted);
        self::assertStringNotContainsString('xoxb-super-secret', $encrypted);
        self::assertStringNotContainsString('hooks.slack.com', $encrypted);
        self::assertSame($plaintext, $cipher->decrypt($encrypted));
    }

    public function test_uses_a_fresh_nonce_per_encryption(): void
    {
        $cipher = new SodiumConfigCipher($this->key());

        self::assertNotSame($cipher->encrypt('same'), $cipher->encrypt('same'));
    }

    public function test_detects_tampering(): void
    {
        $cipher = new SodiumConfigCipher($this->key());
        $encrypted = $cipher->encrypt('secret');

        // Flip a character in the base64 body.
        $tampered = substr($encrypted, 0, -2) . (str_ends_with($encrypted, 'A') ? 'B' : 'A') . '=';

        $this->expectException(RuntimeException::class);
        $cipher->decrypt($tampered);
    }

    public function test_fails_closed_without_key(): void
    {
        $this->expectException(RuntimeException::class);
        new SodiumConfigCipher('');
    }

    public function test_rejects_wrong_size_key(): void
    {
        $this->expectException(RuntimeException::class);
        new SodiumConfigCipher(base64_encode('too-short'));
    }
}
