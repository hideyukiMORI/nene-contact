<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDeletedAtToFormFields extends AbstractMigration
{
    public function change(): void
    {
        // Editing a form replaces its field set, but physical row deletion is forbidden
        // (ADR 0016). Removed/old field definitions are soft-deleted (deleted_at set) and
        // excluded from reads; only live (deleted_at IS NULL) fields render.
        $this->table('form_fields')
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'updated_at'])
            ->addIndex(['contact_form_id', 'deleted_at'])
            ->update();
    }
}
