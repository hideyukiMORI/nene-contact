<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateNotificationChannelsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('notification_channels')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('contact_form_id', 'integer', ['null' => false])
            ->addColumn('channel_type', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('config_json', 'text', ['null' => false])
            ->addColumn('is_enabled', 'boolean', ['null' => false, 'default' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['contact_form_id'])
            ->create();
    }
}
