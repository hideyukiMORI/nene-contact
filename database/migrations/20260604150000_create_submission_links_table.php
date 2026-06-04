<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSubmissionLinksTable extends AbstractMigration
{
    public function change(): void
    {
        // Sibling handoff records (M5, DO D11/D12). One row per (submission, target):
        // a submission may be handed to Deal and/or Vault independently, each with its own
        // status and retry history. Only the matching sibling-pointer column is populated.
        // Append/update only — no DELETE path (ADR 0016); failures keep the row as `failed`.
        $this->table('submission_links')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('submission_id', 'integer', ['null' => false])
            ->addColumn('target', 'string', ['limit' => 16, 'null' => false]) // deal | vault | invoice
            ->addColumn('deal_opportunity_id', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('vault_document_id', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('invoice_client_id', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('handoff_status', 'string', ['limit' => 16, 'null' => false, 'default' => 'pending']) // pending | succeeded | failed
            ->addColumn('last_error', 'string', ['limit' => 1024, 'null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['submission_id'])
            ->addIndex(['submission_id', 'target'], ['unique' => true])
            ->create();
    }
}
