import { Link, useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { useSubmissionsQuery } from '@/entities/submission';
import type { SubmissionStatus } from '@/entities/submission';

// The dashboard summary fetches the most recent page; open/resolved tallies are over
// this window (the list API has no status filter), while the total comes from the API.
const RECENT_WINDOW = 100;
const RECENT_SHOWN = 6;

// Illustrative 7-day sparkline (no per-day API yet); the index-5 bar is highlighted.
const SPARK = ['spk-3', 'spk-5', 'spk-2', 'spk-6', 'spk-4', 'spk-7', 'spk-5'];

const BADGE_CLASS: Record<SubmissionStatus, string> = {
  open: 'open',
  in_progress: 'prog',
  resolved: 'done',
  spam: 'spam',
};

interface Stat {
  labelKey: MessageKey;
  subKey: MessageKey;
  value: number;
  icon: IconName;
  accent?: boolean;
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
  const recent = submissions.slice(0, RECENT_SHOWN);

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('home.recent.unknownForm', { id: String(id) });
  };

  const username = session.email.split('@')[0];
  const weekdays = t('home.weekdays').split(',');

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
      labelKey: 'home.stat.resolved',
      subKey: 'home.stat.resolvedSub',
      value: resolvedCount,
      icon: 'check',
    },
  ];

  return (
    <div className="ex-body">
      <div className="ex-row">
        <div className="grow">
          <div className="ex-eyebrow">
            {t('home.eyebrow')} · {username}
          </div>
          <h1 className="ex-h1">{t('home.title')}</h1>
        </div>
        <span className="ex-btn ghost">
          <Icon name="filter" size={14} />
          {t('home.thisWeek')}
        </span>
        <Link className="ex-btn" to="/contact-forms/new">
          <Icon name="plus" size={14} />
          {t('home.newForm')}
        </Link>
      </div>

      <div className="ex-grid3">
        {stats.map((stat) => (
          <div
            key={stat.labelKey}
            className={'ex-card ex-card-pad ex-stat' + (stat.accent === true ? ' accent' : '')}
          >
            <div className="lab">
              <Icon name={stat.icon} size={13} />
              {t(stat.labelKey)}
            </div>
            <div className="val">{stat.value}</div>
            <div className="sub">{t(stat.subKey)}</div>
          </div>
        ))}
      </div>

      <div className="dash-split">
        <div className="ex-card ex-card-pad ex-sparkcard">
          <div className="ex-stat">
            <div className="lab">
              <Icon name="bell" size={13} />
              {t('home.trend')}
            </div>
            <div className="val">{totalReceived}</div>
          </div>
          <div className="ex-spark">
            {SPARK.map((h, i) => (
              <i key={i} className={h + (i === 5 ? ' hi' : '')} />
            ))}
          </div>
          <div className="ex-sparkx">
            {weekdays.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>

        <div className="ex-card">
          <div className="ex-cardhead">
            <Icon name="inbox" size={15} />
            <h3>{t('home.recent.title')}</h3>
            <Link className="more" to="/submissions">
              {t('home.recent.viewAll')}
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="ex-recent-empty">{t('home.recent.empty')}</div>
          ) : (
            <div className="tbl-wrap">
              <table className="ex-tbl">
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link className="nm" to={`/submissions/${String(s.id)}`}>
                          {formName(s.contactFormId)}
                        </Link>
                      </td>
                      <td>
                        <span className={`ex-badge ${BADGE_CLASS[s.status]}`}>
                          <span className="dot" />
                          {t(`submission.status.${s.status}`)}
                        </span>
                      </td>
                      <td className="right">
                        <span className="ex-time">{s.submittedAt ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
