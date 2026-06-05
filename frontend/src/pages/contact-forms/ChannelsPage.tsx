import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { useContactFormsQuery } from '@/entities/contact-form';
import { ManageChannels } from '@/features/manage-channels';
import { ChannelIcon } from '@/features/manage-channels/ui/icons';

export function ChannelsPage(): ReactNode {
  const { t } = useI18n();
  const { id } = useParams();
  const contactFormId = Number(id);

  const formsQuery = useContactFormsQuery();
  const formName = formsQuery.data?.items.find((f) => f.id === contactFormId)?.name ?? '';

  return (
    <>
      <Link className="back-link" to="/contact-forms">
        <ChannelIcon name="arrowLeft" size={15} />
        {t('channels.back')}
      </Link>

      <div className="page-head">
        <h1>{t('channels.title')}</h1>
        <p className="lead">{t('channels.lead', { name: formName })}</p>
      </div>

      <div className="notice info">
        <ChannelIcon name="info" size={18} className="n-ico" />
        <div>{t('channels.notice')}</div>
      </div>

      {Number.isNaN(contactFormId) ? null : <ManageChannels contactFormId={contactFormId} />}
    </>
  );
}
