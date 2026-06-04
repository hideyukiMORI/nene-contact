<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use RuntimeException;
use SensitiveParameter;

/**
 * Authenticated encryption for channel secrets using libsodium `crypto_secretbox`
 * (XSalsa20-Poly1305). Each record gets a fresh random nonce; the stored envelope is
 * `v1:` + base64(nonce || ciphertext). Tampering fails decryption (authenticated).
 *
 * The key comes from `NENE_CONTACT_ENCRYPTION_KEY` (base64 of 32 random bytes). A
 * missing or malformed key throws — the cipher fails closed, never falling back to
 * plaintext (charter §6).
 */
final class SodiumConfigCipher implements ConfigCipherInterface
{
    private const PREFIX = 'v1:';

    private string $key;

    public function __construct(#[SensitiveParameter] string $base64Key)
    {
        if ($base64Key === '') {
            throw new RuntimeException('NENE_CONTACT_ENCRYPTION_KEY is not set; channel secret encryption is required (charter §6).');
        }

        $key = base64_decode($base64Key, true);

        if ($key === false || strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new RuntimeException('NENE_CONTACT_ENCRYPTION_KEY must be base64 of ' . SODIUM_CRYPTO_SECRETBOX_KEYBYTES . ' bytes.');
        }

        $this->key = $key;
    }

    public function encrypt(#[SensitiveParameter] string $plaintext): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = sodium_crypto_secretbox($plaintext, $nonce, $this->key);

        return self::PREFIX . base64_encode($nonce . $cipher);
    }

    public function decrypt(string $ciphertext): string
    {
        if (!str_starts_with($ciphertext, self::PREFIX)) {
            throw new RuntimeException('Unrecognized ciphertext envelope.');
        }

        $raw = base64_decode(substr($ciphertext, strlen(self::PREFIX)), true);

        if ($raw === false || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new RuntimeException('Malformed ciphertext.');
        }

        $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        $plaintext = sodium_crypto_secretbox_open($cipher, $nonce, $this->key);

        if ($plaintext === false) {
            throw new RuntimeException('Channel secret could not be decrypted (wrong key or tampered data).');
        }

        return $plaintext;
    }
}
