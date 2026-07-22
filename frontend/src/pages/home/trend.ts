// Client-side aggregation for the dashboard's 7-day receipts sparkline. Kept pure (takes
// `now` as an argument) so it is unit-testable without mocking the clock in the component.

const DAYS = 7;

export interface TrendDay {
  /** Local YYYY-MM-DD for the day's bucket. */
  key: string;
  /** Submissions received that day, within the fetched window. */
  count: number;
  /** Monday-first weekday index (0 = Mon … 6 = Sun), to index `home.weekdays`. */
  weekdayIndex: number;
  /** The last bar in the window — today, which the chart emphasizes. */
  isToday: boolean;
}

function toLocalYmd(d: Date): string {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The inclusive `from` date (local YYYY-MM-DD) for the 7-day window ending today. */
export function sevenDayFrom(now: Date): string {
  const start = new Date(now);
  start.setDate(start.getDate() - (DAYS - 1));
  return toLocalYmd(start);
}

/**
 * Bucket submissions into the 7 days ending today. The received date is read from
 * `submittedAt` (its date part matches the server's `created_at`); rows outside the window
 * are ignored. Empty days keep a count of 0.
 */
export function bucketSevenDays(
  submissions: readonly { submittedAt: string | null }[],
  now: Date,
): TrendDay[] {
  const days: TrendDay[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    const key = toLocalYmd(d);
    indexByKey.set(key, i);
    days.push({
      key,
      count: 0,
      weekdayIndex: (d.getDay() + 6) % 7,
      isToday: i === DAYS - 1,
    });
  }

  for (const s of submissions) {
    const key = s.submittedAt?.slice(0, 10);
    if (key === undefined) continue;
    const i = indexByKey.get(key);
    const day = i !== undefined ? days[i] : undefined;
    if (day !== undefined) day.count += 1;
  }

  return days;
}
