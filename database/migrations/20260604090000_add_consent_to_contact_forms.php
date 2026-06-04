<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddConsentToContactForms extends AbstractMigration
{
    public function change(): void
    {
        $this->table('contact_forms')
            ->addColumn('consent_required', 'boolean', ['null' => false, 'default' => false, 'after' => 'status'])
            ->addColumn('consent_label_json', 'text', ['null' => true, 'default' => null, 'after' => 'consent_required'])
            ->update();
    }
}
