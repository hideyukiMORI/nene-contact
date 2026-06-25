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
    <div
      ref={setNodeRef}
      style={style}
      className={'fb-field' + (selected ? ' sel' : '') + (error !== undefined ? ' err' : '')}
      data-selected={selected ? 'true' : undefined}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
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
        <div className="fb-flabel">
          {label}
          {field.required ? <span className="req">＊</span> : null}
        </div>
        {field.description !== '' ? <div className="fb-fdesc">{field.description}</div> : null}
        <FieldPreview field={field} />
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
