import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { ContactFormDto } from '@/entities/contact-form/api-types';
import { toContactForm, toCreateContactFormDto } from '@/entities/contact-form/mapper';
import type { ContactForm, ContactFormDraft } from '@/entities/contact-form/model';
import { contactFormKeys } from '@/entities/contact-form/query-keys';

export function useCreateContactFormMutation(): UseMutationResult<
  ContactForm,
  AppError,
  ContactFormDraft
> {
  const queryClient = useQueryClient();
  return useMutation<ContactForm, AppError, ContactFormDraft>({
    mutationFn: async (draft) =>
      toContactForm(
        await apiClient.post<ContactFormDto>('/admin/contact-forms', toCreateContactFormDto(draft)),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactFormKeys.all });
    },
  });
}

export function useUpdateContactFormMutation(): UseMutationResult<
  ContactForm,
  AppError,
  { id: number; draft: ContactFormDraft }
> {
  const queryClient = useQueryClient();
  return useMutation<ContactForm, AppError, { id: number; draft: ContactFormDraft }>({
    mutationFn: async ({ id, draft }) =>
      toContactForm(
        await apiClient.put<ContactFormDto>(
          `/admin/contact-forms/${String(id)}`,
          toCreateContactFormDto(draft),
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactFormKeys.all });
    },
  });
}
