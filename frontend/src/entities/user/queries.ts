import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { UserListDto } from '@/entities/user/api-types';
import { toUsers } from '@/entities/user/mapper';
import type { User } from '@/entities/user/model';
import { userKeys } from '@/entities/user/query-keys';

export function useUsersQuery(): UseQueryResult<User[], AppError> {
  return useQuery<User[], AppError>({
    queryKey: userKeys.list(),
    queryFn: async () => toUsers(await apiClient.get<UserListDto>('/admin/users')),
  });
}
