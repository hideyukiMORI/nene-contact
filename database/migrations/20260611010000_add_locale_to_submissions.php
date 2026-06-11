<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddLocaleToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Locale the visitor used when submitting (one of the form's locales). Non-PII
        // reception meta shown in the inquiry-detail rail (受信メタ). Null for service ingest
        // or when the embed sends no/invalid locale.
        $this->table('submissions')
            ->addColumn('locale', 'string', ['limit' => 16, 'null' => true, 'default' => null, 'after' => 'source_url'])
            ->update();
    }
}
