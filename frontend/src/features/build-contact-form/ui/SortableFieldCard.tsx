import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import type { DraftField } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';

const TYPE_ICON: Record<string, IconName> = {
  text: 'text',
  email: 'mail',
  textarea: 'lines',
  select: 'list',
  checkbox: 'check',
  file: 'file',
  honeypot: 'lock',
};

function Preview({ field }: { field: DraftField }): ReactNode {
  if (field.fieldType === 'textarea') {
    return <div className="bd-input area" />;
  }
  if (field.fieldType === 'select') {
    return (
      <div className="bd-input sel-input">
        <span />
        <Icon name="chevDown" size={15} />
      </div>
    );
  }
  return <div className="bd-input" />;
}

export function SortableFieldCard({
  field,
  defaultLocale,
  selected,
  onSelect,
}: {
  field: DraftField;
  defaultLocale: string;
  selected: boolean;
  onSelect: () => void;
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
  const heading = field.label[defaultLocale]?.trim() ?? '';
  const display = heading !== '' ? heading : field.name !== '' ? field.name : typeLabel;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={'bd-field' + (selected ? ' sel' : '')}
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
        className="bd-grip"
        aria-label={t('builder.drag')}
        onClick={(e) => {
          e.stopPropagation();
        }}
        {...attributes}
        {...listeners}
      >
        <Icon name="drag" size={16} />
      </button>
      <div className="main">
        <div className="bd-flabel">
          {display}
          {field.required ? <span className="req">＊</span> : null}
        </div>
        <Preview field={field} />
      </div>
      <span className="bd-ftype">
        <Icon name={TYPE_ICON[field.fieldType] ?? 'text'} size={11} />
        {typeLabel}
      </span>
    </div>
  );
}
