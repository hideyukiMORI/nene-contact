import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import type { DraftField } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { FIELD_TYPE_ICON } from '@/features/build-contact-form/lib/field-types';

// Type-specific preview input on the canvas (spec §03). The placeholder text is the gray hint.
function FieldInput({ field, placeholder }: { field: DraftField; placeholder: string }): ReactNode {
  if (field.fieldType === 'textarea') {
    return <div className="fb-finput area">{placeholder}</div>;
  }
  if (field.fieldType === 'select') {
    return (
      <div className="fb-finput sel-in">
        <span>{placeholder}</span>
        <Icon name="chevDown" size={15} />
      </div>
    );
  }
  if (field.fieldType === 'file') {
    return (
      <div className="fb-finput file-in">
        <Icon name="file" size={15} />
        {placeholder}
      </div>
    );
  }
  return <div className="fb-finput">{placeholder}</div>;
}

export function SortableFieldCard({
  field,
  label,
  placeholder,
  selected,
  onSelect,
  onDelete,
}: {
  field: DraftField;
  label: string;
  placeholder: string;
  selected: boolean;
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

  const typeLabel = t(`builder.type.${field.fieldType}` as MessageKey);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={'fb-field' + (selected ? ' sel' : '')}
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
        <FieldInput field={field} placeholder={placeholder} />
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
