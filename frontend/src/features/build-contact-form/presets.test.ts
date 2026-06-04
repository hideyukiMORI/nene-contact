import { describe, expect, it } from 'vitest';
import { FORM_PRESETS } from '@/features/build-contact-form/presets';

describe('form presets', () => {
  it('exposes unique preset ids including a blank option', () => {
    const ids = FORM_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('blank');
  });

  it('blank preset has no fields and no consent', () => {
    const blank = FORM_PRESETS.find((p) => p.id === 'blank')?.build();
    expect(blank?.fields).toEqual([]);
    expect(blank?.consentRequired).toBe(false);
  });

  it.each(FORM_PRESETS.filter((p) => p.id !== 'blank').map((p) => [p.id, p] as const))(
    'preset "%s" is valid and compliant by default',
    (_id, preset) => {
      const draft = preset.build();

      // Unique, non-empty field names.
      const names = draft.fields.map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
      expect(names.every((n) => n.length > 0)).toBe(true);

      // A honeypot is always included (ADR 0010).
      expect(draft.fields.some((f) => f.fieldType === 'honeypot')).toBe(true);

      // Collects personal data → consent ON with a default-locale label (charter §3).
      expect(draft.consentRequired).toBe(true);
      expect((draft.consentLabel?.[draft.defaultLocale] ?? '').length).toBeGreaterThan(0);

      // Non-honeypot fields carry a default-locale label; select fields have options.
      for (const f of draft.fields) {
        if (f.fieldType === 'honeypot') continue;
        expect((f.label[draft.defaultLocale] ?? '').length).toBeGreaterThan(0);
        if (f.fieldType === 'select') {
          expect(f.options !== null && f.options.length > 0).toBe(true);
        }
      }
    },
  );

  it('produces fresh field ids on each build (no shared references)', () => {
    const a = FORM_PRESETS.find((p) => p.id === 'contact')?.build();
    const b = FORM_PRESETS.find((p) => p.id === 'contact')?.build();
    const aIds = a?.fields.map((f) => f.id) ?? [];
    const bIds = b?.fields.map((f) => f.id) ?? [];
    expect(aIds.some((id) => bIds.includes(id))).toBe(false);
  });
});
