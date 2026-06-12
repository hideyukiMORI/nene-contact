/**
 * Type-specific live preview shown for a field on the canvas (field-config UI §09). Renders what
 * the respondent will see and reflects the per-type config immediately. Select fields render the
 * dropdown-style placeholder (the rich choice editor takes over when selected).
 */
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type {
  CharLimit,
  DateConfig,
  DraftField,
  FileConfig,
  TextareaConfig,
} from '@/entities/contact-form';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

const ROWS_H: Record<string, number> = { sm: 46, md: 78, lg: 118 };

function fileMeta(c: FileConfig, t: Translate): string {
  const fmt = [
    c.fmtImage ? t('fc.file.image') : '',
    c.fmtPdf ? 'PDF' : '',
    c.fmtDoc ? t('fc.file.doc') : '',
  ]
    .filter((x) => x !== '')
    .join('・');
  const fmtText = fmt !== '' ? fmt : t('fc.preview.fmtNone');
  const cnt = c.multiple
    ? t('fc.preview.maxN', { n: String(c.maxCount) })
    : t('fc.preview.oneFile');
  return `${fmtText} / ${String(c.maxSize)}MB / ${cnt}`;
}

function dateText(c: DateConfig, t: Translate): string {
  if (c.mode === 'time') return '--:--';
  if (c.mode === 'datetime') return `${t('fc.preview.dateY')}  --:--`;
  return t('fc.preview.dateY');
}

function rangeText(c: DateConfig, t: Translate): string {
  if (c.range === 'future') return t('fc.preview.rangeFuture');
  if (c.range === 'past') return t('fc.preview.rangePast');
  if (c.range === 'between')
    return `${c.from !== '' ? c.from : t('fc.date.from')} 〜 ${c.to !== '' ? c.to : t('fc.date.to')}`;
  return '';
}

export function FieldPreview({ field }: { field: DraftField }): ReactNode {
  const { t } = useI18n();
  const ph = field.placeholder;

  switch (field.fieldType) {
    case 'text':
    case 'phone': {
      const cl = field.fieldType === 'text' ? (field.typeConfig as CharLimit | null) : null;
      return (
        <>
          <div className="bd-input">
            {ph !== '' ? ph : field.fieldType === 'phone' ? '090-1234-5678' : t('fc.preview.text')}
          </div>
          {cl != null && cl.counter && cl.maxOn ? (
            <div className="fc-counter">0 / {cl.max}</div>
          ) : null}
        </>
      );
    }
    case 'email':
      return (
        <>
          <div className="bd-input">{ph !== '' ? ph : 'name@example.com'}</div>
          {(field.typeConfig as { confirm?: boolean } | null)?.confirm === true ? (
            <div className="fc-subinput">
              <div className="lab">{t('fc.preview.confirm')}</div>
              <div className="bd-input">name@example.com</div>
            </div>
          ) : null}
        </>
      );
    case 'textarea': {
      const c = field.typeConfig as TextareaConfig | null;
      return (
        <>
          <div
            className="bd-input area"
            style={{ minHeight: c != null ? ROWS_H[c.rows] : ROWS_H['md'] }}
          >
            {ph !== '' ? ph : t('fc.preview.text')}
          </div>
          {c != null && c.counter && c.maxOn ? <div className="fc-counter">0 / {c.max}</div> : null}
        </>
      );
    }
    case 'date': {
      const c = field.typeConfig as DateConfig | null;
      const range = c != null ? rangeText(c, t) : '';
      return (
        <>
          <div className="fc-date">
            {c != null ? dateText(c, t) : t('fc.preview.dateY')}
            <Icon name="calendar" size={16} />
          </div>
          {range !== '' ? (
            <div className="fc-rangehint">
              <span className="d" />
              {range}
            </div>
          ) : null}
        </>
      );
    }
    case 'file': {
      const c = field.typeConfig as FileConfig | null;
      return (
        <div className="fc-file">
          <span className="big">
            <Icon name="clip" size={19} />
          </span>
          <div className="t">
            <span className="br">{t('fc.preview.fileSelect')}</span>
            {t('fc.preview.fileDrop')}
          </div>
          {c != null ? <div className="meta">{fileMeta(c, t)}</div> : null}
        </div>
      );
    }
    case 'select':
      return (
        <div className="bd-input sel-input">
          {ph !== '' ? ph : t('builder.default.select.ph')}
          <Icon name="chevDown" size={15} />
        </div>
      );
    default:
      return <div className="bd-input">—</div>;
  }
}
