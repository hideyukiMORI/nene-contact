import type { ReactNode } from 'react';

/**
 * Fleet-canonical pagination: a range readout plus previous/next controls, visible for any
 * non-empty list (mirrors NeNe Vault's `Pagination`). The component holds no i18n — the
 * consumer resolves and passes every string (fleet 会議 R1②) — and it is styled with the
 * console's own semantic classes rather than the shared `Button`, which cannot carry a
 * secondary variant (same approach as the retired numbered `Pager`).
 */
interface PaginationProps {
  /** Total matched rows; the component renders nothing when this is 0. */
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Resolved "showing {from}–{to} of {total}" range text, formatted by the consumer. */
  showingLabel: string;
  /** Resolved label for the previous-page button. */
  previousLabel: string;
  /** Resolved label for the next-page button. */
  nextLabel: string;
}

export function Pagination({
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
  showingLabel,
  previousLabel,
  nextLabel,
}: PaginationProps): ReactNode {
  if (total === 0) {
    return null;
  }

  return (
    <div className="nc-pagination">
      <span className="nc-pg-range">{showingLabel}</span>
      <div className="nc-pg-nav">
        <button type="button" className="nc-pg-btn" onClick={onPrev} disabled={!canPrev}>
          {previousLabel}
        </button>
        <button type="button" className="nc-pg-btn" onClick={onNext} disabled={!canNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
