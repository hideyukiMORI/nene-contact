<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAuditEventsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('audit_events')
            ->addColumn('actor_user_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('organization_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('action', 'string', ['limit' => 100, 'null' => false])
            ->addColumn('entity_type', 'string', ['limit' => 100, 'null' => false])
            ->addColumn('entity_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('before_json', 'text', ['null' => true, 'default' => null])
            ->addColumn('after_json', 'text', ['null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['entity_type', 'entity_id'])
            ->create();
    }
}
