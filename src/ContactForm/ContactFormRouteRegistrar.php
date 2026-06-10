<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ContactFormRouteRegistrar
{
    public function __construct(
        private ListContactFormsHandler $listHandler,
        private GetContactFormByIdHandler $getHandler,
        private CreateContactFormHandler $createHandler,
        private UpdateContactFormHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $get = $this->getHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;

        $router->get('/admin/contact-forms', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/contact-forms/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->post('/admin/contact-forms', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->put('/admin/contact-forms/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
    }
}
