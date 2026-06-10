import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { ContactFormDto, ContactFormListDto } from '@/entities/contact-form/api-types';
import { toContactFormDraft, toContactFormList } from '@/entities/contact-form/mapper';
import type { ContactFormDraft, ContactFormList } from '@/entities/contact-form/model';
import { contactFormKeys } from '@/entities/contact-form/query-keys';

export function useContactFormsQuery(): UseQueryResult<ContactFormList, AppError> {
  return useQuery<ContactFormList, AppError>({
    queryKey: contactFormKeys.list(),
    queryFn: async () =>
      toContactFormList(await apiClient.get<ContactFormListDto>('/admin/contact-forms')),
  });
}

// Fetches a single form as a builder draft (edit-mode seed).
export function useContactFormDraftQuery(id: number): UseQueryResult<ContactFormDraft, AppError> {
  return useQuery<ContactFormDraft, AppError>({
    queryKey: contactFormKeys.detail(id),
    queryFn: async () =>
      toContactFormDraft(await apiClient.get<ContactFormDto>(`/admin/contact-forms/${String(id)}`)),
  });
}
