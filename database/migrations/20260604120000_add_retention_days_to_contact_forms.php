<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRetentionDaysToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Per-form retention (charter §5). NULL means "use the documented default"
        // (NeneContact\Submission\RetentionPolicy::DEFAULT_RETENTION_DAYS) — never
        // indefinite retention by accident.
        $this->table('contact_forms')
            ->addColumn('retention_days', 'integer', ['null' => true, 'default' => null, 'after' => 'consent_label_json'])
            ->update();
    }
}
