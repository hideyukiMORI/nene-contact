import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import type { DraftField } from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { FIELD_TYPE_ICON, fieldTypeLabelKey } from '@/features/build-contact-form/lib/field-types';
import { FieldPreview } from '@/features/build-contact-form/ui/field-config/FieldPreview';

export function SortableFieldCard({
  field,
  label,
  selected,
  error,
  onSelect,
  onDelete,
}: {
  field: DraftField;
  label: string;
  selected: boolean;
  error?: string | undefined;
  onSelect: () => void;
  onDelete: () => void;
}): ReactNode {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  const typeLabel = t(fieldTypeLabelKey(field.fieldType));

  return (
    // Mouse convenience only: clicking anywhere on the card selects it. Keyboard and screen-reader
    // users select via the label <button> below, so onClick here is a redundant pointer enhancement,
    // not the sole interaction — the card is intentionally not role=button (that caused nested-interactive).
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={setNodeRef}
      style={style}
      className={'fb-field' + (selected ? ' sel' : '') + (error !== undefined ? ' err' : '')}
      data-selected={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      <button
        type="button"
        className="fb-grip"
        aria-label={t('builder.drag')}
        onClick={(e) => {
          e.stopPropagation();
        }}
        {...attributes}
        {...listeners}
      >
        <Icon name="drag" size={16} />
      </button>
      <div className="fb-fmain">
        <button
          type="button"
          className="fb-flabel fb-flabel-btn"
          aria-pressed={selected}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {label}
          {field.required ? <span className="req">＊</span> : null}
        </button>
        {field.description !== '' ? <div className="fb-fdesc">{field.description}</div> : null}
        {/* Preview is non-interactive (divs only) — hide from the a11y tree / tab order. */}
        <div className="fb-fpreview" aria-hidden="true">
          <FieldPreview field={field} />
        </div>
        {error !== undefined ? (
          <div className="fb-ferr" role="alert">
            <Icon name="warn" size={13} />
            {error}
          </div>
        ) : null}
      </div>
      <span className="fb-ftype">
        <Icon name={FIELD_TYPE_ICON[field.fieldType] ?? 'text'} size={11} />
        {typeLabel}
      </span>
      <button
        type="button"
        className="fb-fdel"
        aria-label={t('builder.removeField')}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Icon name="trash" size={15} />
      </button>
    </div>
  );
}
