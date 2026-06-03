<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSubmissionsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('submissions')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('contact_form_id', 'integer', ['null' => false])
            ->addColumn('field_values_json', 'text', ['null' => false])
            ->addColumn('status', 'string', ['limit' => 32, 'null' => false, 'default' => 'open'])
            ->addColumn('ip', 'string', ['limit' => 64, 'null' => true, 'default' => null])
            ->addColumn('user_agent', 'string', ['limit' => 512, 'null' => true, 'default' => null])
            ->addColumn('submitted_at', 'datetime', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['contact_form_id'])
            ->addIndex(['status'])
            ->create();
    }
}
