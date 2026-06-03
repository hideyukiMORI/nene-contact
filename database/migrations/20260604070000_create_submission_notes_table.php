<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSubmissionNotesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('submission_notes')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('submission_id', 'integer', ['null' => false])
            ->addColumn('author_user_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('body', 'text', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['submission_id'])
            ->addIndex(['organization_id'])
            ->create();
    }
}
