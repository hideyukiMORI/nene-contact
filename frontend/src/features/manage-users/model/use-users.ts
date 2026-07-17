import { useCreateUserMutation, useUpdateUserMutation, useUsersQuery } from '@/entities/user';
import type { AppError } from '@/shared/api/errors';
import type { CreateUserInput, UpdateUserInput, User } from '@/entities/user';

interface UseUsers {
  users: User[];
  isLoading: boolean;
  error: AppError | null;
  createUser: (input: CreateUserInput) => Promise<User>;
  isCreating: boolean;
  createError: AppError | null;
  updateUser: (id: number, input: UpdateUserInput) => void;
  updateError: AppError | null;
}

export function useUsers(): UseUsers {
  const query = useUsersQuery();
  const create = useCreateUserMutation();
  const update = useUpdateUserMutation();

  return {
    users: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    createUser: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,
    updateUser: (id, input) => {
      update.mutate({ id, input });
    },
    updateError: update.error,
  };
}
