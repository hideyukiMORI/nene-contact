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
    private const FORM_COLUMNS = 'id, organization_id, name, description, public_form_key, default_locale, locales_json, allowed_origins_json, status, consent_required, consent_label_json, retention_days, appearance_json, submit_label_json, post_submit, success_message_json, redirect_url, created_at, updated_at';
    private const FIELD_COLUMNS = 'id, contact_form_id, field_type, name, placeholder, description, label_json, required, options_json, config_json, sort_order';

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
                'INSERT INTO contact_forms (organization_id, name, description, public_form_key, default_locale, locales_json, allowed_origins_json, status, consent_required, consent_label_json, retention_days, appearance_json, submit_label_json, post_submit, success_message_json, redirect_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $organizationId,
                    $form->name,
                    $form->description,
                    $form->publicFormKey,
                    $form->defaultLocale,
                    self::encode($form->locales),
                    self::encode($form->allowedOrigins),
                    $form->status,
                    $form->consentRequired ? 1 : 0,
                    $form->consentLabel !== null ? self::encode($form->consentLabel) : null,
                    $form->retentionDays,
                    $form->appearance !== null ? self::encode($form->appearance->toArray()) : null,
                    $form->submitLabel !== null ? self::encode($form->submitLabel) : null,
                    $form->postSubmit,
                    $form->successMessage !== null ? self::encode($form->successMessage) : null,
                    $form->redirectUrl,
                    $now,
                    $now,
                ],
            );

            $formId = $q->lastInsertId();

            foreach ($form->fields as $field) {
                $q->execute(
                    'INSERT INTO form_fields (contact_form_id, field_type, name, placeholder, description, label_json, required, options_json, config_json, sort_order, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $formId,
                        $field->fieldType,
                        $field->name,
                        $field->placeholder,
                        $field->description,
                        self::encode($field->label),
                        $field->required ? 1 : 0,
                        $field->options !== null ? self::encode($field->options) : null,
                        $field->config !== null ? self::encode($field->config) : null,
                        $field->sortOrder,
                        $now,
                        $now,
                    ],
                );
            }

            return $formId;
        });
    }

    public function update(ContactForm $form): void
    {
        $organizationId = $this->orgId->get();
        $now = date('Y-m-d H:i:s');
        $formId = (int) $form->id;

        $this->tx->transactional(static function (DatabaseQueryExecutorInterface $q) use ($form, $organizationId, $formId, $now): void {
            // Editable columns only; public_form_key / status / organization_id / created_at
            // are preserved. Org-scoped so a cross-tenant id updates nothing.
            $q->execute(
                'UPDATE contact_forms
                 SET name = ?, description = ?, default_locale = ?, locales_json = ?, allowed_origins_json = ?, consent_required = ?, consent_label_json = ?, retention_days = ?, appearance_json = ?, submit_label_json = ?, post_submit = ?, success_message_json = ?, redirect_url = ?, updated_at = ?
                 WHERE id = ? AND organization_id = ?',
                [
                    $form->name,
                    $form->description,
                    $form->defaultLocale,
                    self::encode($form->locales),
                    self::encode($form->allowedOrigins),
                    $form->consentRequired ? 1 : 0,
                    $form->consentLabel !== null ? self::encode($form->consentLabel) : null,
                    $form->retentionDays,
                    $form->appearance !== null ? self::encode($form->appearance->toArray()) : null,
                    $form->submitLabel !== null ? self::encode($form->submitLabel) : null,
                    $form->postSubmit,
                    $form->successMessage !== null ? self::encode($form->successMessage) : null,
                    $form->redirectUrl,
                    $now,
                    $formId,
                    $organizationId,
                ],
            );

            // Fields are a fully-owned child collection: retire the live ones (soft-delete,
            // ADR 0016 — never a physical DELETE) and re-insert the new set below.
            $q->execute(
                'UPDATE form_fields SET deleted_at = ?, updated_at = ? WHERE contact_form_id = ? AND deleted_at IS NULL',
                [$now, $now, $formId],
            );

            foreach ($form->fields as $field) {
                $q->execute(
                    'INSERT INTO form_fields (contact_form_id, field_type, name, placeholder, description, label_json, required, options_json, config_json, sort_order, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $formId,
                        $field->fieldType,
                        $field->name,
                        $field->placeholder,
                        $field->description,
                        self::encode($field->label),
                        $field->required ? 1 : 0,
                        $field->options !== null ? self::encode($field->options) : null,
                        $field->config !== null ? self::encode($field->config) : null,
                        $field->sortOrder,
                        $now,
                        $now,
                    ],
                );
            }
        });
    }

    public function softDelete(int $id): void
    {
        $now = date('Y-m-d H:i:s');

        // Org-scoped soft delete — never a physical DELETE (ADR 0016). Submissions are kept.
        $this->query->execute(
            'UPDATE contact_forms SET deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$now, $now, $id, $this->orgId->get()],
        );
    }

    public function findById(int $id): ?ContactForm
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$id, $this->orgId->get()],
        );

        return $row !== null ? $this->mapForm($row, $this->loadFields($id)) : null;
    }

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE public_form_key = ? AND organization_id = ? AND deleted_at IS NULL',
            [$publicFormKey, $this->orgId->get()],
        );

        if ($row === null) {
            return null;
        }

        return $this->mapForm($row, $this->loadFields((int) $row['id']));
    }

    public function publicFormKeyExists(string $publicFormKey): bool
    {
        // Global (no org scope, includes soft-deleted): the public URL is shared across tenants
        // and a retired form's key must not be silently reused.
        $row = $this->query->fetchOne(
            'SELECT 1 AS hit FROM contact_forms WHERE public_form_key = ? LIMIT 1',
            [$publicFormKey],
        );

        return $row !== null;
    }

    /** @return list<ContactForm> */
    public function findAll(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::FORM_COLUMNS . ' FROM contact_forms WHERE organization_id = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?',
            [$this->orgId->get(), $limit, $offset],
        );

        return array_map(fn (array $row): ContactForm => $this->mapForm($row, $this->loadFields((int) $row['id'])), $rows);
    }

    public function count(): int
    {
        $row = $this->query->fetchOne('SELECT COUNT(*) AS cnt FROM contact_forms WHERE organization_id = ? AND deleted_at IS NULL', [$this->orgId->get()]);

        return $row !== null ? (int) $row['cnt'] : 0;
    }

    /** @return list<FormField> */
    private function loadFields(int $formId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::FIELD_COLUMNS . ' FROM form_fields WHERE contact_form_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC',
            [$formId],
        );

        return array_map(static function (array $row): FormField {
            /** @var array<string, string> $label */
            $label = self::decode(isset($row['label_json']) ? (string) $row['label_json'] : null) ?? [];
            /** @var list<array<string, mixed>>|null $options */
            $options = isset($row['options_json'])
                ? self::decode((string) $row['options_json'])
                : null;
            /** @var array<string, mixed>|null $config */
            $config = isset($row['config_json'])
                ? self::decode((string) $row['config_json'])
                : null;

            return new FormField(
                fieldType: (string) $row['field_type'],
                name: (string) $row['name'],
                label: $label,
                required: (bool) $row['required'],
                sortOrder: (int) $row['sort_order'],
                options: $options,
                placeholder: isset($row['placeholder']) ? (string) $row['placeholder'] : null,
                id: (int) $row['id'],
                contactFormId: (int) $row['contact_form_id'],
                config: $config,
                description: isset($row['description']) ? (string) $row['description'] : null,
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
        /** @var array<string, mixed>|null $appearance */
        $appearance = self::decode(isset($row['appearance_json']) ? (string) $row['appearance_json'] : null);
        /** @var array<string, string>|null $submitLabel */
        $submitLabel = self::decode(isset($row['submit_label_json']) ? (string) $row['submit_label_json'] : null);
        /** @var array<string, string>|null $successMessage */
        $successMessage = self::decode(isset($row['success_message_json']) ? (string) $row['success_message_json'] : null);

        return new ContactForm(
            organizationId: (int) $row['organization_id'],
            name: (string) $row['name'],
            description: isset($row['description']) ? (string) $row['description'] : null,
            publicFormKey: (string) $row['public_form_key'],
            defaultLocale: (string) $row['default_locale'],
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            status: (string) $row['status'],
            consentRequired: (bool) $row['consent_required'],
            consentLabel: $consentLabel,
            retentionDays: isset($row['retention_days']) ? (int) $row['retention_days'] : null,
            appearance: Appearance::fromStored($appearance),
            submitLabel: $submitLabel,
            postSubmit: isset($row['post_submit']) ? (string) $row['post_submit'] : 'message',
            successMessage: $successMessage,
            redirectUrl: isset($row['redirect_url']) ? (string) $row['redirect_url'] : null,
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
