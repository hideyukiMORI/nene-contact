export const serviceTokenKeys = {
  all: ['service-tokens'] as const,
  list: () => [...serviceTokenKeys.all, 'list'] as const,
};
