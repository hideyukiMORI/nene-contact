import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { OrganizationSettingsDto } from '@/entities/organization/api-types';
import { toOrganizationSettings } from '@/entities/organization/mapper';
import type { OrganizationSettings } from '@/entities/organization/model';
import { organizationKeys } from '@/entities/organization/query-keys';

export function useOrganizationSettingsQuery(): UseQueryResult<OrganizationSettings, AppError> {
  return useQuery<OrganizationSettings, AppError>({
    queryKey: organizationKeys.settings,
    queryFn: async () =>
      toOrganizationSettings(
        await apiClient.get<OrganizationSettingsDto>('/admin/settings/organization'),
      ),
  });
}
