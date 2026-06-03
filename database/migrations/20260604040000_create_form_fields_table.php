<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateFormFieldsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('form_fields')
            ->addColumn('contact_form_id', 'integer', ['null' => false])
            ->addColumn('field_type', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 100, 'null' => false])
            ->addColumn('label_json', 'text', ['null' => false])
            ->addColumn('required', 'boolean', ['null' => false, 'default' => false])
            ->addColumn('options_json', 'text', ['null' => true, 'default' => null])
            ->addColumn('sort_order', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['contact_form_id'])
            ->create();
    }
}
