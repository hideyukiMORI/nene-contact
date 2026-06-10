import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import { ContactFormList, useContactForms } from '@/features/list-contact-forms';
import type { FormStatusFilter } from '@/features/list-contact-forms';

const TABS: { key: FormStatusFilter; labelKey: MessageKey }[] = [
  { key: 'all', labelKey: 'contactForms.tabs.all' },
  { key: 'active', labelKey: 'contactForms.tabs.active' },
  { key: 'disabled', labelKey: 'contactForms.tabs.disabled' },
];

export function ContactFormsPage(): ReactNode {
  const { t } = useI18n();
  const { forms } = useContactForms();
  const [tab, setTab] = useState<FormStatusFilter>('all');
  const [query, setQuery] = useState('');

  const tabCount = (key: FormStatusFilter): number =>
    key === 'all' ? forms.length : forms.filter((f) => f.status === key).length;

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('contactForms.title')}</h1>
        <span className="c">{t('contactForms.count', { n: String(forms.length) })}</span>
        <span className="sp" />
        <Link className="ex-btn" to="/contact-forms/new">
          <Icon name="plus" size={14} />
          {t('contactForms.new')}
        </Link>
      </div>

      <div className="fm-toolbar">
        <div className="fm-tabs">
          {TABS.map((it) => (
            <button
              key={it.key}
              type="button"
              className={'fm-tab' + (tab === it.key ? ' on' : '')}
              onClick={() => {
                setTab(it.key);
              }}
            >
              {t(it.labelKey)}
              <span className="n">{tabCount(it.key)}</span>
            </button>
          ))}
        </div>
        <div className="fm-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            value={query}
            placeholder={t('contactForms.searchPh')}
            aria-label={t('contactForms.searchPh')}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>
      </div>

      <ContactFormList statusFilter={tab} query={query} />
    </div>
  );
}
