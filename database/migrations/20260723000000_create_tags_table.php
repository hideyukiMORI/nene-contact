<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTagsTable extends AbstractMigration
{
    public function change(): void
    {
        // Org-managed tag vocabulary applied to submissions for triage (ADR 0019), orthogonal to
        // submission.status. Admin defines the set (label + colour); operators apply from it
        // (assignments live in a separate join, submission_tags). Org-scoped (ADR 0014); soft
        // delete only (ADR 0016) so a retired tag drops from pickers while its past assignments
        // and audit trail survive. Unique label per org is enforced among non-deleted rows in the
        // repository (a soft-deleted label may be reused).
        $this->table('tags')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('label', 'string', ['limit' => 60, 'null' => false])
            ->addColumn('color', 'string', ['limit' => 20, 'null' => false, 'default' => 'slate'])
            ->addColumn('sort_order', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null])
            ->addIndex(['organization_id'])
            ->create();
    }
}
