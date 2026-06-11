import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type { ContactFormDraft, DraftField } from '@/entities/contact-form';
import { useFormBuilder } from '@/features/build-contact-form/hooks/use-form-builder';
import { SortableFieldCard } from '@/features/build-contact-form/ui/SortableFieldCard';
import {
  FIELD_DEFAULT_KEYS,
  FIELD_TYPE_ICON,
  PALETTE,
} from '@/features/build-contact-form/lib/field-types';

type Builder = ReturnType<typeof useFormBuilder>;
type Translate = (key: MessageKey, params?: Record<string, string>) => string;

function defaultPlaceholder(fieldType: string, t: Translate): string {
  const keys = FIELD_DEFAULT_KEYS[fieldType];
  return keys !== undefined ? t(keys.placeholder) : '';
}

export function FormBuilder({
  onCreated,
  onBack,
  initialDraft,
  formId,
}: {
  onCreated: () => void;
  onBack?: () => void;
  initialDraft?: ContactFormDraft;
  formId?: number;
}): ReactNode {
  const { t } = useI18n();
  const builder = useFormBuilder(initialDraft, formId);
  const isEditing = formId !== undefined;
  const { draft } = builder;
  const locale = draft.defaultLocale;

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Preview-only state — the API has no column for these yet, so they drive the live canvas
  // but are not persisted on save (per-field placeholder, public path).
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [publicPath, setPublicPath] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over !== null && active.id !== over.id) {
      builder.moveField(String(active.id), String(over.id));
    }
  };

  const addField = (fieldType: string): void => {
    const id = builder.addField(fieldType);
    const keys = FIELD_DEFAULT_KEYS[fieldType];
    if (keys !== undefined) {
      builder.setFieldLabel(id, locale, t(keys.label));
      setPlaceholders((p) => ({ ...p, [id]: t(keys.placeholder) }));
    }
    setSelectedId(id);
  };

  const deleteField = (id: string): void => {
    const remaining = draft.fields.filter((f) => f.id !== id);
    builder.removeField(id);
    setPlaceholders((p) => Object.fromEntries(Object.entries(p).filter(([key]) => key !== id)));
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const onSubmit = (): void => {
    setValidationMessage(null);
    if (draft.name.trim() === '' || draft.fields.length === 0) {
      setValidationMessage(t('builder.validation'));
      return;
    }
    void builder.submit().then(onCreated, () => {
      // Error surfaced via builder.error (AppError).
    });
  };

  const selected = draft.fields.find((f) => f.id === selectedId) ?? null;

  const fieldLabel = (field: DraftField): string => {
    const raw = field.label[locale];
    return raw !== undefined && raw.trim() !== ''
      ? raw
      : t(`builder.type.${field.fieldType}` as MessageKey);
  };
  const fieldPlaceholder = (field: DraftField): string =>
    placeholders[field.id] ?? defaultPlaceholder(field.fieldType, t);

  return (
    <div className="fb-page">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="chevLeft" size={15} />
        {t('builder.backToList')}
      </button>

      <div className="page-head">
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h1>{isEditing ? t('builder.editForm') : t('builder.newForm')}</h1>
          <p className="lead">{t('builder.lead')}</p>
        </div>
        <button type="button" className="ex-btn ghost" onClick={onBack}>
          {t('builder.cancel')}
        </button>
        <span className="ex-btn ghost">
          <Icon name="eye" size={15} />
          {t('builder.preview')}
        </span>
        <button type="button" className="ex-btn" disabled={builder.isPending} onClick={onSubmit}>
          <Icon name="check" size={15} />
          {builder.isPending
            ? t('builder.creating')
            : isEditing
              ? t('builder.saveChanges')
              : t('builder.publish')}
        </button>
      </div>

      {validationMessage !== null ? (
        <div className="au-note" role="alert" style={{ marginBottom: '16px' }}>
          {validationMessage}
        </div>
      ) : null}
      {builder.error !== null ? (
        <div className="au-note" role="alert" style={{ marginBottom: '16px' }}>
          {t('builder.error')}
        </div>
      ) : null}

      <div className="fb-grid">
        <div className="fb-canvas">
          <div className="fb-sheet">
            <div className="fb-sheet-head">
              <input
                className="fb-title-in"
                aria-label={t('builder.formName')}
                value={draft.name}
                placeholder={t('builder.untitled')}
                onChange={(e) => {
                  builder.setName(e.target.value);
                }}
              />
              <textarea
                className="fb-desc-in"
                rows={1}
                aria-label={t('builder.description')}
                value={draft.description}
                placeholder={t('builder.descPlaceholder')}
                onChange={(e) => {
                  builder.setDescription(e.target.value);
                }}
              />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={draft.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {draft.fields.map((field) => (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    label={fieldLabel(field)}
                    placeholder={fieldPlaceholder(field)}
                    selected={field.id === selectedId}
                    onSelect={() => {
                      setSelectedId(field.id);
                    }}
                    onDelete={() => {
                      deleteField(field.id);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              className="fb-add"
              onClick={() => {
                addField('text');
              }}
            >
              <Icon name="plus" size={15} />
              {t('builder.addField')}
            </button>
          </div>
        </div>

        <div className="fb-panel">
          <FormSettingsCard
            builder={builder}
            publicPath={publicPath}
            onPublicPath={setPublicPath}
          />
          <SelectedFieldCard
            field={selected}
            locale={locale}
            placeholder={selected !== null ? fieldPlaceholder(selected) : ''}
            onLabel={(v) => {
              if (selected !== null) {
                builder.setFieldLabel(selected.id, locale, v);
              }
            }}
            onPlaceholder={(v) => {
              if (selected !== null) {
                setPlaceholders((p) => ({ ...p, [selected.id]: v }));
              }
            }}
            onRequired={(v) => {
              if (selected !== null) {
                builder.updateField(selected.id, { required: v });
              }
            }}
            onOptions={(values) => {
              if (selected !== null) {
                builder.setFieldOptionValues(selected.id, values);
              }
            }}
          />
          <PaletteCard onAdd={addField} />
        </div>
      </div>
    </div>
  );
}

function Switch({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      className={'switch' + (on ? '' : ' off')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

function FormSettingsCard({
  builder,
  publicPath,
  onPublicPath,
}: {
  builder: Builder;
  publicPath: string;
  onPublicPath: (v: string) => void;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;

  return (
    <div className="card card-pad">
      <h4 className="fb-psec-h">
        <Icon name="settings" size={15} />
        {t('builder.formSettings')}
      </h4>
      <div className="fb-frow">
        <label className="l" htmlFor="fb-form-name">
          {t('builder.formName')}
        </label>
        <input
          id="fb-form-name"
          className="input"
          value={draft.name}
          onChange={(e) => {
            builder.setName(e.target.value);
          }}
        />
      </div>
      <div className="fb-frow">
        <span className="l">{t('builder.publicPath')}</span>
        <div className="fb-affix">
          <span className="pre">{t('builder.publicPathPrefix')}</span>
          <input
            aria-label={t('builder.publicPath')}
            value={publicPath}
            onChange={(e) => {
              onPublicPath(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''));
            }}
          />
        </div>
      </div>
      <div className="fb-frow">
        <div className="fb-toggle-row">
          <div className="info">
            <div className="t">{t('builder.consentTitle')}</div>
            <div className="d">{t('builder.consentDesc')}</div>
          </div>
          <Switch
            on={draft.consentRequired}
            label={t('builder.consentTitle')}
            onToggle={builder.toggleConsent}
          />
        </div>
      </div>
    </div>
  );
}

function SelectedFieldCard({
  field,
  locale,
  placeholder,
  onLabel,
  onPlaceholder,
  onRequired,
  onOptions,
}: {
  field: DraftField | null;
  locale: string;
  placeholder: string;
  onLabel: (v: string) => void;
  onPlaceholder: (v: string) => void;
  onRequired: (v: boolean) => void;
  onOptions: (values: string[]) => void;
}): ReactNode {
  const { t } = useI18n();

  return (
    <div className="card card-pad">
      <h4 className="fb-psec-h">
        <Icon name="edit" size={15} />
        {t('builder.selectedField')}
      </h4>
      {field === null ? (
        <p className="fb-empty-sel">{t('builder.noSelection')}</p>
      ) : (
        <>
          <div className="fb-frow">
            <span className="l">{t('builder.fieldType')}</span>
            <span className="fb-typechip">
              <Icon name={FIELD_TYPE_ICON[field.fieldType] ?? 'text'} size={15} />
              {t(`builder.type.${field.fieldType}` as MessageKey)}
            </span>
          </div>
          <div className="fb-frow">
            <label className="l" htmlFor="fb-field-label">
              {t('builder.fieldLabel')}
            </label>
            <input
              id="fb-field-label"
              className="input"
              value={field.label[locale] ?? ''}
              onChange={(e) => {
                onLabel(e.target.value);
              }}
            />
          </div>
          <div className="fb-frow">
            <label className="l" htmlFor="fb-field-ph">
              {t('builder.placeholder')}
            </label>
            <input
              id="fb-field-ph"
              className="input"
              value={placeholder}
              onChange={(e) => {
                onPlaceholder(e.target.value);
              }}
            />
          </div>
          {field.fieldType === 'select' ? (
            <div className="fb-frow">
              <label className="l" htmlFor="fb-field-opts">
                {t('builder.options')}
              </label>
              <textarea
                id="fb-field-opts"
                className="input"
                value={(field.options ?? []).map((o) => o.value).join('\n')}
                onChange={(e) => {
                  onOptions(
                    e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter((line) => line !== ''),
                  );
                }}
              />
            </div>
          ) : null}
          <div className="fb-frow">
            <div className="fb-toggle-row">
              <div className="info">
                <div className="t">{t('builder.required')}</div>
              </div>
              <Switch
                on={field.required}
                label={t('builder.required')}
                onToggle={() => {
                  onRequired(!field.required);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PaletteCard({ onAdd }: { onAdd: (fieldType: string) => void }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="card card-pad">
      <h4 className="fb-psec-h">
        <Icon name="plus" size={15} />
        {t('builder.addField')}
      </h4>
      <div className="fb-pal">
        {PALETTE.map((type) => (
          <button
            key={type}
            type="button"
            className="fb-palitem"
            onClick={() => {
              onAdd(type);
            }}
          >
            <Icon name={FIELD_TYPE_ICON[type] ?? 'text'} size={16} />
            {t(`builder.type.${type}` as MessageKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
