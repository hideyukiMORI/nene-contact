import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import {
  contactFormKeys,
  toContactFormDetail,
  useCreateContactFormMutation,
} from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';

// Clone a form (#317). The list row carries no field definitions, so fetch the full form, then
// create a new DRAFT with a copy-suffixed name and an empty public key — the server mints a fresh
// key so existing embeds keep working. Submissions are never copied (a form definition only). The
// create mutation invalidates the list query, so the new row appears on its own.
export function useDuplicateContactForm(): {
  duplicate: (id: number, name: string) => void;
  isPending: boolean;
} {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const create = useCreateContactFormMutation();

  const duplicate = (id: number, name: string): void => {
    void queryClient
      .fetchQuery({
        queryKey: contactFormKeys.detail(id),
        queryFn: async () =>
          toContactFormDetail(
            await apiClient.get<Parameters<typeof toContactFormDetail>[0]>(
              `/admin/contact-forms/${String(id)}`,
            ),
          ),
      })
      .then((detail) => {
        // ContactFormDetail is a superset of ContactFormDraft; override name + clear the key.
        create.mutate({
          ...detail,
          name: t('contactForms.copySuffix', { name }),
          publicFormKey: '',
        });
      })
      .catch(() => {
        // Fetch failed; nothing to clone. The list is unchanged.
      });
  };

  return { duplicate, isPending: create.isPending };
}
