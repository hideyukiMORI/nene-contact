import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { defaultChoiceConfig } from '@/entities/contact-form';
import { draftFieldToChoiceState } from '@/features/build-contact-form/lib/choice-bridge';
import { useChoiceField } from '@/features/build-contact-form/model/use-choice-field';

const seed = draftFieldToChoiceState(
  {
    id: 'f1',
    fieldType: 'select',
    name: 'country',
    label: { ja: '国' },
    description: '',
    placeholder: '',
    required: false,
    options: [{ value: 'old', label: { ja: '旧' } }],
    choice: defaultChoiceConfig(),
  },
  'ja',
);

describe('useChoiceField.importOptions (#316)', () => {
  it('preserves the Records value as the option id and resets defaults', () => {
    const { result } = renderHook(() => useChoiceField(seed, 'k', () => undefined));

    act(() => {
      result.current.importOptions([
        { value: 'JP', label: '日本' },
        { value: 'US', label: 'アメリカ' },
      ]);
    });

    // ids are the Records values (not freshly generated) — keeps submitted values aligned with Records.
    expect(result.current.options.map((o) => o.id)).toEqual(['JP', 'US']);
    expect(result.current.options.map((o) => o.label)).toEqual(['日本', 'アメリカ']);
    expect(result.current.defaults).toEqual([]);
  });

  it('ignores an empty import (keeps existing options)', () => {
    const { result } = renderHook(() => useChoiceField(seed, 'k2', () => undefined));

    act(() => {
      result.current.importOptions([]);
    });

    expect(result.current.options.map((o) => o.id)).toEqual(['old']);
  });
});
