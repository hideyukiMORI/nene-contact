import { useState } from 'react';
import { useAuditEventsQuery } from '@/entities/audit-event';
import type { AuditEvent } from '@/entities/audit-event';
import type { AppError } from '@/shared/api/errors';

const PAGE_SIZE = 30;

export interface UseAuditEvents {
  events: AuditEvent[];
  total: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useAuditEvents(): UseAuditEvents {
  const [page, setPage] = useState(0);
  const query = useAuditEventsQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });

  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    events: query.data?.items ?? [],
    total,
    page,
    pageCount,
    setPage,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
