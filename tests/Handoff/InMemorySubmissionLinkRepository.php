<?php

declare(strict_types=1);

namespace NeneContact\Tests\Handoff;

use NeneContact\Handoff\SubmissionLink;
use NeneContact\Handoff\SubmissionLinkRepositoryInterface;

/** Test double: keeps links in memory, upserting by (submission_id, target). */
final class InMemorySubmissionLinkRepository implements SubmissionLinkRepositoryInterface
{
    /** @var list<SubmissionLink> */
    public array $links = [];

    private int $nextId = 1;

    public function findBySubmissionAndTarget(int $submissionId, string $target): ?SubmissionLink
    {
        return $this->findBySubmissionTargetAttachment($submissionId, $target, null);
    }

    public function findBySubmissionTargetAttachment(int $submissionId, string $target, ?int $attachmentId): ?SubmissionLink
    {
        foreach ($this->links as $link) {
            if ($link->submissionId === $submissionId && $link->target === $target && $link->attachmentId === $attachmentId) {
                return $link;
            }
        }

        return null;
    }

    /** @return list<SubmissionLink> */
    public function findBySubmission(int $submissionId): array
    {
        return array_values(array_filter($this->links, static fn (SubmissionLink $l): bool => $l->submissionId === $submissionId));
    }

    public function save(SubmissionLink $link): int
    {
        $existing = $this->findBySubmissionTargetAttachment($link->submissionId, $link->target, $link->attachmentId);
        $id = $existing !== null ? (int) $existing->id : $this->nextId++;

        $stored = new SubmissionLink(
            organizationId: $link->organizationId,
            submissionId: $link->submissionId,
            target: $link->target,
            handoffStatus: $link->handoffStatus,
            dealOpportunityId: $link->dealOpportunityId,
            vaultDocumentId: $link->vaultDocumentId,
            invoiceClientId: $link->invoiceClientId,
            lastError: $link->lastError,
            attachmentId: $link->attachmentId,
            id: $id,
        );

        $this->links = array_values(array_filter(
            $this->links,
            static fn (SubmissionLink $l): bool => !($l->submissionId === $link->submissionId && $l->target === $link->target && $l->attachmentId === $link->attachmentId),
        ));
        $this->links[] = $stored;

        return $id;
    }
}
