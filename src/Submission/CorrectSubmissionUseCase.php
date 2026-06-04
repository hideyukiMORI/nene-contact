<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use LogicException;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormNotFoundException;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\FieldType;

/**
 * Amends a submission's stored field values to honor a data-subject correction request
 * (charter §4). Only fields declared on the form may be corrected (purpose limitation,
 * §2). The change is captured in the audit trail as `submission.corrected` with the list
 * of changed field names — never the raw values (§10).
 */
final readonly class CorrectSubmissionUseCase implements CorrectSubmissionUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private ContactFormRepositoryInterface $forms,
        private AuditRecorderInterface $audit,
    ) {
    }

    /**
     * @param array<string, mixed> $values
     */
    public function execute(?int $actorUserId, int $id, array $values): Submission
    {
        $before = $this->submissions->findById($id);

        if ($before === null) {
            throw new SubmissionNotFoundException($id);
        }

        $form = $this->forms->findById($before->contactFormId);

        if ($form === null) {
            throw new ContactFormNotFoundException($before->contactFormId);
        }

        // Purpose limitation: only declared, non-honeypot fields are correctable.
        $declared = [];
        foreach ($form->fields as $field) {
            if ($field->fieldType !== FieldType::Honeypot->value) {
                $declared[$field->name] = true;
            }
        }

        $errors = [];
        foreach (array_keys($values) as $name) {
            if (!isset($declared[$name])) {
                $errors[] = new ValidationError((string) $name, 'Unknown field for this form.', 'invalid');
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $corrected = array_merge($before->fieldValues, $values);

        $changedFields = [];
        foreach ($values as $name => $value) {
            if (!array_key_exists($name, $before->fieldValues) || $before->fieldValues[$name] !== $value) {
                $changedFields[] = (string) $name;
            }
        }

        $this->submissions->updateFieldValues($id, $corrected);

        $after = $this->submissions->findById($id);

        if ($after === null) {
            throw new LogicException('Submission disappeared immediately after correction.');
        }

        // Redacted: field keys + which fields changed, never the corrected values (§10).
        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'submission.corrected',
            'submission',
            $id,
            SubmissionResponse::toAuditSnapshot($before),
            SubmissionResponse::toAuditSnapshot($after) + ['changed_fields' => $changedFields],
        );

        return $after;
    }
}
