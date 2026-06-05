import { Link, useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useContactFormsQuery } from '@/entities/contact-form';
import type { ContactForm } from '@/entities/contact-form';
import { useSubmissionsQuery } from '@/entities/submission';
import type { Submission, SubmissionStatus } from '@/entities/submission';
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

interface QuickAction {
  labelKey: MessageKey;
  to: string;
  icon: DashIconName;
}

const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: 'home.quick.createForm', to: '/contact-forms/new', icon: 'plus' },
  { labelKey: 'home.quick.openInbox', to: '/submissions', icon: 'inbox' },
  { labelKey: 'home.quick.manageForms', to: '/contact-forms', icon: 'forms' },
  { labelKey: 'home.quick.manageUsers', to: '/users', icon: 'users' },
];

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
  const needAttention = submissions.filter(
    (s) => s.status === 'open' || s.status === 'in_progress',
  );

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('home.recent.unknownForm', { id: String(id) });
  };

  const username = session.email.split('@')[0];

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

      <div className="stat-rail">
        {stats.map((stat) => (
          <div key={stat.labelKey} className={stat.accent === true ? 'sr-item-accent' : undefined}>
            <div className="sr-label">
              <DashIcon name={stat.icon} size={13} />
              {t(stat.labelKey)}
            </div>
            <div className="sr-val">{stat.value}</div>
            <div className="sr-sub">{t(stat.subKey)}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        <NeedsAttention
          items={needAttention}
          formName={formName}
          isError={submissionsQuery.isError}
        />
        <SideOps forms={forms} />
      </div>
    </div>
  );
}

function NeedsAttention({
  items,
  formName,
  isError,
}: {
  items: Submission[];
  formName: (id: number) => string;
  isError: boolean;
}): ReactNode {
  const { t } = useI18n();

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-ico">
          <DashIcon name="inbox" size={17} />
        </span>
        <h3>{t('home.attention.title')}</h3>
        {items.length > 0 ? <span className="chip">{items.length}</span> : null}
        <span className="spacer" />
        <Link className="link-btn" to="/submissions">
          {t('home.attention.openInbox')}
        </Link>
      </div>

      {isError ? (
        <div className="card-pad">
          <p className="faint">{t('home.attention.error')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty empty-pad">
          <div className="e-ico">
            <DashIcon name="check" size={24} />
          </div>
          <h3>{t('home.attention.emptyTitle')}</h3>
          <p>{t('home.attention.emptyBody')}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <tbody>
              {items.map((submission) => (
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
  );
}

function SideOps({ forms }: { forms: ContactForm[] }): ReactNode {
  const { t } = useI18n();

  return (
    <div className="dash-side">
      <div className="card">
        <div className="card-head">
          <span className="card-ico">
            <DashIcon name="sparkle" size={16} />
          </span>
          <h3>{t('home.quick.title')}</h3>
        </div>
        <div className="menu-list">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} className="menu-item" to={action.to}>
              <DashIcon name={action.icon} size={17} />
              {t(action.labelKey)}
              <span className="spacer" />
              <DashIcon name="chevRight" size={15} className="faint" />
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-ico">
            <DashIcon name="forms" size={16} />
          </span>
          <h3>{t('home.forms.title')}</h3>
          <span className="spacer" />
          <Link className="link-btn" to="/contact-forms">
            {t('home.forms.manage')}
          </Link>
        </div>

        {forms.length === 0 ? (
          <div className="card-pad">
            <p className="faint">{t('home.forms.empty')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td>
                      <Link className="cell-strong" to="/contact-forms">
                        {form.name}
                      </Link>
                    </td>
                    <td className="forms-status">
                      {form.status === 'active' ? (
                        <span className="chip">
                          <DashIcon name="check" size={12} />
                          {t('home.forms.live')}
                        </span>
                      ) : (
                        <span className="chip">{t('home.forms.disabled')}</span>
                      )}
                    </td>
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
