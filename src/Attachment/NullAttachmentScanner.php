<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

/**
 * Default no-op scanner: records `skipped`. A real scanner (ClamAV, etc.) replaces this
 * binding in Phase 3+ without touching the upload flow.
 */
final readonly class NullAttachmentScanner implements AttachmentScannerInterface
{
    public function scan(string $bytes): string
    {
        return 'skipped';
    }
}
