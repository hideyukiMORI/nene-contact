import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { UserDto } from '@/entities/user/api-types';
import { toCreateUserDto, toUpdateUserDto, toUser } from '@/entities/user/mapper';
import type { CreateUserInput, UpdateUserInput, User } from '@/entities/user/model';
import { userKeys } from '@/entities/user/query-keys';

export function useCreateUserMutation(): UseMutationResult<User, AppError, CreateUserInput> {
  const queryClient = useQueryClient();
  return useMutation<User, AppError, CreateUserInput>({
    mutationFn: async (input) =>
      toUser(await apiClient.post<UserDto>('/admin/users', toCreateUserDto(input))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUserMutation(): UseMutationResult<
  User,
  AppError,
  { id: number; input: UpdateUserInput }
> {
  const queryClient = useQueryClient();
  return useMutation<User, AppError, { id: number; input: UpdateUserInput }>({
    mutationFn: async ({ id, input }) =>
      toUser(await apiClient.patch<UserDto>(`/admin/users/${String(id)}`, toUpdateUserDto(input))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
