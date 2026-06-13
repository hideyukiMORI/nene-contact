<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateMediaAssetsTable extends AbstractMigration
{
    public function change(): void
    {
        // Per-org media library (operator-uploaded brand assets, e.g. HERO images). Not visitor
        // PII — org-owned marketing assets — so APPI retention/erase rules don't apply; deletion
        // is soft (ADR 0016). Bytes live on the public filesystem; only metadata is stored here.
        $this->table('media_assets')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('storage_key', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('public_path', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('mime', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('width', 'integer', ['null' => true])
            ->addColumn('height', 'integer', ['null' => true])
            ->addColumn('byte_size', 'integer', ['null' => false])
            ->addColumn('original_name', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('created_by', 'integer', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null])
            ->addIndex(['organization_id', 'deleted_at'])
            ->create();
    }
}
