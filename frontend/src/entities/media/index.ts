import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { components } from '@/shared/api/schema.gen';

type MediaAssetDto = components['schemas']['MediaAsset'];

export interface MediaAsset {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  originalName: string | null;
}

function toMediaAsset(dto: MediaAssetDto): MediaAsset {
  return {
    id: dto.id,
    url: dto.url,
    width: dto.width ?? null,
    height: dto.height ?? null,
    originalName: dto.original_name ?? null,
  };
}

const mediaKeys = { all: ['media'] as const };

export function useMediaQuery(): UseQueryResult<MediaAsset[], AppError> {
  return useQuery<MediaAsset[], AppError>({
    queryKey: mediaKeys.all,
    queryFn: async () => (await apiClient.get<MediaAssetDto[]>('/admin/media')).map(toMediaAsset),
  });
}

export function useUploadMediaMutation(): UseMutationResult<MediaAsset, AppError, File> {
  const qc = useQueryClient();
  return useMutation<MediaAsset, AppError, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('file', file);
      return toMediaAsset(await apiClient.upload<MediaAssetDto>('/admin/media', form));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
