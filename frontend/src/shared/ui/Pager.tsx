import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui/icon';

/**
 * Numbered pager with page-jump, shared by the inbox and the audit log (nc04).
 * Shows the current page ±1 with ellipses to the ends, which stay clickable.
 */
function pageList(pg: number, pages: number): (number | 'gap-l' | 'gap-r')[] {
  const out: (number | 'gap-l' | 'gap-r')[] = [];
  const win = 1;
  const lo = Math.max(1, pg - win);
  const hi = Math.min(pages, pg + 1 + win);
  out.push(0);
  if (lo > 1) out.push('gap-l');
  for (let i = lo; i < hi; i++) {
    if (i !== 0 && i !== pages - 1) out.push(i);
  }
  if (hi < pages - 1) out.push('gap-r');
  if (pages > 1) out.push(pages - 1);
  return out.filter((v, i, a) => a.indexOf(v) === i);
}

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}): ReactNode {
  const { t } = useI18n();
  if (pages <= 1) {
    return null;
  }

  return (
    <>
      <div className="al-pager">
        <button
          type="button"
          className="al-pg nav"
          disabled={page === 0}
          aria-label={t('common.prev')}
          onClick={() => {
            onPage(page - 1);
          }}
        >
          <Icon name="chevLeft" size={14} />
        </button>
        <div className="al-pages">
          {pageList(page, pages).map((v) =>
            typeof v === 'string' ? (
              <span className="al-pg gap" key={v}>
                …
              </span>
            ) : (
              <button
                type="button"
                key={v}
                className={'al-pg' + (v === page ? ' on' : '')}
                onClick={() => {
                  onPage(v);
                }}
              >
                {v + 1}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          className="al-pg nav"
          disabled={page >= pages - 1}
          aria-label={t('common.next')}
          onClick={() => {
            onPage(page + 1);
          }}
        >
          <Icon name="chevRight" size={14} />
        </button>
      </div>
      <div className="al-jump">
        <span>{t('pager.jump')}</span>
        <input
          type="number"
          min={1}
          max={pages}
          value={page + 1}
          aria-label={t('pager.jump')}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) {
              onPage(Math.min(pages, Math.max(1, n)) - 1);
            }
          }}
        />
        <span>/ {pages}</span>
      </div>
    </>
  );
}
