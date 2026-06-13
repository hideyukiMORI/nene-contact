<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddAppearanceToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Per-form embed appearance (builder spec — appearance v1): JSON map of display mode,
        // theme colours, radius, font and header/hero flags. Nullable — legacy rows and an
        // omitted payload resolve to the widget's default theme at read time.
        $this->table('contact_forms')
            ->addColumn('appearance_json', 'text', ['null' => true, 'default' => null, 'after' => 'retention_days'])
            ->update();
    }
}
