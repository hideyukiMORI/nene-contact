import { defaultAppearance } from '@/entities/contact-form';
import type { Appearance, AppearanceFont, Density as DensityId } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type { IconName } from '@/shared/ui';

// Density → padding/gap/label spacing (spec §4C). Mirrors window.STUDIO.DENSITY.
export const DENSITY: Record<DensityId, { y: number; x: number; gap: number; mb: number }> = {
  compact: { y: 8, x: 11, gap: 10, mb: 5 },
  cozy: { y: 11, x: 13, gap: 14, mb: 6 },
  comfortable: { y: 14, x: 15, gap: 18, mb: 8 },
};

// Web-safe font stacks for the preview (the console also has Plus Jakarta / Spectral loaded).
export const FONT_STACK: Record<AppearanceFont, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  sans: '"Plus Jakarta Sans", "Noto Sans JP", sans-serif',
  serif: '"Spectral", "Noto Serif JP", Georgia, serif',
};

export interface MediaItem {
  id: string;
  labelKey: MessageKey;
  css: string;
}

// Mock gradient media library (placeholders for uploaded assets; real storage is a follow-up).
export const MEDIA: MediaItem[] = [
  {
    id: 'm-team',
    labelKey: 'studio.media.team',
    css: 'linear-gradient(120deg,#3b5168,#6f8aa6 60%,#b9c8d8)',
  },
  {
    id: 'm-office',
    labelKey: 'studio.media.office',
    css: 'linear-gradient(120deg,#c9d3de,#e7edf3 55%,#aeb9c6)',
  },
  {
    id: 'm-warm',
    labelKey: 'studio.media.warm',
    css: 'linear-gradient(125deg,#d9663f,#e69a6b 55%,#f0c9a6)',
  },
  {
    id: 'm-teal',
    labelKey: 'studio.media.teal',
    css: 'linear-gradient(125deg,#1f5b57,#2f8f86 60%,#7fc2ba)',
  },
  {
    id: 'm-desk',
    labelKey: 'studio.media.desk',
    css: 'linear-gradient(120deg,#7c6a58,#b39c83 55%,#e0d2bf)',
  },
  {
    id: 'm-dark',
    labelKey: 'studio.media.dark',
    css: 'linear-gradient(125deg,#1a2230,#2b3a4f 60%,#46607d)',
  },
];

export function mediaCss(id: string | null): string {
  const m = MEDIA.find((x) => x.id === id);
  return m ? m.css : 'none';
}

export interface PresetDef {
  id: string;
  nameKey: MessageKey;
  swatches: [string, string, string];
  patch: DeepPartial<Appearance>;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Curated themes (雛形); each merges over the defaults. Values mirror window.STUDIO.PRESETS.
export const PRESETS: PresetDef[] = [
  {
    id: 'nene',
    nameKey: 'studio.preset.nene',
    swatches: ['#dc5b34', '#ffffff', '#161a22'],
    patch: {},
  },
  {
    id: 'minimal',
    nameKey: 'studio.preset.minimal',
    swatches: ['#161a22', '#ffffff', '#e7e6e3'],
    patch: {
      colors: { accent: '#161a22', border: '#e7e6e3', inputBg: '#ffffff' },
      radius: { form: 4, input: 4, button: 4 },
      border: { width: 1, color: '#e7e6e3' },
      focus: { color: '#161a22', shape: 'solid', width: 2 },
      density: 'comfortable',
      button: { style: 'solid', pill: false },
      motion: { anim: 'fade', speed: 220 },
    },
  },
  {
    id: 'soft',
    nameKey: 'studio.preset.soft',
    swatches: ['#2f8f86', '#ffffff', '#f4f7f7'],
    patch: {
      colors: {
        accent: '#2f8f86',
        surface: '#ffffff',
        inputBg: '#f5f8f8',
        border: '#e6efee',
        text: '#1d2b2a',
        muted: '#5e7270',
      },
      radius: { form: 18, input: 12, button: 14 },
      border: { width: 1.5, color: '#e6efee' },
      focus: { color: '#2f8f86', shape: 'glow', width: 3 },
      density: 'comfortable',
      button: { style: 'soft', pill: true },
      motion: { anim: 'scale', speed: 360 },
    },
  },
  {
    id: 'dark',
    nameKey: 'studio.preset.dark',
    swatches: ['#dc5b34', '#18212e', '#e9eef4'],
    patch: {
      theme: 'dark',
      colors: {
        accent: '#dc5b34',
        surface: '#18212e',
        text: '#e9eef4',
        muted: '#9aa7b8',
        border: '#2b3848',
        inputBg: '#1e2835',
        buttonText: '#ffffff',
      },
      radius: { form: 14, input: 8, button: 8 },
      border: { width: 1.5, color: '#2b3848' },
      focus: { color: '#dc5b34', shape: 'ring', width: 3.5 },
    },
  },
  {
    id: 'corp',
    nameKey: 'studio.preset.corp',
    swatches: ['#2563eb', '#ffffff', '#e3e7ee'],
    patch: {
      colors: { accent: '#2563eb', border: '#e3e7ee', inputBg: '#ffffff' },
      radius: { form: 10, input: 6, button: 6 },
      border: { width: 1, color: '#e3e7ee' },
      focus: { color: '#2563eb', shape: 'ring', width: 3 },
      density: 'comfortable',
      button: { style: 'solid', pill: false },
      motion: { anim: 'slide', speed: 300 },
    },
  },
  {
    id: 'pop',
    nameKey: 'studio.preset.pop',
    swatches: ['#d6409f', '#fff7fc', '#fbe6f3'],
    patch: {
      colors: {
        accent: '#d6409f',
        surface: '#ffffff',
        inputBg: '#fdf2f9',
        border: '#f4d6e8',
        text: '#2a1622',
        muted: '#7c5a6e',
      },
      radius: { form: 20, input: 14, button: 999 },
      border: { width: 1.5, color: '#f4d6e8' },
      focus: { color: '#d6409f', shape: 'glow', width: 3 },
      density: 'cozy',
      button: { style: 'solid', pill: true },
      motion: { anim: 'scale', speed: 380 },
    },
  },
];

export interface GroupDef {
  id: string;
  labelKey: MessageKey;
  icon: IconName;
}

// Token groups shown in the rail (spec §3-2).
export const GROUPS: GroupDef[] = [
  { id: 'theme', labelKey: 'studio.group.theme', icon: 'sparkle' },
  { id: 'color', labelKey: 'studio.group.color', icon: 'bulb' },
  { id: 'shape', labelKey: 'studio.group.shape', icon: 'forms' },
  { id: 'header', labelKey: 'studio.group.header', icon: 'image' },
  { id: 'line', labelKey: 'studio.group.line', icon: 'edit' },
  { id: 'motion', labelKey: 'studio.group.motion', icon: 'play' },
  { id: 'type', labelKey: 'studio.group.type', icon: 'settings' },
];

// Theme-token paths; editing any of these detaches from a preset (preset → "custom").
const THEME_KEYS = [
  'colors',
  'radius',
  'border',
  'focus',
  'motion',
  'density',
  'button',
  'font',
  'fontH',
  'theme',
];

function clone(a: Appearance): Appearance {
  return structuredClone(a);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge(base: Appearance, patch: DeepPartial<Appearance>): Appearance {
  const out = clone(base) as unknown as Record<string, unknown>;
  for (const k in patch) {
    const pv = (patch as Record<string, unknown>)[k];
    const bv = out[k];
    out[k] = isPlainObject(pv) && isPlainObject(bv) ? { ...bv, ...pv } : pv;
  }
  return out as unknown as Appearance;
}

export function applyPreset(id: string): Appearance {
  const p = PRESETS.find((x) => x.id === id);
  return deepMerge(deepMerge(defaultAppearance(), p?.patch ?? {}), { preset: p?.id ?? 'nene' });
}

// Immutable set at a token path (e.g. ['colors','accent']); detaches the preset for theme keys.
export function setIn(a: Appearance, path: string[], value: unknown): Appearance {
  const out = clone(a) as unknown as Record<string, unknown>;
  let cursor = out;
  for (let i = 0; i < path.length - 1; i++) {
    cursor = cursor[path[i] as string] as Record<string, unknown>;
  }
  cursor[path[path.length - 1] as string] = value;
  if (path.length > 0 && THEME_KEYS.includes(path[0] as string)) {
    out.preset = 'custom';
  }
  return out as unknown as Appearance;
}
