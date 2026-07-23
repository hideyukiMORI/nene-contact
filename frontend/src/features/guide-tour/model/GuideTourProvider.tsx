import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { GuideTour, type GuideStep } from '@/features/guide-tour/ui/GuideTour';

// A tight value flow rather than a screen-by-screen map: ① build → ② read incoming → ③ help.
// Selectors match the `data-tour` markers on the sidebar nav items and the topbar help button;
// the welcome step is centered and target-less. The org-management screens stay discoverable in
// the nav but are left out of the first-run tour (they overwhelmed first-time users in testing).
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
    selector: '[data-tour="help"]',
    titleKey: 'guide.help.title',
    bodyKey: 'guide.help.body',
    placement: 'bottom',
  },
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
