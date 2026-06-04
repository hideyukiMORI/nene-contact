<?php

declare(strict_types=1);

namespace NeneContact\Tests\Handoff;

use NeneContact\Attachment\Attachment;
use NeneContact\Attachment\AttachmentNotFoundException;
use NeneContact\Attachment\AttachmentRepositoryInterface;
use NeneContact\Attachment\AttachmentStorageInterface;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Handoff\HandoffAttachmentToVaultUseCase;
use NeneContact\Handoff\SubmissionLink;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Upstream\UpstreamRequestException;
use NeneContact\Upstream\VaultClientInterface;
use PHPUnit\Framework\TestCase;

final class HandoffAttachmentToVaultUseCaseTest extends TestCase
{
    private function submissions(?Submission $seed): SubmissionRepositoryInterface
    {
        return new class ($seed) implements SubmissionRepositoryInterface {
            public function __construct(private ?Submission $current)
            {
            }

            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->current;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            /** @param array<string, mixed> $values */
            public function updateFieldValues(int $id, array $values): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };
    }

    private function attachments(?Attachment $seed): AttachmentRepositoryInterface
    {
        return new class ($seed) implements AttachmentRepositoryInterface {
            public function __construct(private ?Attachment $current)
            {
            }

            public function create(Attachment $attachment): int
            {
                return 1;
            }

            public function findPendingForLink(int $id, int $organizationId, int $contactFormId): ?Attachment
            {
                return null;
            }

            public function linkToSubmission(int $id, int $organizationId, int $submissionId): void
            {
            }

            /** @return list<Attachment> */
            public function listBySubmission(int $submissionId): array
            {
                return $this->current !== null ? [$this->current] : [];
            }

            public function findForDownload(int $id, int $submissionId): ?Attachment
            {
                return $this->current;
            }
        };
    }

    private function storage(?string $bytes): AttachmentStorageInterface
    {
        return new class ($bytes) implements AttachmentStorageInterface {
            public function __construct(private ?string $bytes)
            {
            }

            public function put(int $organizationId, string $bytes): string
            {
                return 'key';
            }

            public function get(string $storageKey): ?string
            {
                return $this->bytes;
            }

            public function erase(string $storageKey): void
            {
            }
        };
    }

    /** @param array{events: list<AuditEvent>} $capture */
    private function audit(array &$capture): AuditRecorder
    {
        $repo = new class ($capture) implements AuditEventRepositoryInterface {
            /** @param array{events: list<AuditEvent>} $capture */
            public function __construct(private array &$capture)
            {
            }

            public function append(AuditEvent $event): int
            {
                $this->capture['events'][] = $event;

                return count($this->capture['events']);
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->capture['events'];
            }

            public function count(): int
            {
                return count($this->capture['events']);
            }
        };

        return new AuditRecorder($repo);
    }

    private function submission(): Submission
    {
        return new Submission(organizationId: 7, contactFormId: 2, fieldValues: [], status: 'open', id: 9);
    }

    private function attachment(): Attachment
    {
        return new Attachment(
            organizationId: 7,
            contactFormId: 2,
            fieldName: 'file',
            originalFilename: 'resume.pdf',
            contentType: 'application/pdf',
            sizeBytes: 13,
            storageKey: 'org/7/abc',
            submissionId: 9,
            id: 4,
        );
    }

    public function test_success_stores_document_id_and_audits_created(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $vault = new class () implements VaultClientInterface {
            public string $externalReference = '';

            public string $filename = '';

            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                $this->externalReference = $externalReference;
                $this->filename = $filename;

                return 'doc_123';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffAttachmentToVaultUseCase(
            $this->submissions($this->submission()),
            $this->attachments($this->attachment()),
            $this->storage('%PDF bytes'),
            $links,
            $vault,
            $this->audit($capture),
        );
        $link = $useCase->execute(5, 9, 4);

        self::assertSame(SubmissionLink::STATUS_SUCCEEDED, $link->handoffStatus);
        self::assertSame('doc_123', $link->vaultDocumentId);
        self::assertSame(SubmissionLink::TARGET_VAULT, $link->target);
        self::assertSame(4, $link->attachmentId);
        self::assertNull($link->lastError);
        self::assertSame('contact-submission-9-attachment-4', $vault->externalReference);
        self::assertSame('resume.pdf', $vault->filename);
        self::assertCount(1, $capture['events']);
        self::assertSame('handoff.created', $capture['events'][0]->action);
    }

    public function test_upstream_failure_is_non_destructive_and_records_failed(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $vault = new class () implements VaultClientInterface {
            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                throw new UpstreamRequestException('Vault handoff failed with status 500.');
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffAttachmentToVaultUseCase(
            $this->submissions($this->submission()),
            $this->attachments($this->attachment()),
            $this->storage('%PDF bytes'),
            $links,
            $vault,
            $this->audit($capture),
        );
        $link = $useCase->execute(5, 9, 4);

        self::assertSame(SubmissionLink::STATUS_FAILED, $link->handoffStatus);
        self::assertNull($link->vaultDocumentId);
        self::assertSame('Vault handoff failed with status 500.', $link->lastError);
        self::assertCount(1, $capture['events']);
        self::assertSame('handoff.created', $capture['events'][0]->action);
    }

    public function test_retry_per_attachment_is_idempotent_and_audits_retried(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $links->save(new SubmissionLink(organizationId: 7, submissionId: 9, target: SubmissionLink::TARGET_VAULT, handoffStatus: SubmissionLink::STATUS_FAILED, lastError: 'prev', attachmentId: 4));

        $vault = new class () implements VaultClientInterface {
            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                return 'doc_777';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffAttachmentToVaultUseCase(
            $this->submissions($this->submission()),
            $this->attachments($this->attachment()),
            $this->storage('%PDF bytes'),
            $links,
            $vault,
            $this->audit($capture),
        );
        $link = $useCase->execute(5, 9, 4);

        self::assertSame(SubmissionLink::STATUS_SUCCEEDED, $link->handoffStatus);
        self::assertSame('doc_777', $link->vaultDocumentId);
        self::assertCount(1, $links->links); // upsert per (submission, vault, attachment)
        self::assertCount(1, $capture['events']);
        self::assertSame('handoff.retried', $capture['events'][0]->action);
    }

    public function test_two_attachments_create_two_vault_links(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $vault = new class () implements VaultClientInterface {
            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                return 'doc_' . $externalReference;
            }
        };
        $capture = ['events' => []];
        $att = $this->attachment();
        $att2 = new Attachment(organizationId: 7, contactFormId: 2, fieldName: 'file2', originalFilename: 'b.pdf', contentType: 'application/pdf', sizeBytes: 9, storageKey: 'org/7/def', submissionId: 9, id: 5);

        $uc1 = new HandoffAttachmentToVaultUseCase($this->submissions($this->submission()), $this->attachments($att), $this->storage('a'), $links, $vault, $this->audit($capture));
        $uc1->execute(5, 9, 4);
        $uc2 = new HandoffAttachmentToVaultUseCase($this->submissions($this->submission()), $this->attachments($att2), $this->storage('b'), $links, $vault, $this->audit($capture));
        $uc2->execute(5, 9, 5);

        self::assertCount(2, $links->links);
        self::assertCount(2, $links->findBySubmission(9));
    }

    public function test_rejects_unknown_submission(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $vault = new class () implements VaultClientInterface {
            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                return 'unused';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffAttachmentToVaultUseCase($this->submissions(null), $this->attachments($this->attachment()), $this->storage('x'), $links, $vault, $this->audit($capture));

        $this->expectException(SubmissionNotFoundException::class);
        $useCase->execute(5, 404, 4);
    }

    public function test_rejects_unknown_attachment(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $vault = new class () implements VaultClientInterface {
            public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
            {
                return 'unused';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffAttachmentToVaultUseCase($this->submissions($this->submission()), $this->attachments(null), $this->storage('x'), $links, $vault, $this->audit($capture));

        $this->expectException(AttachmentNotFoundException::class);
        $useCase->execute(5, 9, 404);
    }
}
