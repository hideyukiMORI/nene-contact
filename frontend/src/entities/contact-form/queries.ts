import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { ContactFormDto, ContactFormListDto } from '@/entities/contact-form/api-types';
import { toContactFormDetail, toContactFormList } from '@/entities/contact-form/mapper';
import type { ContactFormDetail, ContactFormList } from '@/entities/contact-form/model';
import { contactFormKeys } from '@/entities/contact-form/query-keys';

export function useContactFormsQuery(): UseQueryResult<ContactFormList, AppError> {
  return useQuery<ContactFormList, AppError>({
    queryKey: contactFormKeys.list(),
    queryFn: async () =>
      toContactFormList(await apiClient.get<ContactFormListDto>('/admin/contact-forms')),
  });
}

// Fetches one full form — used by the read-only detail view and as the builder edit seed
// (ContactFormDetail is a structural superset of ContactFormDraft).
export function useContactFormQuery(id: number): UseQueryResult<ContactFormDetail, AppError> {
  return useQuery<ContactFormDetail, AppError>({
    queryKey: contactFormKeys.detail(id),
    queryFn: async () =>
      toContactFormDetail(
        await apiClient.get<ContactFormDto>(`/admin/contact-forms/${String(id)}`),
      ),
  });
}
