<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\SlackChannelSender;
use NeneContact\Submission\Submission;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

final class SlackChannelSenderTest extends TestCase
{
    private function form(): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            id: 3,
        );
    }

    public function test_posts_summary_json_to_webhook_url(): void
    {
        $client = new class () implements ClientInterface {
            public ?RequestInterface $request = null;

            public function sendRequest(RequestInterface $request): ResponseInterface
            {
                $this->request = $request;

                return new Response(200);
            }
        };

        $sender = new SlackChannelSender($client, new Psr17Factory());
        $channel = new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'slack', config: ['webhook_url' => 'https://hooks.slack.com/services/T/B/X'], isEnabled: true, id: 1);

        self::assertTrue($sender->supports('slack'));
        $sender->send($channel, $this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['email' => 'visitor@example.com'], status: 'open', id: 9));

        self::assertNotNull($client->request);
        self::assertSame('POST', $client->request->getMethod());
        self::assertSame('https://hooks.slack.com/services/T/B/X', (string) $client->request->getUri());
        self::assertSame('application/json', $client->request->getHeaderLine('Content-Type'));
        $body = (string) $client->request->getBody();
        self::assertStringContainsString('"text"', $body);
        self::assertStringContainsString('visitor@example.com', $body);
    }

    public function test_skips_when_webhook_url_missing(): void
    {
        $client = new class () implements ClientInterface {
            public bool $called = false;

            public function sendRequest(RequestInterface $request): ResponseInterface
            {
                $this->called = true;

                return new Response(200);
            }
        };

        (new SlackChannelSender($client, new Psr17Factory()))
            ->send(new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'slack', config: [], isEnabled: true, id: 1), $this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: [], status: 'open', id: 9));

        self::assertFalse($client->called);
    }
}
