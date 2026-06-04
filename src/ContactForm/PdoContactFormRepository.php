<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * Organization-scoped persistence for the ContactForm aggregate (form + fields).
 * Every query is filtered by the resolved organization_id (ADR 0006); the aggregate
 * write runs in a transaction (ADR backend-standards).
 */
final readonly class PdoContactFormRepository implements ContactFormRepositoryInterface
{
    private const FORM_COLUMNS = 'id, organization_id, name, public_form_key, default_locale, locales_json, allowed_origins_json, status, consent_required, consent_label_json, created_at, updated_at';
    private const FIELD_COLUMNS = 'id, contact_form_id, field_type, name, label_json, required, options_json, sort_order';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private DatabaseTransactionManagerInterface $tx,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function save(ContactForm $form): int
    {
        $organizationId = $this->orgId->get();
        $now = date('Y-m-d H:i:s');

        return $this->tx->transactional(static function (DatabaseQueryExecutorInterface $q) use ($form, $organizationId, $now): int {
            $q->execute(
                'INSERT INTO contact_forms (organization_id, name, public_form_key, default_locale, locales_json, allowed_origins_json, status, consent_required, consent_label_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $organizationId,
                    $form->name,
                    $form->publicFormKey,
                    $form->defaultLocale,
                    self::encode($form->locales),
                    self::encode($form->allowedOrigins),
                    $form->status,
                    $form->consentRequired ? 1 : 0,
                    $form->consentLabel !== null ? self::encode($form->consentLabel) : null,
                    $now,
                    $now,
                ],
            );

            $formId = $q->lastInsertId();

            foreach ($form->fields as $field) {
                $q->execute(
                    'INSERT INTO form_fields (contact_form_id, field_type, name, label_json, required, options_json, sort_order, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $formId,
                        $field->fieldType,
                        $field->name,
                        self::encode($field->label),
                        $field->required ? 1 : 0,
                        $field->options !== null ? self::encode($field->options) : null,
                        $field->sortOrder,
                        $now,
                        $now,
                    ],
                );
            }

            return $formId;
        });
    }

    public function findById(int $id): ?ContactForm
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE id = ? AND organization_id = ?',
            [$id, $this->orgId->get()],
        );

        return $row !== null ? $this->mapForm($row, $this->loadFields($id)) : null;
    }

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE public_form_key = ? AND organization_id = ?',
            [$publicFormKey, $this->orgId->get()],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapForm($row, $this->loadFields((int) $row['id']));
    }

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE organization_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
            [$this->orgId->get(), $limit, $offset],
        );

        return array_map(fn (array $row): ContactForm => $this->mapForm($row, $this->loadFields((int) $row['id'])), $rows);
    }

    public function count(): int
    {
        $row = $this->query->fetchOne('SELECT COUNT(*) AS cnt FROM contact_forms WHERE organization_id = ?', [$this->orgId->get()]);

        return $row !== null ? (int) $row['cnt'] : 0;
    }

    /** @return list<FormField> */
    private function loadFields(int $formId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::FIELD_COLUMNS . ' FROM form_fields WHERE contact_form_id = ? ORDER BY sort_order ASC, id ASC',
            [$formId],
        );

        return array_map(static function (array $row): FormField {
            /** @var array<string, string> $label */
            $label = self::decode(isset($row['label_json']) ? (string) $row['label_json'] : null) ?? [];
            /** @var list<array<string, mixed>>|null $options */
            $options = isset($row['options_json'])
                ? self::decode((string) $row['options_json'])
                : null;

            return new FormField(
                fieldType: (string) $row['field_type'],
                name: (string) $row['name'],
                label: $label,
                required: (bool) $row['required'],
                sortOrder: (int) $row['sort_order'],
                options: $options,
                id: (int) $row['id'],
                contactFormId: (int) $row['contact_form_id'],
            );
        }, $rows);
    }

    /**
     * @param array<string, mixed> $row
     * @param list<FormField> $fields
     */
    private function mapForm(array $row, array $fields): ContactForm
    {
        /** @var list<string> $locales */
        $locales = self::decode(isset($row['locales_json']) ? (string) $row['locales_json'] : null) ?? [];
        /** @var list<string> $allowedOrigins */
        $allowedOrigins = self::decode(isset($row['allowed_origins_json']) ? (string) $row['allowed_origins_json'] : null) ?? [];
        /** @var array<string, string>|null $consentLabel */
        $consentLabel = self::decode(isset($row['consent_label_json']) ? (string) $row['consent_label_json'] : null);

        return new ContactForm(
            organizationId: (int) $row['organization_id'],
            name: (string) $row['name'],
            publicFormKey: (string) $row['public_form_key'],
            defaultLocale: (string) $row['default_locale'],
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            status: (string) $row['status'],
            consentRequired: (bool) $row['consent_required'],
            consentLabel: $consentLabel,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }

    /** @param array<int|string, mixed> $value */
    private static function encode(array $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @return array<int|string, mixed>|null
     */
    private static function decode(?string $json): ?array
    {
        if ($json === null || $json === '') {
            return null;
        }

        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);

        return is_array($decoded) ? $decoded : null;
    }
}
