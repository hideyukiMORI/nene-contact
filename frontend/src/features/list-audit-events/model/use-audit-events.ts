import { useState } from 'react';
import { useAuditEventsQuery } from '@/entities/audit-event';
import type { AuditEvent } from '@/entities/audit-event';
import type { AppError } from '@/shared/api/errors';

export const PAGE_SIZE = 20;

export type AuditPeriod = 'all' | '24h' | '7d' | '30d' | 'custom';

export const AUDIT_PERIODS: AuditPeriod[] = ['all', '24h', '7d', '30d', 'custom'];

function isoMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// A preset period resolves to a from/to date range; custom uses the explicit inputs.
function rangeFor(period: AuditPeriod, from: string, to: string): { from: string; to: string } {
  switch (period) {
    case '24h':
      return { from: isoMinusDays(1), to: '' };
    case '7d':
      return { from: isoMinusDays(7), to: '' };
    case '30d':
      return { from: isoMinusDays(30), to: '' };
    case 'custom':
      return { from, to };
    default:
      return { from: '', to: '' };
  }
}

export interface UseAuditEvents {
  events: AuditEvent[];
  total: number;
  matched: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  q: string;
  setQ: (q: string) => void;
  period: AuditPeriod;
  setPeriod: (p: AuditPeriod) => void;
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useAuditEvents(): UseAuditEvents {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState<AuditPeriod>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const range = rangeFor(period, from, to);
  const query = useAuditEventsQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    q,
    from: range.from,
    to: range.to,
  });
  // Unfiltered grand total (cached) so the header can show "matched / of total".
  const grand = useAuditEventsQuery({ limit: 1, offset: 0 });

  const matched = query.data?.total ?? 0;
  const total = grand.data?.total ?? matched;
  const pageCount = Math.max(1, Math.ceil(matched / PAGE_SIZE));

  // Any filter change resets to the first page so the offset stays in range.
  const reset = (): void => {
    setPage(0);
  };

  return {
    events: query.data?.items ?? [],
    total,
    matched,
    page: Math.min(page, pageCount - 1),
    pageCount,
    setPage,
    q,
    setQ: (next) => {
      setQ(next);
      reset();
    },
    period,
    setPeriod: (next) => {
      setPeriod(next);
      reset();
    },
    from,
    to,
    setFrom: (v) => {
      setFrom(v);
      reset();
    },
    setTo: (v) => {
      setTo(v);
      reset();
    },
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
