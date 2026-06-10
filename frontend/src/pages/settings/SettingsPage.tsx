import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';

// Settings is introduced as a Pro Console nav destination. The full screen (一般/通知/
// ブランド/連携) lands in a later slice; this is the routed placeholder so the nav item resolves.
export function SettingsPage(): ReactNode {
  const { t } = useI18n();
  return (
    <div className="ex-body">
      <h1 className="ex-h1">{t('settings.title')}</h1>
      <p className="ex-lead">{t('settings.lead')}</p>
      <div className="ex-card ex-card-pad">{t('settings.comingSoon')}</div>
    </div>
  );
}
