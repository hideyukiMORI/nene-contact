import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { OrganizationSettingsDto } from '@/entities/organization/api-types';
import { toOrganizationSettings, toUpdateOrganizationDto } from '@/entities/organization/mapper';
import type {
  OrganizationSettings,
  OrganizationSettingsUpdate,
} from '@/entities/organization/model';
import { organizationKeys } from '@/entities/organization/query-keys';

export function useUpdateOrganizationSettingsMutation(): UseMutationResult<
  OrganizationSettings,
  AppError,
  OrganizationSettingsUpdate
> {
  const queryClient = useQueryClient();
  return useMutation<OrganizationSettings, AppError, OrganizationSettingsUpdate>({
    mutationFn: async (update) =>
      toOrganizationSettings(
        await apiClient.patch<OrganizationSettingsDto>(
          '/admin/settings/organization',
          toUpdateOrganizationDto(update),
        ),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(organizationKeys.settings, data);
    },
  });
}
