<?php

declare(strict_types=1);

namespace NeneContact\Tests\Media;

use Nene2\Http\RequestScopedHolder;
use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Media\DeleteMediaUseCase;
use NeneContact\Media\MediaAsset;
use NeneContact\Media\MediaImageProcessor;
use NeneContact\Media\MediaNotFoundException;
use NeneContact\Media\UploadMediaUseCase;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class MediaUseCaseTest extends TestCase
{
    /** @return RequestScopedHolder<int> */
    private function orgHolder(int $orgId): RequestScopedHolder
    {
        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set($orgId);

        return $holder;
    }

    private function pngBytes(): string
    {
        $img = imagecreatetruecolor(8, 8);
        $color = imagecolorallocate($img, 10, 20, 30);
        assert($color !== false);
        imagefilledrectangle($img, 0, 0, 7, 7, $color);
        ob_start();
        imagepng($img);
        $bytes = (string) ob_get_clean();
        imagedestroy($img);

        return $bytes;
    }

    public function test_upload_reencodes_stores_persists_and_audits(): void
    {
        $repo = new InMemoryMediaAssetRepository();
        $storage = new FakeMediaStorage();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new UploadMediaUseCase(
            new MediaImageProcessor(),
            $storage,
            $repo,
            new AuditRecorder($audit),
            $this->orgHolder(7),
        );

        $asset = $useCase->execute(5, $this->pngBytes(), 'logo.png');

        self::assertSame(7, $asset->organizationId);
        self::assertSame('image/png', $asset->mime);
        self::assertSame('logo.png', $asset->originalName);
        self::assertStringStartsWith('/media/7/', $asset->publicPath);
        self::assertCount(1, $storage->puts);

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('media.uploaded', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        // The audit snapshot carries the public url, never the storage key or bytes.
        self::assertSame($asset->publicPath, $event->after['url'] ?? null);
        self::assertArrayNotHasKey('storage_key', (array) $event->after);
    }

    public function test_upload_rejects_a_non_image(): void
    {
        $useCase = new UploadMediaUseCase(
            new MediaImageProcessor(),
            new FakeMediaStorage(),
            new InMemoryMediaAssetRepository(),
            new AuditRecorder(new InMemoryAuditEventRepository()),
            $this->orgHolder(7),
        );

        $this->expectException(ValidationException::class);
        $useCase->execute(5, 'this is not an image', 'evil.exe');
    }

    public function test_delete_soft_deletes_erases_and_audits(): void
    {
        $repo = new InMemoryMediaAssetRepository();
        $repo->seed(new MediaAsset(
            organizationId: 7,
            storageKey: '7/abc',
            publicPath: '/media/7/abc.png',
            mime: 'image/png',
            byteSize: 100,
            id: 9,
        ));
        $storage = new FakeMediaStorage();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new DeleteMediaUseCase($repo, $storage, new AuditRecorder($audit), $this->orgHolder(7));

        $useCase->execute(5, 9);

        self::assertNull($repo->findById(9));
        self::assertSame(['7/abc'], $storage->erased);
        self::assertCount(1, $audit->events);
        self::assertSame('media.deleted', $audit->events[0]->action);
    }

    public function test_delete_rejects_cross_tenant_target_as_not_found(): void
    {
        $repo = new InMemoryMediaAssetRepository();
        $repo->seed(new MediaAsset(
            organizationId: 99,
            storageKey: '99/abc',
            publicPath: '/media/99/abc.png',
            mime: 'image/png',
            byteSize: 100,
            id: 9,
        ));
        $useCase = new DeleteMediaUseCase($repo, new FakeMediaStorage(), new AuditRecorder(new InMemoryAuditEventRepository()), $this->orgHolder(7));

        $this->expectException(MediaNotFoundException::class);
        $useCase->execute(5, 9);
    }
}
