<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddConfigToFormFields extends AbstractMigration
{
    public function change(): void
    {
        // Declarative per-field display config (choice-field management UI, builder spec v2.0):
        // style / defaults / 「その他」 / 選択数ルール / 画像選択. JSON only — no operator
        // JavaScript (ADR 0010). Null for non-choice fields.
        $this->table('form_fields')
            ->addColumn('config_json', 'text', ['null' => true, 'default' => null, 'after' => 'options_json'])
            ->update();
    }
}
