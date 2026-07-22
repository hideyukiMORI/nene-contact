<?php

declare(strict_types=1);

namespace NeneContact\Tests\Tag;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Tag\CreateTagInput;
use NeneContact\Tag\CreateTagUseCase;
use NeneContact\Tag\TagLabelConflictException;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemoryTagRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class CreateTagUseCaseTest extends TestCase
{
    public function test_creates_tag_and_audits(): void
    {
        $repo = new InMemoryTagRepository();
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);

        $useCase = new CreateTagUseCase($repo, $audit, new FixedClock('2026-07-23T09:00:00+00:00'), $orgId);

        $tag = $useCase->execute(3, new CreateTagInput(label: '見積依頼', color: 'amber'));

        self::assertNotNull($tag->id);
        self::assertSame('見積依頼', $tag->label);
        self::assertSame('amber', $tag->color);
        self::assertSame(7, $tag->organizationId);
        self::assertNotNull($repo->findById($tag->id));

        self::assertCount(1, $audit->records);
        $record = $audit->records[0];
        self::assertSame('tag.created', $record['action']);
        self::assertSame(3, $record['actor']);
        self::assertSame(7, $record['org']);
        self::assertNull($record['before']);
        self::assertNotNull($record['after']);
        self::assertSame('見積依頼', $record['after']['label']);
    }

    public function test_rejects_duplicate_label(): void
    {
        $repo = new InMemoryTagRepository();
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $useCase = new CreateTagUseCase($repo, $audit, new FixedClock('2026-07-23T09:00:00+00:00'), $orgId);

        $useCase->execute(3, new CreateTagInput(label: 'クレーム', color: 'rose'));

        $this->expectException(TagLabelConflictException::class);
        $useCase->execute(3, new CreateTagInput(label: 'クレーム', color: 'slate'));
    }
}
