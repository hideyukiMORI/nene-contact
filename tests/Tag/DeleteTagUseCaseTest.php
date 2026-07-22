<?php

declare(strict_types=1);

namespace NeneContact\Tests\Tag;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Tag\CreateTagInput;
use NeneContact\Tag\CreateTagUseCase;
use NeneContact\Tag\DeleteTagUseCase;
use NeneContact\Tag\TagNotFoundException;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemoryTagRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class DeleteTagUseCaseTest extends TestCase
{
    public function test_soft_deletes_and_audits(): void
    {
        $repo = new InMemoryTagRepository();
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $clock = new FixedClock('2026-07-23T09:00:00+00:00');

        $created = (new CreateTagUseCase($repo, new RecordingAuditRecorder(), $clock, $orgId))
            ->execute(3, new CreateTagInput(label: '採用', color: 'green'));
        $id = $created->id;
        self::assertNotNull($id);

        (new DeleteTagUseCase($repo, $audit, $clock, $orgId))->execute(3, $id);

        // Dropped from the active vocabulary, audited.
        self::assertNull($repo->findById($id));
        self::assertSame(0, $repo->count());
        self::assertCount(1, $audit->records);
        self::assertSame('tag.deleted', $audit->records[0]['action']);
        self::assertSame(7, $audit->records[0]['org']);
    }

    public function test_unknown_id_throws_not_found(): void
    {
        $repo = new InMemoryTagRepository();
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $useCase = new DeleteTagUseCase($repo, new RecordingAuditRecorder(), new FixedClock('2026-07-23T09:00:00+00:00'), $orgId);

        $this->expectException(TagNotFoundException::class);
        $useCase->execute(3, 404);
    }
}
