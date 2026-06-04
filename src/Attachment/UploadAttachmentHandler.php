<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FieldType;
use NeneContact\Submission\PublicFormReaderInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Public, unauthenticated multipart upload for a form's file field (D12).
 * POST /public/forms/{public_form_key}/attachments  (field name: `file`)
 *
 * Security (ADR 0010 / charter §2): allowed-origin check, size cap, content-type allowlist
 * (sniffed from bytes), virus-scan hook. Throttled by the public rate-limit middleware.
 */
final readonly class UploadAttachmentHandler implements RequestHandlerInterface
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    /** @var list<string> */
    private const ALLOWED_TYPES = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv',
    ];

    public function __construct(
        private PublicFormReaderInterface $forms,
        private AttachmentRepositoryInterface $attachments,
        private AttachmentStorageInterface $storage,
        private AttachmentScannerInterface $scanner,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $key = (string) ($parameters['public_form_key'] ?? '');

        $form = $this->forms->findByPublicFormKey($key);
        if ($form === null || $form->status !== 'active') {
            return $this->problemDetails->create($request, 'contact-form-not-found', 'Contact Form Not Found', 404, 'The requested form was not found.');
        }

        if (!$this->originAllowed($request, $form)) {
            return $this->problemDetails->create($request, 'origin-not-allowed', 'Origin Not Allowed', 403, 'This origin is not allowed to submit this form.');
        }

        $fileFieldName = $this->fileFieldName($form);
        if ($fileFieldName === null) {
            return $this->problemDetails->create($request, 'attachments-not-accepted', 'Attachments Not Accepted', 422, 'This form does not accept file attachments.');
        }

        $file = $request->getUploadedFiles()['file'] ?? null;
        if (!$file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException([new ValidationError('file', 'A file upload is required.', 'required')]);
        }

        $size = $file->getSize();
        if ($size === null || $size <= 0 || $size > self::MAX_BYTES) {
            throw new ValidationException([new ValidationError('file', 'File exceeds the maximum size of ' . self::MAX_BYTES . ' bytes.', 'too_large')]);
        }

        $bytes = (string) $file->getStream();

        $contentType = (string) (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
        if (!in_array($contentType, self::ALLOWED_TYPES, true)) {
            throw new ValidationException([new ValidationError('file', 'Unsupported file type: ' . $contentType . '.', 'unsupported_type')]);
        }

        $scanStatus = $this->scanner->scan($bytes);
        if ($scanStatus === 'infected') {
            throw new ValidationException([new ValidationError('file', 'The file failed the security scan.', 'infected')]);
        }

        $storageKey = $this->storage->put($form->organizationId, $bytes);

        $id = $this->attachments->create(new Attachment(
            organizationId: $form->organizationId,
            contactFormId: (int) $form->id,
            fieldName: $fileFieldName,
            originalFilename: $this->safeFilename($file->getClientFilename()),
            contentType: $contentType,
            sizeBytes: (int) $size,
            storageKey: $storageKey,
            scanStatus: $scanStatus,
        ));

        return $this->response->create([
            'attachment_id' => $id,
            'field_name' => $fileFieldName,
            'content_type' => $contentType,
            'size_bytes' => (int) $size,
        ], 201);
    }

    private function fileFieldName(ContactForm $form): ?string
    {
        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::File->value) {
                return $field->name;
            }
        }

        return null;
    }

    private function safeFilename(?string $name): string
    {
        $name = $name !== null ? basename($name) : '';
        $name = trim($name);

        return $name === '' ? 'upload' : mb_substr($name, 0, 255);
    }

    private function originAllowed(ServerRequestInterface $request, ContactForm $form): bool
    {
        if ($form->allowedOrigins === []) {
            return true;
        }

        $origin = $request->getHeaderLine('Origin');

        return $origin !== '' && in_array($origin, $form->allowedOrigins, true);
    }
}
