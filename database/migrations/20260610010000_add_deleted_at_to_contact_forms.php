<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDeletedAtToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Deleting a form is a soft delete (ADR 0016 — no physical row deletion). Deleted
        // forms drop out of every read; received submissions are retained. The audit trail
        // (contact_form.deleted) records who removed it (ADR 0013).
        $this->table('contact_forms')
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'updated_at'])
            ->addIndex(['organization_id', 'deleted_at'])
            ->update();
    }
}
