import { describe, expect, it } from 'vitest';
import {
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABEL_KEY,
  fieldTypeLabelKey,
  PALETTE,
} from '@/features/build-contact-form/lib/field-types';
import { ja } from '@/shared/i18n/messages/ja';
import { en } from '@/shared/i18n/messages/en';

describe('field-type labels (#309)', () => {
  it('every field type resolves to a non-empty label in ja and en', () => {
    for (const [type, key] of Object.entries(FIELD_TYPE_LABEL_KEY)) {
      expect(ja[key], `ja label for ${type}`).toBeTruthy();
      expect(en[key], `en label for ${type}`).toBeTruthy();
    }
  });

  it('covers every palette type and every icon type (no empty type chip)', () => {
    for (const type of PALETTE) {
      expect(FIELD_TYPE_LABEL_KEY, `palette type ${type}`).toHaveProperty(type);
    }
    for (const type of Object.keys(FIELD_TYPE_ICON)) {
      expect(FIELD_TYPE_LABEL_KEY, `icon type ${type}`).toHaveProperty(type);
    }
  });

  it('maps phone to its own label (the #309 regression)', () => {
    expect(ja[fieldTypeLabelKey('phone')]).toBe('電話');
    expect(en[fieldTypeLabelKey('phone')]).toBe('Phone');
  });

  it('falls back to the text label for an unknown type', () => {
    expect(fieldTypeLabelKey('not-a-real-type')).toBe('builder.type.text');
  });
});
