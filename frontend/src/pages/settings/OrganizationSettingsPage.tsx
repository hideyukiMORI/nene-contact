import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { OrganizationSettingsForm } from '@/features/edit-organization-settings';

// Self-service organization settings (ManageSettings). Distinct from superadmin org management.
export function OrganizationSettingsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('orgSettings.title')}</h1>
      </div>
      <p className="ex-lead">{t('orgSettings.lead')}</p>

      <div className="fm-card ex-card-pad">
        <div className="ex-cardhead">
          <h3>{t('orgSettings.email.heading')}</h3>
        </div>
        <OrganizationSettingsForm />
      </div>
    </div>
  );
}
