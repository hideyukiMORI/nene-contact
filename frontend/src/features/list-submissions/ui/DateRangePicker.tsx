import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';

export type RangeKey = 'all' | 'today' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom';

export interface DateRangeValue {
  range: RangeKey;
  from: string;
  to: string;
}

const PRESETS: { key: Exclude<RangeKey, 'custom'>; labelKey: MessageKey }[] = [
  { key: 'all', labelKey: 'inbox.dp.allTime' },
  { key: 'today', labelKey: 'inbox.dp.today' },
  { key: '7d', labelKey: 'inbox.dp.last7' },
  { key: '30d', labelKey: 'inbox.dp.last30' },
  { key: 'month', labelKey: 'inbox.dp.thisMonth' },
  { key: 'lastMonth', labelKey: 'inbox.dp.lastMonth' },
];

const pad = (n: number): string => String(n).padStart(2, '0');
const fmt = (d: Date): string =>
  `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
const sameDay = (a: Date | null, b: Date | null): boolean =>
  a !== null &&
  b !== null &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth() + n, 1);
// 'YYYY-MM-DD' → 'MM/DD'
const md = (s: string): string => (s.length > 0 ? s.slice(5).replace('-', '/') : '');

export function DateRangePicker({
  range,
  from,
  to,
  onChange,
}: DateRangeValue & { onChange: (value: DateRangeValue) => void }): ReactNode {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() =>
    from.length > 0 ? startOfMonth(parse(from)) : startOfMonth(new Date()),
  );
  const [dFrom, setDFrom] = useState<Date | null>(() => (from.length > 0 ? parse(from) : null));
  const [dTo, setDTo] = useState<Date | null>(() => (to.length > 0 ? parse(to) : null));
  const [hover, setHover] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Sync the working selection from props when opening (no state-in-effect).
  const openPicker = (): void => {
    setDFrom(from.length > 0 ? parse(from) : null);
    setDTo(to.length > 0 ? parse(to) : null);
    setView(from.length > 0 ? startOfMonth(parse(from)) : startOfMonth(new Date()));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const presetLabel = (key: RangeKey): string => {
    const found = PRESETS.find((p) => p.key === key);
    return found ? t(found.labelKey) : t('inbox.dp.allTime');
  };
  const triggerLabel =
    range === 'custom' ? (from === to ? md(from) : `${md(from)} – ${md(to)}`) : presetLabel(range);

  const pickDay = (day: Date): void => {
    if (dFrom === null || dTo !== null) {
      setDFrom(day);
      setDTo(null);
    } else if (day < dFrom) {
      setDFrom(day);
      setDTo(null);
    } else {
      setDTo(day);
    }
  };
  const applyCustom = (): void => {
    if (dFrom === null) return;
    const a = dFrom;
    const b = dTo ?? dFrom;
    onChange({ range: 'custom', from: fmt(a), to: fmt(b) });
    setOpen(false);
  };
  const choosePreset = (key: RangeKey): void => {
    onChange({ range: key, from: '', to: '' });
    setOpen(false);
  };

  // 6×7 grid for the current view month.
  const first = startOfMonth(view);
  const startCell = new Date(first);
  startCell.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startCell);
    d.setDate(startCell.getDate() + i);
    return d;
  });
  const today = new Date();
  const weekdays = t('inbox.dp.weekdays').split(',');
  const previewTo = dFrom !== null && dTo === null && hover !== null && hover > dFrom ? hover : dTo;
  const monthTitle = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ja-JP', {
    year: 'numeric',
    month: 'long',
  }).format(view);

  const rangeText =
    dFrom !== null
      ? md(fmt(dFrom)) + (dTo !== null && !sameDay(dFrom, dTo) ? ` – ${md(fmt(dTo))}` : '')
      : t('inbox.dp.pickDates');

  return (
    <div className="dp-anchor" ref={ref}>
      <button
        type="button"
        className={open ? 'dp-trigger on' : 'dp-trigger'}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openPicker();
          }
        }}
      >
        <Icon name="calendar" size={15} />
        <span>{triggerLabel}</span>
        <Icon name="chevDown" size={13} />
      </button>

      {open ? (
        <div className="dp-pop">
          <div className="dp-presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={range === p.key ? 'dp-preset on' : 'dp-preset'}
                onClick={() => {
                  choosePreset(p.key);
                }}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>

          <div className="dp-cal">
            <div className="dp-cal-head">
              <button
                type="button"
                className="dp-nav"
                aria-label={t('common.prev')}
                onClick={() => {
                  setView(addMonths(view, -1));
                }}
              >
                <Icon name="chevLeft" size={14} />
              </button>
              <div className="dp-cal-title">{monthTitle}</div>
              <button
                type="button"
                className="dp-nav"
                aria-label={t('common.next')}
                onClick={() => {
                  setView(addMonths(view, 1));
                }}
              >
                <Icon name="chevRight" size={14} />
              </button>
            </div>

            <div className="dp-grid">
              {weekdays.map((w, i) => (
                <div
                  key={`wd-${String(i)}`}
                  className={'dp-wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}
                >
                  {w}
                </div>
              ))}
              {cells.map((d, i) => {
                const out = d.getMonth() !== view.getMonth();
                const isFrom = sameDay(d, dFrom);
                const isTo = sameDay(d, previewTo);
                const inRange = dFrom !== null && previewTo !== null && d > dFrom && d < previewTo;
                const single = isFrom && (previewTo === null || sameDay(dFrom, previewTo));
                let cls = 'dp-day';
                if (out) cls += ' out';
                if (d.getDay() === 0) cls += ' sun';
                else if (d.getDay() === 6) cls += ' sat';
                if (sameDay(d, today)) cls += ' today';
                if (inRange) cls += ' in-range';
                if (isFrom || isTo)
                  cls += ' edge' + (single ? ' single' : isFrom ? ' start' : ' end');
                return (
                  <button
                    key={`d-${String(i)}`}
                    type="button"
                    className={cls}
                    onClick={() => {
                      pickDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                    }}
                    onMouseEnter={() => {
                      setHover(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="dp-foot">
              <span className="dp-range-txt">{rangeText}</span>
              <div className="dp-foot-actions">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setDFrom(null);
                    setDTo(null);
                  }}
                >
                  {t('inbox.dp.reset')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={dFrom === null}
                  onClick={applyCustom}
                >
                  {t('inbox.dp.apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
