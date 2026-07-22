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
import { bucketSevenDays, sevenDayFrom } from '@/pages/home/trend';

// The dashboard summary fetches the most recent page; open/resolved tallies are over
// this window (the list API has no status filter).
const RECENT_WINDOW = 100;
const RECENT_SHOWN = 6;
// The 7-day trend aggregates the recent list client-side (limit 100). If a single 7-day
// window ever exceeds 100 submissions this undercounts the busiest days — promote to a
// dedicated per-day aggregation endpoint then (future Issue).
const TREND_WINDOW = 100;

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

  const now = new Date();
  const formsQuery = useContactFormsQuery();
  const submissionsQuery = useSubmissionsQuery({ limit: RECENT_WINDOW, offset: 0 });
  const trendQuery = useSubmissionsQuery({
    from: sevenDayFrom(now),
    limit: TREND_WINDOW,
    offset: 0,
  });

  const forms = formsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];
  const trendDays = bucketSevenDays(trendQuery.data?.items ?? [], now);
  const trendMax = Math.max(...trendDays.map((d) => d.count), 1);
  // The card is headed "受信の推移（7日）", so its headline is the 7-day sum — not the
  // all-time total, which would repeat the label/reality gap this card otherwise fixes.
  const trendTotal = trendDays.reduce((sum, d) => sum + d.count, 0);

  const liveForms = forms.filter((f) => f.status === 'active').length;
  const openCount = submissions.filter((s) => s.status === 'open').length;
  const resolvedCount = submissions.filter((s) => s.status === 'resolved').length;
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
            <div className="val">{trendTotal}</div>
          </div>
          <div className="ex-spark">
            {trendDays.map((d) => (
              <i
                key={d.key}
                className={d.isToday ? 'hi' : undefined}
                style={{
                  height: `${String((d.count / trendMax) * 100)}%`,
                  minHeight: d.count === 0 ? 0 : undefined,
                }}
                title={t('home.trend.dayTooltip', { date: d.key, count: String(d.count) })}
              />
            ))}
          </div>
          <div className="ex-sparkx">
            {trendDays.map((d) => (
              <span key={d.key}>{weekdays[d.weekdayIndex]}</span>
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
