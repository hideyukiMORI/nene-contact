<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateServiceTokensTable extends AbstractMigration
{
    public function change(): void
    {
        // Registry for issued service tokens (embed 案1 / records native embed, #386). A service
        // token is a stateless HMAC JWT and is NEVER stored — this row holds only the `jti`
        // (revocation key) plus non-secret metadata. Org-scoped registry reads (ADR 0006); the
        // request org for a `/api/*` service call comes from the token's `org` claim, not this row.
        // Revocation is soft (`revoked_at`) and mirrors NeNe Invoice's service_tokens (ADR 0016).
        $this->table('service_tokens')
            ->addColumn('organization_id', 'integer', ['null' => false])
            ->addColumn('jti', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('subject', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('label', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('scopes', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('created_by', 'integer', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('expires_at', 'datetime', ['null' => false])
            ->addColumn('revoked_at', 'datetime', ['null' => true, 'default' => null])
            ->addIndex(['jti'], ['unique' => true, 'name' => 'uniq_service_tokens_jti'])
            ->addIndex(['organization_id'])
            ->create();
    }
}
