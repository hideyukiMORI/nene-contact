<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSubmitExperienceToContactForms extends AbstractMigration
{
    public function change(): void
    {
        // Submit-experience settings (builder フォーム設定「送信ボタン・送信後」): the submit button
        // label + what happens after a successful submit (a completion message or a redirect).
        // Labels/messages are per-locale (ADR 0011), stored as JSON; null falls back to defaults.
        $this->table('contact_forms')
            ->addColumn('submit_label_json', 'text', ['null' => true, 'default' => null, 'after' => 'appearance_json'])
            ->addColumn('post_submit', 'string', ['limit' => 16, 'null' => false, 'default' => 'message', 'after' => 'submit_label_json'])
            ->addColumn('success_message_json', 'text', ['null' => true, 'default' => null, 'after' => 'post_submit'])
            ->addColumn('redirect_url', 'string', ['limit' => 2048, 'null' => true, 'default' => null, 'after' => 'success_message_json'])
            ->update();
    }
}
