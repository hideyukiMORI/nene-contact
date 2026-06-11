<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSourceUrlToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Page the embed widget was on when the form was submitted (referer). Non-PII
        // operational reception metadata shown by default in the inbox (ADR 0018). Null for
        // service ingest (concierge/import/api) — the visitor reached a sibling, not Contact.
        $this->table('submissions')
            ->addColumn('source_url', 'string', ['limit' => 1024, 'null' => true, 'default' => null, 'after' => 'user_agent'])
            ->update();
    }
}
