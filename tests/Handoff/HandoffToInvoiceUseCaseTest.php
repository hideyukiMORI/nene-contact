<?php

declare(strict_types=1);

namespace NeneContact\Tests\Handoff;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Handoff\HandoffToInvoiceUseCase;
use NeneContact\Handoff\SubmissionLink;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Upstream\InvoiceClientInterface;
use NeneContact\Upstream\UpstreamRequestException;
use PHPUnit\Framework\TestCase;

final class HandoffToInvoiceUseCaseTest extends TestCase
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

    private function forms(): ContactFormRepositoryInterface
    {
        return new class () implements ContactFormRepositoryInterface {
            public function save(ContactForm $form): int
            {
                return 1;
            }

            public function update(ContactForm $form): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            public function findById(int $id): ?ContactForm
            {
                if ($id === 0) {
                    return null;
                }

                return new ContactForm(
                    organizationId: 7,
                    name: 'Contact us',
                    publicFormKey: 'pubkey',
                    defaultLocale: 'ja',
                    locales: ['ja'],
                    allowedOrigins: [],
                    fields: [],
                    id: $id,
                );
            }

            public function publicFormKeyExists(string $publicFormKey): bool
            {
                return false;
            }

            public function findByPublicFormKey(string $publicFormKey): ?ContactForm
            {
                return null;
            }

            /** @return list<ContactForm> */
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
        return new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'visitor@example.com'], status: 'open', id: 9);
    }

    public function test_success_stores_client_id_and_audits_created(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $invoice = new class () implements InvoiceClientInterface {
            public string $externalReference = '';

            public function createDraftClient(string $externalReference, array $payload): string
            {
                $this->externalReference = $externalReference;

                return 'cli_123';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffToInvoiceUseCase($this->submissions($this->submission()), $this->forms(), $links, $invoice, $this->audit($capture));
        $link = $useCase->execute(5, 9);

        self::assertSame(SubmissionLink::STATUS_SUCCEEDED, $link->handoffStatus);
        self::assertSame('cli_123', $link->invoiceClientId);
        self::assertSame(SubmissionLink::TARGET_INVOICE, $link->target);
        self::assertNull($link->lastError);
        self::assertSame('9', $invoice->externalReference);
        self::assertCount(1, $capture['events']);
        self::assertSame('handoff.created', $capture['events'][0]->action);
        self::assertStringNotContainsString('visitor@example.com', json_encode($capture['events'][0]->after, JSON_THROW_ON_ERROR));
    }

    public function test_upstream_failure_is_non_destructive_and_records_failed(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $invoice = new class () implements InvoiceClientInterface {
            public function createDraftClient(string $externalReference, array $payload): string
            {
                throw new UpstreamRequestException('Invoice handoff failed with status 409.');
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffToInvoiceUseCase($this->submissions($this->submission()), $this->forms(), $links, $invoice, $this->audit($capture));
        $link = $useCase->execute(5, 9);

        self::assertSame(SubmissionLink::STATUS_FAILED, $link->handoffStatus);
        self::assertNull($link->invoiceClientId);
        self::assertSame('Invoice handoff failed with status 409.', $link->lastError);
    }

    public function test_retry_after_failure_succeeds_and_audits_retried(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $links->save(new SubmissionLink(organizationId: 7, submissionId: 9, target: SubmissionLink::TARGET_INVOICE, handoffStatus: SubmissionLink::STATUS_FAILED, lastError: 'previous failure'));

        $invoice = new class () implements InvoiceClientInterface {
            public function createDraftClient(string $externalReference, array $payload): string
            {
                return 'cli_777';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffToInvoiceUseCase($this->submissions($this->submission()), $this->forms(), $links, $invoice, $this->audit($capture));
        $link = $useCase->execute(5, 9);

        self::assertSame(SubmissionLink::STATUS_SUCCEEDED, $link->handoffStatus);
        self::assertSame('cli_777', $link->invoiceClientId);
        self::assertCount(1, $links->links); // upsert, not a duplicate row
        self::assertSame('handoff.retried', $capture['events'][0]->action);
    }

    public function test_rejects_unknown_submission(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $invoice = new class () implements InvoiceClientInterface {
            public function createDraftClient(string $externalReference, array $payload): string
            {
                return 'unused';
            }
        };
        $capture = ['events' => []];

        $useCase = new HandoffToInvoiceUseCase($this->submissions(null), $this->forms(), $links, $invoice, $this->audit($capture));

        $this->expectException(SubmissionNotFoundException::class);
        $useCase->execute(5, 404);
    }
}
