<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAttachmentIdToSubmissionLinks extends AbstractMigration
{
    public function change(): void
    {
        // Vault archives a submission *attachment* as a received document (M5, DO D12), so a
        // submission can have several vault links — one per attachment. Add attachment_id and
        // widen the uniqueness key to (submission_id, target, attachment_id). Deal rows keep
        // attachment_id NULL (application logic still upserts a single deal link per submission).
        $table = $this->table('submission_links');
        $table
            ->addColumn('attachment_id', 'integer', ['null' => true, 'default' => null, 'after' => 'submission_id'])
            ->removeIndex(['submission_id', 'target'])
            ->addIndex(['submission_id', 'target', 'attachment_id'], ['unique' => true])
            ->addIndex(['attachment_id'])
            ->update();
    }
}
