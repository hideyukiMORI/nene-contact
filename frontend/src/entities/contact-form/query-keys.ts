export const contactFormKeys = {
  all: ['contact-forms'] as const,
  list: () => [...contactFormKeys.all, 'list'] as const,
};
