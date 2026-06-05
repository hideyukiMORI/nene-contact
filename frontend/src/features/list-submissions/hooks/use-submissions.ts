import { useSubmissionsQuery } from '@/entities/submission';
import type { AppError } from '@/shared/api/errors';
import type { Submission } from '@/entities/submission';

// The list API has no status/form/search filtering, so the inbox filters client-side
// over a fetched window. Volumes beyond this cap need server-side filtering (backend).
const WINDOW = 200;

interface UseSubmissions {
  submissions: Submission[];
  total: number;
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useSubmissions(): UseSubmissions {
  const query = useSubmissionsQuery({ limit: WINDOW, offset: 0 });

  return {
    submissions: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isPending,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
