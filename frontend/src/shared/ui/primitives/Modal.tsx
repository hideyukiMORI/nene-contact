import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui/icon';

// Centered Pro Console dialog (md-*). Click the scrim or press Escape to close;
// the panel itself stops propagation. Styling lives in the centralized theme.
export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  foot,
  wide = false,
}: {
  title: string;
  subtitle?: string;
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
    <div className="md-overlay">
      <button
        type="button"
        className="md-scrim"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className={wide ? 'md-dialog wide' : 'md-dialog'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="md-head">
          {icon !== undefined ? <span className="mi">{icon}</span> : null}
          <div className="md-htext">
            <div className="ti">{title}</div>
            {subtitle !== undefined ? <div className="ds">{subtitle}</div> : null}
          </div>
          <button type="button" className="md-x" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="md-body">{children}</div>
        {foot !== undefined ? <div className="md-foot">{foot}</div> : null}
      </div>
    </div>
  );
}
