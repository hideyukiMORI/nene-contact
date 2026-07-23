import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useGuideTour } from '@/features/guide-tour';

// Static usage guide reachable from the topbar help button. Sections mirror the sidebar
// navigation so an operator can map "what is this screen" to "what can I do here". Strings
// live in the message catalog (ADR 0011); headings reuse the nav labels to stay in sync.
// Split into "basics" (everyone) and "power users" so first-timers aren't buried in the
// org/token/audit screens they rarely touch (usability testing, 3 personas).
interface HelpSection {
  key: string;
  icon: IconName;
  titleKey: MessageKey;
  bodyKey: MessageKey;
}

const BASIC: HelpSection[] = [
  {
    key: 'dashboard',
    icon: 'dashboard',
    titleKey: 'nav.dashboard',
    bodyKey: 'help.dashboard.body',
  },
  { key: 'forms', icon: 'forms', titleKey: 'nav.forms', bodyKey: 'help.forms.body' },
  { key: 'inbox', icon: 'inbox', titleKey: 'nav.inbox', bodyKey: 'help.inbox.body' },
];

const ADVANCED: HelpSection[] = [
  { key: 'users', icon: 'users', titleKey: 'nav.users', bodyKey: 'help.users.body' },
  { key: 'org', icon: 'settings', titleKey: 'nav.orgSettings', bodyKey: 'help.org.body' },
  { key: 'tokens', icon: 'link', titleKey: 'nav.serviceTokens', bodyKey: 'help.tokens.body' },
  { key: 'audit', icon: 'shield', titleKey: 'nav.auditLog', bodyKey: 'help.audit.body' },
];

function SectionGrid({ sections }: { sections: HelpSection[] }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="hlp-grid">
      {sections.map((section) => (
        <section key={section.key} className="fm-card ex-card-pad hlp-card">
          <div className="ex-cardhead">
            <Icon name={section.icon} size={17} />
            <h3>{t(section.titleKey)}</h3>
          </div>
          <p className="hlp-text">{t(section.bodyKey)}</p>
        </section>
      ))}
    </div>
  );
}

export function HelpPage(): ReactNode {
  const { t } = useI18n();
  const { startTour } = useGuideTour();

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('help.title')}</h1>
        <span className="sp" />
        <button type="button" className="gt-btn" onClick={startTour}>
          <Icon name="play" size={14} />
          {t('guide.start')}
        </button>
      </div>
      <p className="ac-lead">{t('help.lead')}</p>

      <h2 className="hlp-group">{t('help.group.basic')}</h2>
      <SectionGrid sections={BASIC} />

      <h2 className="hlp-group">{t('help.group.advanced')}</h2>
      <SectionGrid sections={ADVANCED} />

      <section className="fm-card ex-card-pad hlp-card">
        <div className="ex-cardhead">
          <Icon name="shield" size={17} />
          <h3>{t('help.compliance.title')}</h3>
        </div>
        <p className="hlp-text">{t('help.compliance.body')}</p>
      </section>

      <section className="fm-card ex-card-pad hlp-card">
        <div className="ex-cardhead">
          <Icon name="life" size={17} />
          <h3>{t('help.contact.title')}</h3>
        </div>
        <p className="hlp-text">{t('help.contact.body')}</p>
      </section>
    </div>
  );
}
