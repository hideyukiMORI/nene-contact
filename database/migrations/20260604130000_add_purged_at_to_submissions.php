<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPurgedAtToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Set when the purge job erases a submission's PII in place (ADR 0016): the row
        // survives for the audit trail while field values / ip / user_agent are cleared.
        $this->table('submissions')
            ->addColumn('purged_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'deleted_at'])
            ->update();
    }
}
