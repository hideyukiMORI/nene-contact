<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientInterface;
use RuntimeException;

/**
 * Posts the submission summary to a Slack incoming webhook (`config.webhook_url`).
 */
final readonly class SlackChannelSender implements ChannelSenderInterface
{
    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
    ) {
    }

    public function supports(string $channelType): bool
    {
        return $channelType === 'slack';
    }

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
    {
        $webhookUrl = isset($channel->config['webhook_url']) ? trim((string) $channel->config['webhook_url']) : '';
        if ($webhookUrl === '') {
            return;
        }

        $payload = json_encode(['text' => SubmissionSummary::text($form, $submission)], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        $request = $this->psr17->createRequest('POST', $webhookUrl)
            ->withHeader('Content-Type', 'application/json')
            ->withBody($this->psr17->createStream($payload));

        $response = $this->http->sendRequest($request);

        if ($response->getStatusCode() >= 400) {
            throw new RuntimeException('Slack dispatch failed with status ' . $response->getStatusCode() . '.');
        }
    }
}
