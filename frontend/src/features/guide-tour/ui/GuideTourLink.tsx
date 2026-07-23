import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { useGuideTour } from '@/features/guide-tour/model/GuideTourProvider';

// Sidebar footer launcher — replaces the previously inert `ex-navfoot` text with a button
// that opens the guided tour.
export function GuideTourLink(): ReactNode {
  const { t } = useI18n();
  const { startTour } = useGuideTour();

  return (
    <button type="button" className="ex-navfoot" onClick={startTour}>
      {t('nav.guideTour')}
    </button>
  );
}
