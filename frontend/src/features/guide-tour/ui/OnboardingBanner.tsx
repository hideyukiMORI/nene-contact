import { useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useGuideTour } from '@/features/guide-tour/model/GuideTourProvider';

const STORAGE_KEY = 'nene-onboarding-dismissed';

// First-run nudge on the dashboard toward the guided tour — usability testers never noticed the
// sidebar-footer launcher. Shows once; dismissing it (or starting the tour) hides it for good.
export function OnboardingBanner(): ReactNode {
  const { t } = useI18n();
  const { startTour } = useGuideTour();
  const [dismissed, setDismissed] = useState(
    () => globalThis.localStorage.getItem(STORAGE_KEY) === '1',
  );

  if (dismissed) {
    return null;
  }

  const dismiss = (): void => {
    globalThis.localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="ob-banner">
      <span className="ob-icon">
        <Icon name="rocket" size={18} />
      </span>
      <div className="ob-text">
        <div className="ob-title">{t('onboarding.title')}</div>
        <div className="ob-body">{t('onboarding.body')}</div>
      </div>
      <button
        type="button"
        className="ex-btn"
        onClick={() => {
          startTour();
          dismiss();
        }}
      >
        <Icon name="play" size={14} />
        {t('guide.start')}
      </button>
      <button type="button" className="ob-x" aria-label={t('common.close')} onClick={dismiss}>
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}
