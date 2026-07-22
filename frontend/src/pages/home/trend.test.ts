import { describe, expect, it } from 'vitest';
import { bucketSevenDays, sevenDayFrom } from '@/pages/home/trend';

// A fixed "today" (local): 2026-07-22 10:30.
const NOW = new Date(2026, 6, 22, 10, 30, 0);

describe('sevenDayFrom', () => {
  it('is six days before today (inclusive 7-day window)', () => {
    expect(sevenDayFrom(NOW)).toBe('2026-07-16');
  });
});

describe('bucketSevenDays', () => {
  it('returns 7 days ending today, with today last and empty by default', () => {
    const days = bucketSevenDays([], NOW);
    expect(days).toHaveLength(7);
    expect(days[0]?.key).toBe('2026-07-16');
    expect(days[6]?.key).toBe('2026-07-22');
    expect(days[6]?.isToday).toBe(true);
    expect(days.slice(0, 6).some((d) => d.isToday)).toBe(false);
    expect(days.every((d) => d.count === 0)).toBe(true);
  });

  it('counts submissions into their day bucket by the submittedAt date', () => {
    const days = bucketSevenDays(
      [
        { submittedAt: '2026-07-22 09:00:00' },
        { submittedAt: '2026-07-22 23:59:59' },
        { submittedAt: '2026-07-20 12:00:00' },
      ],
      NOW,
    );
    expect(days[6]?.count).toBe(2); // today
    expect(days[5]?.count).toBe(0); // 2026-07-21
    expect(days[4]?.count).toBe(1); // 2026-07-20
  });

  it('ignores rows outside the window and null dates', () => {
    const days = bucketSevenDays(
      [
        { submittedAt: '2026-07-15 09:00:00' }, // the day before the window
        { submittedAt: '2026-08-01 09:00:00' }, // in the future
        { submittedAt: null },
      ],
      NOW,
    );
    expect(days.every((d) => d.count === 0)).toBe(true);
  });

  it('uses a Monday-first weekday index aligned to home.weekdays', () => {
    const days = bucketSevenDays([], NOW);
    for (const d of days) {
      const expected = (new Date(`${d.key}T00:00:00`).getDay() + 6) % 7;
      expect(d.weekdayIndex).toBe(expected);
    }
  });
});
