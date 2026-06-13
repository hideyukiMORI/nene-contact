import type { CSSProperties } from 'react';
import type { Appearance } from '@/entities/contact-form';
import { DENSITY, FONT_STACK } from '@/features/appearance-studio/model/studio-model';

// appearance → the --pv-* custom properties the preview is themed by (spec §6). Mirrors
// window.STUDIO.pvVars. Returned as a CSSProperties (custom props cast through a record).
export function pvVars(a: Appearance): CSSProperties {
  const d = DENSITY[a.density];
  const vars: Record<string, string> = {
    '--pv-accent': a.colors.accent,
    '--pv-surface': a.colors.surface,
    '--pv-text': a.colors.text,
    '--pv-muted': a.colors.muted,
    '--pv-border': a.colors.border,
    '--pv-input-bg': a.colors.inputBg,
    '--pv-error': a.colors.error,
    '--pv-btn-text': a.colors.buttonText,
    '--pv-r-form': `${String(a.radius.form)}px`,
    '--pv-r-input': `${String(a.radius.input)}px`,
    '--pv-r-btn': `${String(a.button.pill ? 999 : a.radius.button)}px`,
    '--pv-bw': `${String(a.border.width)}px`,
    '--pv-bstyle': a.border.style,
    '--pv-bcolor': a.border.color,
    '--pv-focus': a.focus.color,
    '--pv-focus-w': `${String(a.focus.width)}px`,
    '--pv-font': FONT_STACK[a.font],
    '--pv-font-h': FONT_STACK[a.fontH],
    '--pv-gap': `${String(d.gap)}px`,
    '--pv-fpad': `${String(d.y)}px ${String(d.x)}px`,
    '--pv-fpad-y': `${String(d.y)}px`,
    '--pv-label-mb': `${String(d.mb)}px`,
    '--pv-modal-w': `${String(a.modal.width)}px`,
    '--pv-backdrop': String(a.modal.backdrop),
    '--pv-speed': `${String(a.motion.speed)}ms`,
    '--pv-hero-h': `${String(a.hero.height)}px`,
    '--pv-hero-inset': `${String(a.hero.inset)}px`,
  };
  return vars;
}
