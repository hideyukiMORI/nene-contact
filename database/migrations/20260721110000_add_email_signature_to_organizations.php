<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Per-tenant email signature (email-wording wave b). Nullable text appended to the body of
 * outgoing notification + auto-reply emails; empty means no signature.
 */
final class AddEmailSignatureToOrganizations extends AbstractMigration
{
    public function change(): void
    {
        $this->table('organizations')
            ->addColumn('email_signature', 'text', ['null' => true, 'default' => null, 'after' => 'sender_display_name'])
            ->update();
    }
}
