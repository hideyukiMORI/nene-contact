<?php

declare(strict_types=1);

namespace NeneContact\Notification;

/**
 * Encrypts/decrypts notification channel config at rest (charter §6). Channel config may
 * hold secrets (Slack/Chatwork tokens, webhook URLs), so it is never stored in plaintext.
 */
interface ConfigCipherInterface
{
    public function encrypt(string $plaintext): string;

    public function decrypt(string $ciphertext): string;
}
