import { useChangePasswordMutation } from '@/entities/auth';
import type { AppError } from '@/shared/api/errors';
import type { PasswordChange } from '@/entities/auth';

interface UseChangePassword {
  changePassword: (input: PasswordChange) => Promise<unknown>;
  isPending: boolean;
  isSuccess: boolean;
  error: AppError | null;
  reset: () => void;
}

export function useChangePassword(): UseChangePassword {
  const mutation = useChangePasswordMutation();
  return {
    changePassword: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
