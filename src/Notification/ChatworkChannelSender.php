<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientInterface;
use RuntimeException;

/**
 * Posts the submission summary to a Chatwork room via the v2 API
 * (`POST /rooms/{room_id}/messages`, `X-ChatWorkToken` header). Config: `api_token`,
 * `room_id`.
 */
final readonly class ChatworkChannelSender implements ChannelSenderInterface
{
    private const API_BASE = 'https://api.chatwork.com/v2';

    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
    ) {
    }

    public function supports(string $channelType): bool
    {
        return $channelType === 'chatwork';
    }

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
    {
        $token = isset($channel->config['api_token']) ? trim((string) $channel->config['api_token']) : '';
        $roomId = isset($channel->config['room_id']) ? trim((string) $channel->config['room_id']) : '';
        if ($token === '' || $roomId === '') {
            return;
        }

        $body = http_build_query(['body' => SubmissionSummary::text($form, $submission)]);

        $request = $this->psr17->createRequest('POST', self::API_BASE . '/rooms/' . rawurlencode($roomId) . '/messages')
            ->withHeader('X-ChatWorkToken', $token)
            ->withHeader('Content-Type', 'application/x-www-form-urlencoded')
            ->withBody($this->psr17->createStream($body));

        $response = $this->http->sendRequest($request);

        if ($response->getStatusCode() >= 400) {
            throw new RuntimeException('Chatwork dispatch failed with status ' . $response->getStatusCode() . '.');
        }
    }
}
