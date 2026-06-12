/**
 * Choice-field management UI — shared non-visual layer (builder spec v2.0).
 *
 * Single source of truth for the display-style catalog (STYLES), the editor-local choice state
 * shape, the count-rule text, and a11y helpers. Mirrors backend NeneContact\ContactForm\ChoiceStyle.
 * Visual pieces (LivePreview / GalleryMini) live in choice-preview.tsx.
 */
import type { KeyboardEvent } from 'react';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type {
  ChoiceCardLayout,
  ChoiceCountRule,
  ChoiceOtherConfig,
  ChoiceRatio,
  ChoiceStyleId,
} from '@/entities/contact-form';

export type Translate = (key: MessageKey, params?: Record<string, string>) => string;

export type ChoiceLogic = 'single' | 'multiple';

export interface StyleDef {
  id: ChoiceStyleId;
  logic: ChoiceLogic;
  labelKey: MessageKey;
  hintKey: MessageKey;
  icon: 'list' | 'chevDown' | 'filter' | 'check';
}

// The display-style catalog. Three single, three multiple. The style internalizes the logic.
export const STYLES: readonly StyleDef[] = [
  {
    id: 'radio',
    logic: 'single',
    labelKey: 'choice.style.radio.label',
    hintKey: 'choice.style.radio.hint',
    icon: 'list',
  },
  {
    id: 'dropdown',
    logic: 'single',
    labelKey: 'choice.style.dropdown.label',
    hintKey: 'choice.style.dropdown.hint',
    icon: 'chevDown',
  },
  {
    id: 'segment',
    logic: 'single',
    labelKey: 'choice.style.segment.label',
    hintKey: 'choice.style.segment.hint',
    icon: 'filter',
  },
  {
    id: 'checkbox',
    logic: 'multiple',
    labelKey: 'choice.style.checkbox.label',
    hintKey: 'choice.style.checkbox.hint',
    icon: 'check',
  },
  {
    id: 'tags',
    logic: 'multiple',
    labelKey: 'choice.style.tags.label',
    hintKey: 'choice.style.tags.hint',
    icon: 'list',
  },
  {
    id: 'chips',
    logic: 'multiple',
    labelKey: 'choice.style.chips.label',
    hintKey: 'choice.style.chips.hint',
    icon: 'filter',
  },
];

export const STYLE_BY_ID: Record<ChoiceStyleId, StyleDef> = Object.fromEntries(
  STYLES.map((s) => [s.id, s]),
) as Record<ChoiceStyleId, StyleDef>;

export function logicOf(style: ChoiceStyleId): ChoiceLogic {
  return STYLE_BY_ID[style].logic;
}

// Picture choice (image cards) is only meaningful for the vertical list styles.
export function styleAllowsImage(style: ChoiceStyleId): boolean {
  return style === 'radio' || style === 'checkbox';
}

// Makes a non-button element (whose visual styling must stay a div/span per the design CSS)
// keyboard-operable: adds role=button, tab focus, and Enter/Space activation (jsx-a11y).
export function pressable(onClick: () => void): {
  role: 'button';
  tabIndex: 0;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
} {
  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}

// Editor-local option (single-locale label/desc; id === persisted option value).
export interface ChoiceEditorOption {
  id: string;
  label: string;
  desc?: string;
  img?: boolean;
}

// Editor-local choice state — the single source the canvas, panel, gallery and respondent
// preview all read from. Serialized to/from DraftField at the integration boundary.
export interface ChoiceState {
  style: ChoiceStyleId;
  options: ChoiceEditorOption[];
  defaults: string[];
  required: boolean;
  other: boolean;
  otherCfg: ChoiceOtherConfig;
  countRule: ChoiceCountRule;
  imgMode: boolean;
  cardLayout: ChoiceCardLayout;
  cols: 2 | 3;
  ratio: ChoiceRatio;
}

// Human-readable selection-count rule, e.g. "2〜3個を選択".
export function countRuleText(cr: ChoiceCountRule, t: Translate): string {
  const lo = cr.minOn ? cr.min : null;
  const hi = cr.maxOn ? cr.max : null;
  if (lo != null && hi != null) {
    return lo === hi
      ? t('choice.count.exact', { n: String(lo) })
      : t('choice.count.range', { lo: String(lo), hi: String(hi) });
  }
  if (lo != null) return t('choice.count.min', { n: String(lo) });
  if (hi != null) return t('choice.count.max', { n: String(hi) });
  return '';
}
