<?php

declare(strict_types=1);

namespace NeneContact\Tests\Attachment;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationException;
use NeneContact\Attachment\AttachmentRepositoryInterface;
use NeneContact\Attachment\AttachmentStorageInterface;
use NeneContact\Attachment\NullAttachmentScanner;
use NeneContact\Attachment\UploadAttachmentHandler;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Submission\PublicFormReaderInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\ServerRequest;
use Nyholm\Psr7\UploadedFile;
use PHPUnit\Framework\TestCase;

final class UploadAttachmentHandlerTest extends TestCase
{
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMCAQDJj9hwAAAAAElFTkSuQmCC';

    private function reader(bool $withFileField): PublicFormReaderInterface
    {
        $fields = $withFileField
            ? [new FormField(fieldType: 'file', name: 'cv', label: ['ja' => '履歴書'], required: false, sortOrder: 0)]
            : [new FormField(fieldType: 'text', name: 'name', label: ['ja' => '氏名'], required: true, sortOrder: 0)];

        return new class ($fields) implements PublicFormReaderInterface {
            /** @param list<FormField> $fields */
            public function __construct(private array $fields)
            {
            }

            public function findByPublicFormKey(string $publicFormKey): ContactForm
            {
                return new ContactForm(
                    organizationId: 7,
                    name: 'F',
                    publicFormKey: $publicFormKey,
                    defaultLocale: 'ja',
                    locales: ['ja'],
                    allowedOrigins: [],
                    fields: $this->fields,
                    status: 'active',
                    id: 3,
                );
            }
        };
    }

    private function handler(PublicFormReaderInterface $reader, AttachmentRepositoryInterface $repo, AttachmentStorageInterface $storage): UploadAttachmentHandler
    {
        $psr17 = new Psr17Factory();

        return new UploadAttachmentHandler(
            $reader,
            $repo,
            $storage,
            new NullAttachmentScanner(),
            new JsonResponseFactory($psr17, $psr17),
            new ProblemDetailsResponseFactory($psr17, $psr17),
        );
    }

    private function request(string $bytes, string $filename): ServerRequest
    {
        $psr17 = new Psr17Factory();
        $file = new UploadedFile($psr17->createStream($bytes), strlen($bytes), UPLOAD_ERR_OK, $filename, 'application/octet-stream');

        return (new ServerRequest('POST', '/public/forms/k/attachments'))
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['public_form_key' => 'k'])
            ->withUploadedFiles(['file' => $file]);
    }

    public function test_stores_allowed_file_and_returns_id(): void
    {
        $repo = new InMemoryAttachmentRepository();
        $storage = new InMemoryAttachmentStorage();
        $response = $this->handler($this->reader(true), $repo, $storage)
            ->handle($this->request((string) base64_decode(self::PNG, true), 'photo.png'));

        self::assertSame(201, $response->getStatusCode());
        self::assertCount(1, $repo->created);
        self::assertSame('image/png', $repo->created[0]->contentType);
        self::assertSame('cv', $repo->created[0]->fieldName);
        self::assertSame('photo.png', $repo->created[0]->originalFilename);
        self::assertCount(1, $storage->stored);
    }

    public function test_rejects_unsupported_type(): void
    {
        $this->expectException(ValidationException::class);

        $this->handler($this->reader(true), new InMemoryAttachmentRepository(), new InMemoryAttachmentStorage())
            ->handle($this->request('#!/bin/sh' . "\n" . 'rm -rf /', 'evil.sh'));
    }

    public function test_404_when_form_has_no_file_field(): void
    {
        $response = $this->handler($this->reader(false), new InMemoryAttachmentRepository(), new InMemoryAttachmentStorage())
            ->handle($this->request((string) base64_decode(self::PNG, true), 'photo.png'));

        self::assertSame(422, $response->getStatusCode());
    }
}
