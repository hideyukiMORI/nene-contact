import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { ChangePasswordRequestDto, LoginResponseDto } from '@/entities/auth/api-types';
import { toSession } from '@/entities/auth/mapper';
import type { Credentials, PasswordChange, Session } from '@/entities/auth/model';

export function useLoginMutation(): UseMutationResult<Session, AppError, Credentials> {
  return useMutation<Session, AppError, Credentials>({
    mutationFn: async (credentials) => {
      const dto = await apiClient.post<LoginResponseDto>('/admin/auth/login', credentials);
      return toSession(dto);
    },
  });
}

export function useChangePasswordMutation(): UseMutationResult<unknown, AppError, PasswordChange> {
  return useMutation<unknown, AppError, PasswordChange>({
    mutationFn: ({ currentPassword, newPassword }) => {
      const body: ChangePasswordRequestDto = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      return apiClient.post('/admin/account/password', body);
    },
  });
}
