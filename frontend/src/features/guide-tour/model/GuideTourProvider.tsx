import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { GuideTour, type GuideStep } from '@/features/guide-tour/ui/GuideTour';

// The tour walks the primary console areas. Selectors match the `data-tour` markers placed on
// the sidebar nav items and the topbar help button; welcome/finish are centered, target-less.
const STEPS: GuideStep[] = [
  { titleKey: 'guide.welcome.title', bodyKey: 'guide.welcome.body', placement: 'center' },
  {
    selector: '[data-tour="forms"]',
    titleKey: 'guide.forms.title',
    bodyKey: 'guide.forms.body',
    placement: 'right',
  },
  {
    selector: '[data-tour="inbox"]',
    titleKey: 'guide.inbox.title',
    bodyKey: 'guide.inbox.body',
    placement: 'right',
  },
  {
    selector: '[data-tour="manage"]',
    titleKey: 'guide.manage.title',
    bodyKey: 'guide.manage.body',
    placement: 'right',
  },
  {
    selector: '[data-tour="help"]',
    titleKey: 'guide.help.title',
    bodyKey: 'guide.help.body',
    placement: 'bottom',
  },
  { titleKey: 'guide.finish.title', bodyKey: 'guide.finish.body', placement: 'center' },
];

interface GuideTourValue {
  startTour: () => void;
}

// Default is a no-op so a consumer rendered outside the provider (e.g. an isolated unit test)
// degrades to an inert launcher rather than throwing.
const GuideTourContext = createContext<GuideTourValue>({ startTour: () => undefined });

// eslint-disable-next-line react-refresh/only-export-components
export function useGuideTour(): GuideTourValue {
  return useContext(GuideTourContext);
}

export function GuideTourProvider({ children }: { children: ReactNode }): ReactNode {
  const [open, setOpen] = useState(false);
  const startTour = useCallback(() => {
    setOpen(true);
  }, []);
  const value = useMemo<GuideTourValue>(() => ({ startTour }), [startTour]);

  return (
    <GuideTourContext.Provider value={value}>
      {children}
      {open ? (
        <GuideTour
          steps={STEPS}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </GuideTourContext.Provider>
  );
}
