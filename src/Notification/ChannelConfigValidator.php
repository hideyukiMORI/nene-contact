<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Validation\ValidationError;

/**
 * Normalizes and validates channel-specific config for every channel type. Shared by the
 * create and update paths so a misconfigured channel cannot be stored either way (the root
 * cause of a chatwork channel saved with a `rid`-prefixed room_id that silently failed on
 * every submission).
 */
final class ChannelConfigValidator
{
    /** @var list<string> */
    public const CHANNEL_TYPES = ['email', 'slack', 'chatwork', 'webhook'];

    /**
     * Trims every string value and — for chatwork — strips a leading `rid` that operators paste
     * straight from the room URL (`.../#!rid12345`), where only the trailing digits are the real
     * room id. Applied before validation and before storage.
     *
     * @param array<string, mixed> $config
     * @return array<string, mixed>
     */
    public static function normalize(string $channelType, array $config): array
    {
        $normalized = [];
        foreach ($config as $key => $value) {
            $normalized[$key] = is_string($value) ? trim($value) : $value;
        }

        if ($channelType === 'chatwork'
            && isset($normalized['room_id'])
            && is_string($normalized['room_id'])
            && preg_match('/^rid(\d+)$/i', $normalized['room_id'], $matches) === 1
        ) {
            $normalized['room_id'] = $matches[1];
        }

        return $normalized;
    }

    /**
     * @param array<string, mixed> $config already normalized via {@see self::normalize()}
     * @return list<ValidationError>
     */
    public static function validate(string $channelType, array $config): array
    {
        $errors = [];

        switch ($channelType) {
            case 'email':
                $recipient = self::str($config, 'recipient');
                if ($recipient === '' || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
                    $errors[] = new ValidationError('config.recipient', 'A valid recipient email is required for email channels.', 'invalid_email');
                }
                break;

            case 'slack':
                $webhookUrl = self::str($config, 'webhook_url');
                if (!str_starts_with($webhookUrl, 'https://hooks.slack.com/')) {
                    $errors[] = new ValidationError('config.webhook_url', 'A Slack incoming webhook URL (https://hooks.slack.com/…) is required.', 'invalid');
                }
                break;

            case 'chatwork':
                if (self::str($config, 'api_token') === '') {
                    $errors[] = new ValidationError('config.api_token', 'A Chatwork API token is required.', 'required');
                }
                $roomId = self::str($config, 'room_id');
                if ($roomId === '' || ctype_digit($roomId) === false) {
                    $errors[] = new ValidationError('config.room_id', 'The Chatwork room_id must be digits only — the number after "#!rid" in the room URL.', 'invalid');
                }
                break;

            case 'webhook':
                $url = self::str($config, 'url');
                if ($url === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
                    $errors[] = new ValidationError('config.url', 'A valid url is required for webhook channels.', 'invalid');
                }
                if (self::str($config, 'secret') === '') {
                    $errors[] = new ValidationError('config.secret', 'A signing secret is required for webhook channels.', 'required');
                }
                break;
        }

        return $errors;
    }

    /** @param array<string, mixed> $config */
    private static function str(array $config, string $key): string
    {
        $value = $config[$key] ?? '';

        return is_scalar($value) ? trim((string) $value) : '';
    }
}
