<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateContactFormsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('contact_forms')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('public_form_key', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('default_locale', 'string', ['limit' => 5, 'null' => false, 'default' => 'ja'])
            ->addColumn('locales_json', 'text', ['null' => false])
            ->addColumn('allowed_origins_json', 'text', ['null' => false])
            ->addColumn('status', 'string', ['limit' => 32, 'null' => false, 'default' => 'active'])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['public_form_key'], ['unique' => true])
            ->addIndex(['organization_id'])
            ->create();
    }
}
