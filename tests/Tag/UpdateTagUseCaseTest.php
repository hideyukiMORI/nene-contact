<?php

declare(strict_types=1);

namespace NeneContact\Tests\Tag;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Tag\CreateTagInput;
use NeneContact\Tag\CreateTagUseCase;
use NeneContact\Tag\TagLabelConflictException;
use NeneContact\Tag\TagNotFoundException;
use NeneContact\Tag\UpdateTagInput;
use NeneContact\Tag\UpdateTagUseCase;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemoryTagRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class UpdateTagUseCaseTest extends TestCase
{
    public function test_merges_patch_and_audits_before_after(): void
    {
        $repo = new InMemoryTagRepository();
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $clock = new FixedClock('2026-07-23T09:00:00+00:00');

        $created = (new CreateTagUseCase($repo, new RecordingAuditRecorder(), $clock, $orgId))
            ->execute(3, new CreateTagInput(label: '相談', color: 'slate'));
        $id = $created->id;
        self::assertNotNull($id);

        $useCase = new UpdateTagUseCase($repo, $audit, $clock, $orgId);
        // Only the colour is patched; the label is preserved.
        $updated = $useCase->execute(3, $id, new UpdateTagInput(label: null, color: 'teal', sortOrder: null));

        self::assertSame('相談', $updated->label);
        self::assertSame('teal', $updated->color);

        self::assertCount(1, $audit->records);
        $record = $audit->records[0];
        self::assertSame('tag.updated', $record['action']);
        self::assertNotNull($record['before']);
        self::assertNotNull($record['after']);
        self::assertSame('slate', $record['before']['color']);
        self::assertSame('teal', $record['after']['color']);
        self::assertSame('相談', $record['after']['label']);
    }

    public function test_unknown_id_throws_not_found(): void
    {
        $repo = new InMemoryTagRepository();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $useCase = new UpdateTagUseCase($repo, new RecordingAuditRecorder(), new FixedClock('2026-07-23T09:00:00+00:00'), $orgId);

        $this->expectException(TagNotFoundException::class);
        $useCase->execute(3, 999, new UpdateTagInput(label: 'x', color: null, sortOrder: null));
    }

    public function test_rename_to_existing_label_conflicts(): void
    {
        $repo = new InMemoryTagRepository();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $clock = new FixedClock('2026-07-23T09:00:00+00:00');
        $create = new CreateTagUseCase($repo, new RecordingAuditRecorder(), $clock, $orgId);
        $create->execute(3, new CreateTagInput(label: 'A', color: 'slate'));
        $b = $create->execute(3, new CreateTagInput(label: 'B', color: 'slate'));
        $bId = $b->id;
        self::assertNotNull($bId);

        $useCase = new UpdateTagUseCase($repo, new RecordingAuditRecorder(), $clock, $orgId);
        $this->expectException(TagLabelConflictException::class);
        $useCase->execute(3, $bId, new UpdateTagInput(label: 'A', color: null, sortOrder: null));
    }
}
