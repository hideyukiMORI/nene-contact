<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAutoreplyToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Per-form sender auto-reply config (#360): JSON map { enabled, subject{ja,en}, body{ja,en} }.
        // Nullable — legacy rows and an omitted payload resolve to "disabled" at read time.
        $this->table('contact_forms')
            ->addColumn('autoreply_json', 'text', ['null' => true, 'default' => null, 'after' => 'appearance_json'])
            ->update();
    }
}
