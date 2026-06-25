import { describe, expect, it } from 'vitest';
import { toRecordsOptions } from '@/entities/records';

describe('records mapper', () => {
  it('maps items to {value,label}', () => {
    expect(
      toRecordsOptions({
        source: 'countries',
        items: [
          { value: 'JP', label: '日本' },
          { value: 'US', label: 'アメリカ' },
        ],
      }),
    ).toEqual([
      { value: 'JP', label: '日本' },
      { value: 'US', label: 'アメリカ' },
    ]);
  });

  it('returns [] when items is missing', () => {
    expect(toRecordsOptions({})).toEqual([]);
  });
});
