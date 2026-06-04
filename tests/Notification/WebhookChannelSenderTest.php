<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\WebhookChannelSender;
use NeneContact\Submission\Submission;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

final class WebhookChannelSenderTest extends TestCase
{
    private function form(): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'pubkey',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            id: 3,
        );
    }

    public function test_posts_signed_payload_that_verifies_with_the_secret(): void
    {
        $client = new class () implements ClientInterface {
            public ?RequestInterface $request = null;

            public function sendRequest(RequestInterface $request): ResponseInterface
            {
                $this->request = $request;

                return new Response(200);
            }
        };

        $secret = 'whsec_test_123';
        $sender = new WebhookChannelSender($client, new Psr17Factory());
        $channel = new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'webhook', config: ['url' => 'https://ops.example.com/hook', 'secret' => $secret], isEnabled: true, id: 1);

        self::assertTrue($sender->supports('webhook'));
        $sender->send($channel, $this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['email' => 'visitor@example.com'], status: 'open', id: 9));

        self::assertNotNull($client->request);
        self::assertSame('POST', $client->request->getMethod());
        self::assertSame('https://ops.example.com/hook', (string) $client->request->getUri());
        self::assertSame('submission.created', $client->request->getHeaderLine('X-NeNe-Event'));
        self::assertNotSame('', $client->request->getHeaderLine('X-NeNe-Delivery'));

        $body = (string) $client->request->getBody();
        // The signature header verifies against the body with the shared secret.
        $expected = 'sha256=' . hash_hmac('sha256', $body, $secret);
        self::assertSame($expected, $client->request->getHeaderLine('X-NeNe-Signature'));

        // The secret itself is never in the payload.
        self::assertStringNotContainsString($secret, $body);
        self::assertStringContainsString('visitor@example.com', $body);
        self::assertStringContainsString('"event":"submission.created"', $body);
    }

    public function test_skips_when_url_or_secret_missing(): void
    {
        $client = new class () implements ClientInterface {
            public bool $called = false;

            public function sendRequest(RequestInterface $request): ResponseInterface
            {
                $this->called = true;

                return new Response(200);
            }
        };

        (new WebhookChannelSender($client, new Psr17Factory()))
            ->send(new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'webhook', config: ['url' => 'https://x/y'], isEnabled: true, id: 1), $this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: [], status: 'open', id: 9));

        self::assertFalse($client->called);
    }
}
