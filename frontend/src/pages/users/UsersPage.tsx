import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { ManageUsers } from '@/features/manage-users';

export function UsersPage(): ReactNode {
  const { t } = useI18n();

  return (
    <section className="nc-card nc-section">
      <h1>{t('users.title')}</h1>
      <ManageUsers />
    </section>
  );
}
