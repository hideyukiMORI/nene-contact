<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Http\UtcClock;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\PurgeSubmissionsUseCase;
use NeneContact\Submission\RetentionPolicy;
use NeneContact\Tests\Attachment\InMemoryAttachmentPurgeRepository;
use NeneContact\Tests\Attachment\InMemoryAttachmentStorage;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class PurgeSubmissionsUseCaseTest extends TestCase
{
    /**
     * @param list<array{id: int, organization_id: int, submitted_at: string, retention_days: int}> $active
     * @param list<array{id: int, organization_id: int, deleted_at: string}> $softDeleted
     */
    private function repo(array $active, array $softDeleted): InMemorySubmissionPurgeRepository
    {
        return new InMemorySubmissionPurgeRepository($active, $softDeleted);
    }

    private function auditRepo(): InMemoryAuditEventRepository
    {
        return new InMemoryAuditEventRepository();
    }

    public function test_apply_soft_deletes_expired_and_hard_deletes_after_grace(): void
    {
        $old = date('Y-m-d H:i:s', time() - (400 * 86400)); // older than default 365d
        $fresh = date('Y-m-d H:i:s', time() - (10 * 86400)); // within retention
        $longDeleted = date('Y-m-d H:i:s', time() - ((RetentionPolicy::GRACE_DAYS + 5) * 86400));
        $recentlyDeleted = date('Y-m-d H:i:s', time() - (1 * 86400));

        $repo = $this->repo(
            [
                ['id' => 1, 'organization_id' => 7, 'submitted_at' => $old, 'retention_days' => RetentionPolicy::DEFAULT_RETENTION_DAYS],
                ['id' => 2, 'organization_id' => 7, 'submitted_at' => $fresh, 'retention_days' => RetentionPolicy::DEFAULT_RETENTION_DAYS],
            ],
            [
                ['id' => 3, 'organization_id' => 7, 'deleted_at' => $longDeleted],
                ['id' => 4, 'organization_id' => 7, 'deleted_at' => $recentlyDeleted],
            ],
        );
        $audit = $this->auditRepo();

        $result = (new PurgeSubmissionsUseCase($repo, new InMemoryAttachmentPurgeRepository(), new InMemoryAttachmentStorage(), new AuditRecorder($audit), new UtcClock()))->execute(true);

        self::assertSame(1, $result->expired);
        self::assertSame(1, $result->purged);
        self::assertTrue($result->applied);
        self::assertSame([1], $repo->softDeletedIds);
        self::assertSame([3], $repo->erasedIds);

        $actions = array_map(static fn (AuditEvent $e): string => $e->action, $audit->events);
        self::assertContains('submission.expired', $actions);
        self::assertContains('submission.purged', $actions);
        // No PII in purge audit (snapshots carry no field values).
        self::assertStringNotContainsString('email', json_encode(array_map(
            static fn (AuditEvent $e): array => [$e->before, $e->after],
            $audit->events,
        ), JSON_THROW_ON_ERROR));
    }

    public function test_dry_run_counts_without_mutating(): void
    {
        $old = date('Y-m-d H:i:s', time() - (400 * 86400));
        $longDeleted = date('Y-m-d H:i:s', time() - ((RetentionPolicy::GRACE_DAYS + 5) * 86400));

        $repo = $this->repo(
            [['id' => 1, 'organization_id' => 7, 'submitted_at' => $old, 'retention_days' => RetentionPolicy::DEFAULT_RETENTION_DAYS]],
            [['id' => 3, 'organization_id' => 7, 'deleted_at' => $longDeleted]],
        );
        $audit = $this->auditRepo();

        $result = (new PurgeSubmissionsUseCase($repo, new InMemoryAttachmentPurgeRepository(), new InMemoryAttachmentStorage(), new AuditRecorder($audit), new UtcClock()))->execute(false);

        self::assertSame(1, $result->expired);
        self::assertSame(1, $result->purged);
        self::assertFalse($result->applied);
        // Dry-run mutates nothing and writes no audit events.
        self::assertSame([], $repo->softDeletedIds);
        self::assertSame([], $repo->erasedIds);
        self::assertCount(0, $audit->events);
    }

    public function test_form_retention_override_is_respected(): void
    {
        // 40 days old, form retention 30 → expired despite default being 365.
        $row = ['id' => 1, 'organization_id' => 7, 'submitted_at' => date('Y-m-d H:i:s', time() - (40 * 86400)), 'retention_days' => 30];
        $repo = $this->repo([$row], []);

        $result = (new PurgeSubmissionsUseCase($repo, new InMemoryAttachmentPurgeRepository(), new InMemoryAttachmentStorage(), new AuditRecorder($this->auditRepo()), new UtcClock()))->execute(true);

        self::assertSame(1, $result->expired);
        self::assertSame([1], $repo->softDeletedIds);
    }

    public function test_erases_attachments_of_purged_submission_and_orphans(): void
    {
        $longDeleted = date('Y-m-d H:i:s', time() - ((RetentionPolicy::GRACE_DAYS + 5) * 86400));
        $oldOrphan = date('Y-m-d H:i:s', time() - ((RetentionPolicy::ORPHAN_GRACE_DAYS + 1) * 86400));
        $freshOrphan = date('Y-m-d H:i:s', time() - 60);

        $repo = $this->repo([], [['id' => 3, 'organization_id' => 7, 'deleted_at' => $longDeleted]]);

        $attachments = new InMemoryAttachmentPurgeRepository(
            [3 => [['id' => 100, 'organization_id' => 7, 'storage_key' => '7/aaaa']]],
            [
                ['id' => 200, 'organization_id' => 7, 'storage_key' => '7/bbbb', 'created_at' => $oldOrphan],
                ['id' => 201, 'organization_id' => 7, 'storage_key' => '7/cccc', 'created_at' => $freshOrphan],
            ],
        );
        $storage = new InMemoryAttachmentStorage();
        $storage->stored = ['7/aaaa' => 'x', '7/bbbb' => 'y', '7/cccc' => 'z'];
        $audit = $this->auditRepo();

        $result = (new PurgeSubmissionsUseCase($repo, $attachments, $storage, new AuditRecorder($audit), new UtcClock()))->execute(true);

        // Linked attachment of the purged submission + the aged orphan are erased; fresh orphan stays.
        self::assertSame(2, $result->attachmentsErased);
        self::assertSame([100], $attachments->purgedIds);
        self::assertSame([200], $attachments->orphanPurgedIds);
        self::assertArrayNotHasKey('7/aaaa', $storage->stored);
        self::assertArrayNotHasKey('7/bbbb', $storage->stored);
        self::assertArrayHasKey('7/cccc', $storage->stored);

        $actions = array_map(static fn (AuditEvent $e): string => $e->action, $audit->events);
        self::assertContains('attachment.purged', $actions);
    }
}
