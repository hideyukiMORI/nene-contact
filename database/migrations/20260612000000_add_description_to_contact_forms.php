<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDescriptionToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Optional form description shown above the fields in the embed (builder spec v1.0).
        $this->table('contact_forms')
            ->addColumn('description', 'text', ['null' => true, 'default' => null, 'after' => 'name'])
            ->update();
    }
}
