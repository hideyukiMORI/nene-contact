<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

/**
 * Virus/malware scan hook for uploaded attachments (charter §2; full scanning is Phase 3+).
 * Returns a scan status stored on the attachment (e.g. `clean`, `skipped`, `infected`).
 */
interface AttachmentScannerInterface
{
    public function scan(string $bytes): string;
}
