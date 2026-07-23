import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';

// One tour step. `selector` targets an on-screen element to spotlight; omit it (or use
// placement 'center') for a centered card with no target. Copy is in the catalog (ADR 0011).
export interface GuideStep {
  selector?: string;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  placement?: 'right' | 'bottom' | 'center';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const HOLE_PAD = 6;
const TIP_WIDTH = 300;

function measure(selector: string | undefined): Rect | null {
  if (selector === undefined) {
    return null;
  }
  const el = document.querySelector(selector);
  if (el === null) {
    return null;
  }
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) {
    return null;
  }
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// Presentational spotlight overlay: dims the app, cuts a hole around the current step's
// target, and floats a tooltip beside it. The provider owns open/close and the step list.
export function GuideTour({
  steps,
  onClose,
}: {
  steps: GuideStep[];
  onClose: () => void;
}): ReactNode {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[index];

  const sync = useCallback(() => {
    setRect(measure(step?.selector));
  }, [step]);

  // Measuring the target's on-screen rect must happen after the DOM is laid out, so the
  // setState here is intentional (there is no render-time value to derive it from).
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync();
  }, [sync]);

  useEffect(() => {
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [sync]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (step === undefined) {
    return null;
  }

  const isLast = index === steps.length - 1;
  const back = (): void => {
    setIndex((i) => Math.max(0, i - 1));
  };
  const next = (): void => {
    if (isLast) {
      onClose();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const placement = step.placement ?? (rect !== null ? 'bottom' : 'center');

  let tipTop: number;
  let tipLeft: number;
  if (rect === null || placement === 'center') {
    tipTop = vh / 2 - 120;
    tipLeft = vw / 2 - TIP_WIDTH / 2;
  } else if (placement === 'right') {
    tipTop = rect.top;
    tipLeft = rect.left + rect.width + 16;
  } else {
    tipTop = rect.top + rect.height + 14;
    tipLeft = rect.left;
  }
  tipLeft = Math.min(Math.max(12, tipLeft), vw - TIP_WIDTH - 12);
  tipTop = Math.min(Math.max(12, tipTop), vh - 210);

  const holeStyle: CSSProperties =
    rect !== null
      ? {
          top: rect.top - HOLE_PAD,
          left: rect.left - HOLE_PAD,
          width: rect.width + HOLE_PAD * 2,
          height: rect.height + HOLE_PAD * 2,
        }
      : {};

  return (
    <div className="gt-root" role="dialog" aria-modal="true" aria-label={t(step.titleKey)}>
      {rect !== null ? <div className="gt-hole" style={holeStyle} /> : <div className="gt-dim" />}
      <div className="gt-tip" style={{ top: tipTop, left: tipLeft, width: TIP_WIDTH }}>
        <div className="gt-step">
          {t('guide.step', { current: String(index + 1), total: String(steps.length) })}
        </div>
        <h3 className="gt-title">{t(step.titleKey)}</h3>
        <p className="gt-body">{t(step.bodyKey)}</p>
        <div className="gt-actions">
          {!isLast ? (
            <button type="button" className="gt-skip" onClick={onClose}>
              {t('guide.skip')}
            </button>
          ) : null}
          <span className="gt-spacer" />
          {index > 0 ? (
            <button type="button" className="gt-btn ghost" onClick={back}>
              {t('guide.back')}
            </button>
          ) : null}
          <button type="button" className="gt-btn" onClick={next}>
            {isLast ? t('guide.done') : t('guide.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
