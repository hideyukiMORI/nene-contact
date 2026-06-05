import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';

// Centered overlay dialog (Design System v2). Click the scrim or press Escape to close;
// the panel itself stops propagation. Styling lives in the centralized theme.
export function Modal({
  title,
  icon,
  onClose,
  children,
  foot,
  wide = false,
}: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
  wide?: boolean;
}): ReactNode {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="overlay">
      <button
        type="button"
        className="overlay-scrim"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className={wide ? 'modal wide' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          {icon !== undefined ? <span className="modal-mark">{icon}</span> : null}
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn x-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot !== undefined ? <div className="modal-foot">{foot}</div> : null}
      </div>
    </div>
  );
}
