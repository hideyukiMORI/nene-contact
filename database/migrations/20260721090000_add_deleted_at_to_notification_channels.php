<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds a soft-delete tombstone to notification_channels. ADR 0016 forbids physical row
 * deletion (notification_channels is named there as a soft-delete record); removing a
 * misconfigured channel stamps deleted_at and it drops out of every read and dispatch.
 */
final class AddDeletedAtToNotificationChannels extends AbstractMigration
{
    public function change(): void
    {
        $this->table('notification_channels')
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'updated_at'])
            ->addIndex(['deleted_at'])
            ->update();
    }
}
