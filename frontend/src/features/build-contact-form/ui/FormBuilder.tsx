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
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/shared/i18n/locales';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import type { ContactFormDraft, DraftField } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import {
  PALETTE_FIELD_TYPES,
  useFormBuilder,
} from '@/features/build-contact-form/hooks/use-form-builder';
import { SortableFieldCard } from '@/features/build-contact-form/ui/SortableFieldCard';

const TYPE_ICON: Record<string, IconName> = {
  text: 'text',
  email: 'mail',
  textarea: 'lines',
  select: 'list',
  checkbox: 'check',
  file: 'file',
  honeypot: 'lock',
};

type PanelTab = 'field' | 'form';

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
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('field');

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
    setSelectedId(id);
    setPanelTab('field');
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

  return (
    <div className="bd-editor">
      <div className="bd-toolbar">
        <button
          type="button"
          className="bd-back"
          aria-label={t('builder.changeTemplate')}
          onClick={onBack}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <span className="bd-tcrumb">{t('builder.formCrumb')} ›</span>
        <input
          className="bd-tname"
          aria-label={t('builder.formName')}
          value={draft.name}
          placeholder={t('builder.untitled')}
          onChange={(e) => {
            builder.setName(e.target.value);
          }}
        />
        <span className="fm-st ended">
          <span className="d" />
          {t('builder.statusDraft')}
        </span>
        <span className="sp" />
        <span className="ex-btn ghost">
          <Icon name="eye" size={14} />
          {t('builder.preview')}
        </span>
        <button type="button" className="ex-btn" disabled={builder.isPending} onClick={onSubmit}>
          <Icon name="check" size={14} />
          {builder.isPending
            ? t('builder.creating')
            : isEditing
              ? t('builder.saveChanges')
              : t('builder.publish')}
        </button>
      </div>

      <div className="bd-wrap">
        <div className="bd-canvas">
          <div className="bd-sheet">
            <div className="bd-sheethead">
              <div className="bd-ftitle">
                {draft.name.trim() === '' ? t('builder.untitled') : draft.name}
              </div>
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
                    defaultLocale={draft.defaultLocale}
                    selected={field.id === selectedId}
                    onSelect={() => {
                      setSelectedId(field.id);
                      setPanelTab('field');
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              className="bd-add"
              onClick={() => {
                addField('text');
              }}
            >
              <Icon name="plus" size={15} />
              {t('builder.addField')}
            </button>

            {validationMessage !== null ? (
              <div className="au-note" role="alert">
                {validationMessage}
              </div>
            ) : null}
            {builder.error !== null ? (
              <div className="au-note" role="alert">
                {t('builder.error')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="bd-panel">
          <div className="bd-ptabs">
            <button
              type="button"
              className={'bd-ptab' + (panelTab === 'field' ? ' on' : '')}
              onClick={() => {
                setPanelTab('field');
              }}
            >
              {t('builder.fieldSettings')}
            </button>
            <button
              type="button"
              className={'bd-ptab' + (panelTab === 'form' ? ' on' : '')}
              onClick={() => {
                setPanelTab('form');
              }}
            >
              {t('builder.formSettings')}
            </button>
          </div>

          <div className="bd-psecs">
            {panelTab === 'field' ? (
              <>
                {selected !== null ? (
                  <FieldSettings
                    field={selected}
                    locales={draft.locales}
                    onName={(v) => {
                      builder.updateField(selected.id, { name: v });
                    }}
                    onLabel={(loc, v) => {
                      builder.setFieldLabel(selected.id, loc, v);
                    }}
                    onRequired={(v) => {
                      builder.updateField(selected.id, { required: v });
                    }}
                    onOptions={(values) => {
                      builder.setFieldOptionValues(selected.id, values);
                    }}
                    onRemove={() => {
                      builder.removeField(selected.id);
                      setSelectedId(null);
                    }}
                  />
                ) : (
                  <div className="bd-psec">
                    <h4>{t('builder.selectedField')}</h4>
                    <p className="bd-hint">{t('builder.noSelection')}</p>
                  </div>
                )}
                <div className="bd-psec">
                  <h4>{t('builder.addField')}</h4>
                  <div className="bd-pal">
                    {PALETTE_FIELD_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="bd-palitem"
                        onClick={() => {
                          addField(type);
                        }}
                      >
                        <Icon name={TYPE_ICON[type] ?? 'text'} size={16} />
                        {t(`builder.type.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <FormSettings builder={builder} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldSettings({
  field,
  locales,
  onName,
  onLabel,
  onRequired,
  onOptions,
  onRemove,
}: {
  field: DraftField;
  locales: SupportedLocale[];
  onName: (v: string) => void;
  onLabel: (locale: string, v: string) => void;
  onRequired: (v: boolean) => void;
  onOptions: (values: string[]) => void;
  onRemove: () => void;
}): ReactNode {
  const { t } = useI18n();
  const isHoneypot = field.fieldType === 'honeypot';

  return (
    <div className="bd-psec">
      <h4>{t('builder.selectedField')}</h4>
      <div className="bd-frow">
        <span className="l">{t('builder.fieldType')}</span>
        <span className="bd-typechip">
          <Icon name={TYPE_ICON[field.fieldType] ?? 'text'} size={15} />
          {t(`builder.type.${field.fieldType}` as MessageKey)}
        </span>
      </div>

      {isHoneypot ? (
        <p className="bd-hint">{t('builder.type.honeypot')}</p>
      ) : (
        <>
          <div className="bd-frow">
            <label className="l" htmlFor={`f-name-${field.id}`}>
              {t('builder.fieldName')}
            </label>
            <input
              id={`f-name-${field.id}`}
              value={field.name}
              onChange={(e) => {
                onName(e.target.value);
              }}
            />
          </div>

          {locales.map((locale) => (
            <div className="bd-frow" key={locale}>
              <label className="l" htmlFor={`f-label-${field.id}-${locale}`}>
                {t('builder.label', { locale })}
              </label>
              <input
                id={`f-label-${field.id}-${locale}`}
                value={field.label[locale] ?? ''}
                onChange={(e) => {
                  onLabel(locale, e.target.value);
                }}
              />
            </div>
          ))}

          {field.fieldType === 'select' ? (
            <div className="bd-frow">
              <label className="l" htmlFor={`f-opts-${field.id}`}>
                {t('builder.options')}
              </label>
              <textarea
                id={`f-opts-${field.id}`}
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

          <div className="bd-frow">
            <div className="bd-toggle">
              <div>
                <div className="tl">{t('builder.required')}</div>
              </div>
              <button
                type="button"
                className={'bd-switch' + (field.required ? '' : ' off')}
                role="switch"
                aria-checked={field.required}
                aria-label={t('builder.required')}
                onClick={() => {
                  onRequired(!field.required);
                }}
              />
            </div>
          </div>
        </>
      )}

      <button type="button" className="bd-rm" onClick={onRemove}>
        {t('builder.remove')}
      </button>
    </div>
  );
}

function FormSettings({ builder }: { builder: ReturnType<typeof useFormBuilder> }): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;

  return (
    <div className="bd-psec">
      <h4>{t('builder.formSettings')}</h4>

      <div className="bd-frow">
        <span className="l">{t('builder.locales')}</span>
        {SUPPORTED_LOCALES.map((locale: SupportedLocale) => (
          <label key={locale} className="bd-toggle">
            <input
              type="checkbox"
              checked={draft.locales.includes(locale)}
              onChange={() => {
                builder.toggleLocale(locale);
              }}
            />
            <span className="tl">{locale}</span>
            <span className="sp" />
            <input
              type="radio"
              name="default-locale"
              aria-label={t('builder.defaultLocale')}
              checked={draft.defaultLocale === locale}
              disabled={!draft.locales.includes(locale)}
              onChange={() => {
                builder.setDefaultLocale(locale);
              }}
            />
          </label>
        ))}
      </div>

      <div className="bd-frow">
        <label className="bd-toggle">
          <input type="checkbox" checked={draft.consentRequired} onChange={builder.toggleConsent} />
          <span className="tl">{t('builder.consentRequired')}</span>
        </label>
      </div>
      {draft.consentRequired
        ? draft.locales.map((locale) => (
            <div className="bd-frow" key={locale}>
              <label className="l" htmlFor={`consent-${locale}`}>
                {t('builder.consentLabel', { locale })}
              </label>
              <input
                id={`consent-${locale}`}
                value={draft.consentLabel?.[locale] ?? ''}
                onChange={(e) => {
                  builder.setConsentLabel(locale, e.target.value);
                }}
              />
            </div>
          ))
        : null}

      <div className="bd-frow">
        <label className="l" htmlFor="retention-days">
          {t('builder.retentionDays')}
        </label>
        <input
          id="retention-days"
          type="number"
          min="1"
          value={draft.retentionDays ?? ''}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            builder.setRetentionDays(Number.isNaN(n) ? null : n);
          }}
        />
      </div>

      <div className="bd-frow">
        <label className="l" htmlFor="allowed-origins">
          {t('builder.allowedOrigins')}
        </label>
        <textarea
          id="allowed-origins"
          value={draft.allowedOrigins.join('\n')}
          onChange={(e) => {
            builder.setAllowedOrigins(
              e.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== ''),
            );
          }}
        />
      </div>
    </div>
  );
}
