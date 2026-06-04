<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSubmissionAttachmentsTable extends AbstractMigration
{
    public function change(): void
    {
        // File attachments (D12). Bytes live on the filesystem (storage_key); only metadata
        // is stored here. submission_id is null until the upload is linked on submit.
        // deleted_at / purged_at support soft-delete and retention erase-in-place (ADR 0016).
        $this->table('submission_attachments')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('contact_form_id', 'integer', ['null' => false])
            ->addColumn('submission_id', 'integer', ['null' => true, 'default' => null])
            ->addColumn('field_name', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('original_filename', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('content_type', 'string', ['limit' => 191, 'null' => false])
            ->addColumn('size_bytes', 'integer', ['null' => false])
            ->addColumn('storage_key', 'string', ['limit' => 255, 'null' => true, 'default' => null])
            ->addColumn('scan_status', 'string', ['limit' => 32, 'null' => false, 'default' => 'skipped'])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true, 'default' => null])
            ->addColumn('purged_at', 'datetime', ['null' => true, 'default' => null])
            ->addIndex(['organization_id'])
            ->addIndex(['contact_form_id'])
            ->addIndex(['submission_id'])
            ->create();
    }
}
