<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDeletedAtToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Soft-delete marker (charter §4/§5): set when an operator deletes a submission;
        // the row is hidden from the inbox and hard-deleted by the purge job after a grace
        // period. The audit trail proves deletion without re-storing personal data.
        $this->table('submissions')
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'submitted_at'])
            ->addIndex(['deleted_at'])
            ->update();
    }
}
