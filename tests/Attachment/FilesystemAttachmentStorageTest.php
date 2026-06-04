<?php

declare(strict_types=1);

namespace NeneContact\Tests\Attachment;

use NeneContact\Attachment\FilesystemAttachmentStorage;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class FilesystemAttachmentStorageTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir() . '/nene-attach-' . bin2hex(random_bytes(6));
    }

    protected function tearDown(): void
    {
        if (is_dir($this->dir)) {
            $it = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($this->dir, \FilesystemIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST,
            );
            foreach ($it as $f) {
                $f->isDir() ? rmdir($f->getPathname()) : unlink($f->getPathname());
            }
            rmdir($this->dir);
        }
    }

    public function test_put_get_erase_round_trip(): void
    {
        $storage = new FilesystemAttachmentStorage($this->dir);

        $key = $storage->put(7, 'hello bytes');
        self::assertMatchesRegularExpression('#^7/[0-9a-f]{32}$#', $key);
        self::assertSame('hello bytes', $storage->get($key));

        $storage->erase($key);
        self::assertNull($storage->get($key));
    }

    public function test_rejects_traversal_key(): void
    {
        $this->expectException(RuntimeException::class);
        (new FilesystemAttachmentStorage($this->dir))->get('../../etc/passwd');
    }
}
