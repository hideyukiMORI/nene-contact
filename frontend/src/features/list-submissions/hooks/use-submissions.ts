import { useSearchParams } from 'react-router-dom';
import { useSubmissionsQuery } from '@/entities/submission';
import type { AppError } from '@/shared/api/errors';
import type { Submission } from '@/entities/submission';

const PAGE_SIZE = 20;

interface UseSubmissions {
  submissions: Submission[];
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
  page: number;
  pageCount: number;
  goTo: (page: number) => void;
}

export function useSubmissions(): UseSubmissions {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(raw) || raw < 1 ? 1 : raw;
  const offset = (page - 1) * PAGE_SIZE;

  const query = useSubmissionsQuery({ limit: PAGE_SIZE, offset });
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    submissions: query.data?.items ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    page,
    pageCount,
    goTo: (next: number) => {
      setSearchParams((prev) => {
        prev.set('page', String(next));
        return prev;
      });
    },
  };
}
