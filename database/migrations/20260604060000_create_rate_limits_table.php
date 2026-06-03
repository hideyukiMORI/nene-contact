<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateRateLimitsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('rate_limits')
            ->addColumn('rl_key', 'string', ['limit' => 191, 'null' => false])
            ->addColumn('hit_count', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('reset_at', 'integer', ['null' => false, 'default' => 0])
            ->addIndex(['rl_key'], ['unique' => true])
            ->create();
    }
}
