<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddConsentToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Immutable consent evidence (charter §3): the label copy in force when the
        // visitor consented, plus the timestamp. Written once at submit, never updated.
        $this->table('submissions')
            ->addColumn('consent_label_json', 'text', ['null' => true, 'default' => null, 'after' => 'field_values_json'])
            ->addColumn('consent_given_at', 'datetime', ['null' => true, 'default' => null, 'after' => 'consent_label_json'])
            ->update();
    }
}
