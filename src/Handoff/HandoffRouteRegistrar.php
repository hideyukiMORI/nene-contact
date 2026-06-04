<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Admin handoff routes. Both live under `/admin/submissions/...`, so the
 * {@see \NeneContact\Auth\CapabilityResolver} gates the POST as ManageSubmissions and the
 * GET as ViewSubmissions — no extra capability wiring needed.
 */
final readonly class HandoffRouteRegistrar
{
    public function __construct(
        private ListSubmissionHandoffsHandler $listHandler,
        private HandoffToDealHandler $dealHandler,
        private HandoffAttachmentToVaultHandler $vaultHandler,
        private HandoffToInvoiceHandler $invoiceHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $deal = $this->dealHandler;
        $vault = $this->vaultHandler;
        $invoice = $this->invoiceHandler;

        $router->get('/admin/submissions/{id}/handoffs', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/admin/submissions/{id}/handoffs/deal', static fn (ServerRequestInterface $r) => $deal->handle($r));
        $router->post('/admin/submissions/{id}/handoffs/vault/{attachmentId}', static fn (ServerRequestInterface $r) => $vault->handle($r));
        $router->post('/admin/submissions/{id}/handoffs/invoice', static fn (ServerRequestInterface $r) => $invoice->handle($r));
    }
}
