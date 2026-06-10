export const contactFormKeys = {
  all: ['contact-forms'] as const,
  list: () => [...contactFormKeys.all, 'list'] as const,
  detail: (id: number) => [...contactFormKeys.all, 'detail', id] as const,
};
