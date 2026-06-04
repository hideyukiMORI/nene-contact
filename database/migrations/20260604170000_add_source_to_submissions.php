<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSourceToSubmissions extends AbstractMigration
{
    public function change(): void
    {
        // Where a submission came from (M6 ingest). Public/embed submits default to `form`;
        // service ingest sets `concierge` / `import` / `api` so operators can tell chat-origin
        // inquiries apart in the one shared inbox (concierge-ingest-contract).
        $this->table('submissions')
            ->addColumn('source', 'string', ['limit' => 32, 'null' => false, 'default' => 'form', 'after' => 'status'])
            ->addIndex(['source'])
            ->update();
    }
}
