<?php

declare(strict_types=1);

namespace NeneContact\ServiceApi;

/**
 * Scopes a service token (machine principal) may carry (embed 案1, #388). These are the
 * service-to-service equivalent of human capabilities — a records connect token is scoped to
 * exactly the operation it needs.
 *
 * Only the org-level ingest scope exists today. A form-limited variant (`ingest:form:{id}`) is
 * a deliberate future extension (contract sketch §1-3, "form 限定は任意") and is intentionally
 * not modelled here yet.
 */
enum ServiceScope: string
{
    case IngestSubmissions = 'ingest:submissions';
}
