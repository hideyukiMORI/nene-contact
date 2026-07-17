import { useContactFormsQuery } from '@/entities/contact-form';
import type { AppError } from '@/shared/api/errors';
import type { ContactForm } from '@/entities/contact-form';

interface UseContactForms {
  forms: ContactForm[];
  isLoading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useContactForms(): UseContactForms {
  const query = useContactFormsQuery();
  return {
    forms: query.data?.items ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
