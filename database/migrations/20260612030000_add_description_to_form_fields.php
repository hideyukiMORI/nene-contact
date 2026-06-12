<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDescriptionToFormFields extends AbstractMigration
{
    public function change(): void
    {
        // Optional per-field description (hint shown under the label in the embed) — common to
        // every field type (field-config UI, builder spec v1.0 / 総合実装指示書). Null when unset.
        $this->table('form_fields')
            ->addColumn('description', 'text', ['null' => true, 'default' => null, 'after' => 'placeholder'])
            ->update();
    }
}
