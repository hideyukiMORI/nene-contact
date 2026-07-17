import { useLoginMutation } from '@/entities/auth';
import type { AppError } from '@/shared/api/errors';
import type { Credentials, Session } from '@/entities/auth';

interface UseLogin {
  login: (credentials: Credentials) => Promise<Session>;
  isPending: boolean;
  error: AppError | null;
}

export function useLogin(): UseLogin {
  const mutation = useLoginMutation();
  return {
    login: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
