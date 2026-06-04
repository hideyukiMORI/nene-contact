import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import type { DraftField } from '@/entities/contact-form';
import type { SupportedLocale } from '@/shared/i18n/locales';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Button, TextField } from '@/shared/ui';

interface SortableFieldRowProps {
  field: DraftField;
  locales: SupportedLocale[];
  onName: (value: string) => void;
  onLabel: (locale: string, value: string) => void;
  onRequired: (value: boolean) => void;
  onOptionValues: (values: string[]) => void;
  onRemove: () => void;
}

export function SortableFieldRow(props: SortableFieldRowProps): ReactNode {
  const { field, locales, onName, onLabel, onRequired, onOptionValues, onRemove } = props;
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="nc-card nc-section">
      <div className="nc-nav">
        <button
          type="button"
          className="nc-button"
          aria-label={t('builder.drag')}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <strong>{t(`builder.type.${field.fieldType}` as MessageKey)}</strong>
        <span className="nc-nav-spacer" />
        <Button type="button" onClick={onRemove}>
          {t('builder.remove')}
        </Button>
      </div>

      {field.fieldType === 'honeypot' ? null : (
        <>
          <TextField
            label={t('builder.fieldName')}
            value={field.name}
            onChange={(e) => {
              onName(e.target.value);
            }}
          />
          {locales.map((locale) => (
            <TextField
              key={locale}
              label={t('builder.label', { locale })}
              value={field.label[locale] ?? ''}
              onChange={(e) => {
                onLabel(locale, e.target.value);
              }}
            />
          ))}
          <label className="nc-consent-row">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => {
                onRequired(e.target.checked);
              }}
            />
            {t('builder.required')}
          </label>
          {field.fieldType === 'select' ? (
            <div className="nc-field">
              <label className="nc-label" htmlFor={`opts-${field.id}`}>
                {t('builder.options')}
              </label>
              <textarea
                id={`opts-${field.id}`}
                className="nc-input"
                value={(field.options ?? []).map((o) => o.value).join('\n')}
                onChange={(e) => {
                  onOptionValues(
                    e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter((line) => line !== ''),
                  );
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}
