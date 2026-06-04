<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientInterface;
use RuntimeException;

/**
 * Posts a signed JSON payload to an operator-configured webhook (`config.url`) on a new
 * submission (scope D6). The body is signed with HMAC-SHA256 using `config.secret` so the
 * receiver can verify authenticity (`X-NeNe-Signature: sha256=<hex>`). The target URL is
 * the operator's responsibility (they are the data controller).
 */
final readonly class WebhookChannelSender implements ChannelSenderInterface
{
    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
    ) {
    }

    public function supports(string $channelType): bool
    {
        return $channelType === 'webhook';
    }

    public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
    {
        $url = isset($channel->config['url']) ? trim((string) $channel->config['url']) : '';
        $secret = isset($channel->config['secret']) ? (string) $channel->config['secret'] : '';
        if ($url === '' || $secret === '') {
            return;
        }

        $body = json_encode([
            'event' => 'submission.created',
            'submission_id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'public_form_key' => $form->publicFormKey,
            'submitted_at' => $submission->submittedAt ?? date('c'),
            'field_values' => $submission->fieldValues,
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        $signature = hash_hmac('sha256', $body, $secret);

        $request = $this->psr17->createRequest('POST', $url)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('X-NeNe-Event', 'submission.created')
            ->withHeader('X-NeNe-Delivery', bin2hex(random_bytes(16)))
            ->withHeader('X-NeNe-Signature', 'sha256=' . $signature)
            ->withBody($this->psr17->createStream($body));

        $response = $this->http->sendRequest($request);

        if ($response->getStatusCode() >= 400) {
            throw new RuntimeException('Webhook dispatch failed with status ' . $response->getStatusCode() . '.');
        }
    }
}
