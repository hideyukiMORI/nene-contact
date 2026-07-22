<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSubmissionTagsTable extends AbstractMigration
{
    public function change(): void
    {
        // Assignment of an org tag to a submission (ADR 0019). Append-only with a soft remove
        // (`deleted_at`, ADR 0016) so untag is auditable and reversible without DELETE; one active
        // row per (submission_id, tag_id) is enforced in the repository. Org scoping comes from the
        // joined `tags`/`submissions` rows (both carry organization_id); no org column is duplicated
        // here. Assignments survive a submission's erase-in-place PII purge — they are not PII.
        $this->table('submission_tags')
            ->addColumn('submission_id', 'integer', ['null' => false])
            ->addColumn('tag_id', 'integer', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null])
            // One row per pair — the invariant "one active assignment per (submission, tag)"
            // holds even under concurrent double-apply (re-tag reactivates the row via upsert).
            ->addIndex(['submission_id', 'tag_id'], ['unique' => true, 'name' => 'uniq_submission_tags_pair'])
            ->addIndex(['tag_id'])
            ->create();
    }
}
