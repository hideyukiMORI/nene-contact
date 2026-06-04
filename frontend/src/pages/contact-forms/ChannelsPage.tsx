import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { ManageChannels } from '@/features/manage-channels';

export function ChannelsPage(): ReactNode {
  const { t } = useI18n();
  const { id } = useParams();
  const contactFormId = Number(id);

  return (
    <section className="nc-card nc-section">
      <Link to="/contact-forms">← {t('channels.back')}</Link>
      <h1>{t('channels.title')}</h1>
      {Number.isNaN(contactFormId) ? null : <ManageChannels contactFormId={contactFormId} />}
    </section>
  );
}
