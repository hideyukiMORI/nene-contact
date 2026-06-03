<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class GetContactFormByIdUseCase implements GetContactFormByIdUseCaseInterface
{
    public function __construct(
        private ContactFormRepositoryInterface $forms,
    ) {
    }

    public function execute(int $id): ContactForm
    {
        $form = $this->forms->findById($id);

        if ($form === null) {
            throw new ContactFormNotFoundException($id);
        }

        return $form;
    }
}
