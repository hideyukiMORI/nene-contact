<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Per-tenant email sender display name (email-wording wave a). Nullable — an empty value falls
 * back to the organization name, so existing rows keep their current behavior.
 */
final class AddSenderDisplayNameToOrganizations extends AbstractMigration
{
    public function change(): void
    {
        $this->table('organizations')
            ->addColumn('sender_display_name', 'string', ['limit' => 100, 'null' => true, 'default' => null, 'after' => 'name'])
            ->update();
    }
}
