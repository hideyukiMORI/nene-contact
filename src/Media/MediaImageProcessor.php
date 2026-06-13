<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

/**
 * Validates and **re-encodes** an uploaded image through GD. Re-encoding is the security control:
 * we never serve the operator's raw bytes (which can carry EXIF/GPS metadata or a polyglot
 * payload) — we decode the pixels and emit a clean image. Oversized images are downscaled.
 *
 * WebP is intentionally not emitted (GD build lacks imagewebp here); PNG preserves alpha (logos),
 * everything else becomes JPEG.
 */
final readonly class MediaImageProcessor
{
    private const MAX_BYTES = 5 * 1024 * 1024;
    private const MAX_DIMENSION = 1600;
    private const JPEG_QUALITY = 82;

    public function process(string $bytes): ProcessedImage
    {
        if ($bytes === '') {
            throw self::error('The file is empty.');
        }
        if (strlen($bytes) > self::MAX_BYTES) {
            throw self::error('The image must be 5 MB or smaller.');
        }

        $info = @getimagesizefromstring($bytes);
        if ($info === false) {
            throw self::error('The file is not a supported image (JPEG, PNG or GIF).');
        }
        $type = $info[2];
        if (!in_array($type, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF], true)) {
            throw self::error('Only JPEG, PNG or GIF images are supported.');
        }

        $image = @imagecreatefromstring($bytes);
        if ($image === false) {
            throw self::error('The image could not be read.');
        }

        $srcW = imagesx($image);
        $srcH = imagesy($image);
        [$dstW, $dstH] = self::fitWithin($srcW, $srcH, self::MAX_DIMENSION);

        $hasAlpha = $type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF;

        if ($dstW !== $srcW || $dstH !== $srcH) {
            assert($dstW >= 1 && $dstH >= 1);
            $resized = imagecreatetruecolor($dstW, $dstH);
            if ($hasAlpha) {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);
            imagedestroy($image);
            $image = $resized;
        } elseif ($hasAlpha) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        ob_start();
        if ($hasAlpha) {
            imagepng($image, null, 6);
            $mime = 'image/png';
            $ext = 'png';
        } else {
            imagejpeg($image, null, self::JPEG_QUALITY);
            $mime = 'image/jpeg';
            $ext = 'jpg';
        }
        $out = (string) ob_get_clean();
        imagedestroy($image);

        return new ProcessedImage($out, $mime, $ext, $dstW, $dstH);
    }

    /** @return array{0: int, 1: int} */
    private static function fitWithin(int $w, int $h, int $max): array
    {
        if ($w <= $max && $h <= $max) {
            return [$w, $h];
        }
        $scale = min($max / $w, $max / $h);

        return [max(1, (int) round($w * $scale)), max(1, (int) round($h * $scale))];
    }

    private static function error(string $message): ValidationException
    {
        return new ValidationException([new ValidationError('file', $message, 'invalid')]);
    }
}
