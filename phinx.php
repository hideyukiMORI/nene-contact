<?php

declare(strict_types=1);

use Nene2\Config\ConfigLoader;

require_once __DIR__ . '/vendor/autoload.php';

$database = (new ConfigLoader(__DIR__))->load()->database;

return [
    'paths' => [
        'migrations' => 'database/migrations',
        'seeds' => 'database/seeds',
    ],
    'environments' => [
        'default_environment' => $database->environment,
        $database->environment => $database->usesUrl()
            ? ['url' => $database->url]
            : [
                'adapter' => $database->adapter,
                'host' => $database->host,
                'name' => $database->name,
                'user' => $database->user,
                'pass' => $database->password,
                'port' => $database->port,
                'charset' => $database->charset,
                // Use the SQLite filename verbatim (the NENE2 PDO factory opens
                // `sqlite:<name>`); without this phinx appends a `.sqlite3` suffix.
                'suffix' => '',
            ],
    ],
    'version_order' => 'creation',
];
