<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPlaceholderToFormFields extends AbstractMigration
{
    public function change(): void
    {
        // Optional per-field placeholder (hint text) shown on the input in the embed
        // (builder spec v1.0).
        $this->table('form_fields')
            ->addColumn('placeholder', 'string', ['limit' => 255, 'null' => true, 'default' => null, 'after' => 'name'])
            ->update();
    }
}
