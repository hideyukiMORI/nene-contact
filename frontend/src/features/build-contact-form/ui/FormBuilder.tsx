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
import { Alert, Button, TextField } from '@/shared/ui';
import {
  PALETTE_FIELD_TYPES,
  useFormBuilder,
} from '@/features/build-contact-form/hooks/use-form-builder';
import { SortableFieldRow } from '@/features/build-contact-form/ui/SortableFieldRow';

export function FormBuilder({ onCreated }: { onCreated: () => void }): ReactNode {
  const { t } = useI18n();
  const builder = useFormBuilder();
  const { draft } = builder;
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

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

  return (
    <div className="nc-section">
      <TextField
        label={t('builder.formName')}
        value={draft.name}
        onChange={(e) => {
          builder.setName(e.target.value);
        }}
      />

      <fieldset className="nc-fieldset">
        <legend>{t('builder.locales')}</legend>
        {SUPPORTED_LOCALES.map((locale: SupportedLocale) => (
          <label key={locale} className="nc-consent-row">
            <input
              type="checkbox"
              checked={draft.locales.includes(locale)}
              onChange={() => {
                builder.toggleLocale(locale);
              }}
            />
            {locale}
            <input
              type="radio"
              name="default-locale"
              checked={draft.defaultLocale === locale}
              disabled={!draft.locales.includes(locale)}
              onChange={() => {
                builder.setDefaultLocale(locale);
              }}
            />
            {t('builder.defaultLocale')}
          </label>
        ))}
      </fieldset>

      <fieldset className="nc-fieldset">
        <legend>{t('builder.consent')}</legend>
        <label className="nc-consent-row">
          <input type="checkbox" checked={draft.consentRequired} onChange={builder.toggleConsent} />
          {t('builder.consentRequired')}
        </label>
        {draft.consentRequired
          ? draft.locales.map((locale) => (
              <TextField
                key={locale}
                label={t('builder.consentLabel', { locale })}
                value={draft.consentLabel?.[locale] ?? ''}
                onChange={(e) => {
                  builder.setConsentLabel(locale, e.target.value);
                }}
              />
            ))
          : null}
      </fieldset>

      <div className="nc-palette">
        <span className="nc-label">{t('builder.palette')}</span>
        {PALETTE_FIELD_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            onClick={() => {
              builder.addField(type);
            }}
          >
            + {t(`builder.type.${type}`)}
          </Button>
        ))}
      </div>

      {draft.fields.length === 0 ? <p className="nc-muted">{t('builder.empty')}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={draft.fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="nc-section nc-list-reset">
            {draft.fields.map((field) => (
              <SortableFieldRow
                key={field.id}
                field={field}
                locales={draft.locales}
                onName={(value) => {
                  builder.updateField(field.id, { name: value });
                }}
                onLabel={(locale, value) => {
                  builder.setFieldLabel(field.id, locale, value);
                }}
                onRequired={(value) => {
                  builder.updateField(field.id, { required: value });
                }}
                onOptionValues={(values) => {
                  builder.setFieldOptionValues(field.id, values);
                }}
                onRemove={() => {
                  builder.removeField(field.id);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {validationMessage !== null ? <Alert>{validationMessage}</Alert> : null}
      {builder.error !== null ? <Alert>{t('builder.error')}</Alert> : null}

      <Button type="button" disabled={builder.isPending} onClick={onSubmit}>
        {builder.isPending ? t('builder.creating') : t('builder.create')}
      </Button>
    </div>
  );
}
