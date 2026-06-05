import { Link, useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useContactFormsQuery } from '@/entities/contact-form';
import { useSubmissionsQuery } from '@/entities/submission';
import type { SubmissionStatus } from '@/entities/submission';
import { DashIcon } from '@/pages/home/icons';
import type { DashIconName } from '@/pages/home/icons';

// A dashboard summary fetches the most recent page; open/resolved tallies are over
// this window (the list API has no status filter), while the total comes from the API.
const RECENT_WINDOW = 100;

interface Stat {
  labelKey: MessageKey;
  subKey: MessageKey;
  value: number;
  icon: DashIconName;
  accent?: boolean;
}

function StatusBadge({ status }: { status: SubmissionStatus }): ReactNode {
  const { t } = useI18n();
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {t(`submission.status.${status}`)}
    </span>
  );
}

export function HomePage(): ReactNode {
  const { t } = useI18n();
  const { session } = useOutletContext<{ session: Session }>();

  const formsQuery = useContactFormsQuery();
  const submissionsQuery = useSubmissionsQuery({ limit: RECENT_WINDOW, offset: 0 });

  const forms = formsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];

  const liveForms = forms.filter((f) => f.status === 'active').length;
  const openCount = submissions.filter((s) => s.status === 'open').length;
  const resolvedCount = submissions.filter((s) => s.status === 'resolved').length;
  const totalReceived = submissionsQuery.data?.total ?? submissions.length;

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('home.recent.unknownForm', { id: String(id) });
  };

  const username = session.email.split('@')[0];
  const recent = submissions.slice(0, 5);

  const stats: Stat[] = [
    { labelKey: 'home.stat.forms', subKey: 'home.stat.formsSub', value: liveForms, icon: 'forms' },
    {
      labelKey: 'home.stat.open',
      subKey: 'home.stat.openSub',
      value: openCount,
      icon: 'inbox',
      accent: openCount > 0,
    },
    {
      labelKey: 'home.stat.total',
      subKey: 'home.stat.totalSub',
      value: totalReceived,
      icon: 'mail',
    },
    {
      labelKey: 'home.stat.resolved',
      subKey: 'home.stat.resolvedSub',
      value: resolvedCount,
      icon: 'check',
    },
  ];

  return (
    <div className="dash">
      <div className="page-head page-head-row">
        <div className="grow">
          <div className="eyebrow">
            {t('home.eyebrow')} · {username}
          </div>
          <h1>{t('home.heading')}</h1>
          <p className="lead">{t('home.lead')}</p>
        </div>
        <span className="chip">
          <DashIcon name="user" size={13} />
          {t('home.role', { role: session.role })}
        </span>
      </div>

      <div className="grid grid-4">
        {stats.map((stat) => (
          <div
            key={stat.labelKey}
            className={`card stat${stat.accent === true ? ' stat-accent' : ''}`}
          >
            <div className="s-label">
              <DashIcon name={stat.icon} size={14} />
              {t(stat.labelKey)}
            </div>
            <div className="s-val">{stat.value}</div>
            <div className="s-sub">{t(stat.subKey)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <DashIcon name="inbox" size={17} />
          <h3>{t('home.recent.title')}</h3>
          <span className="spacer" />
          <Link className="link-btn" to="/submissions">
            {t('home.recent.viewAll')}
          </Link>
        </div>

        {submissionsQuery.isError ? (
          <div className="card-pad">
            <p className="faint">{t('home.recent.error')}</p>
          </div>
        ) : submissionsQuery.isLoading ? (
          <div className="card-pad">
            <p className="faint">{t('common.loading')}</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="card-pad">
            <p className="faint">{t('home.recent.empty')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <tbody>
                {recent.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <Link className="cell-strong" to={`/submissions/${String(submission.id)}`}>
                        {formName(submission.contactFormId)}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="cell-mute recent-when">{submission.submittedAt ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
