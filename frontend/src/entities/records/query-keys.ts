export const recordsKeys = {
  all: ['records'] as const,
  options: (source: string) => [...recordsKeys.all, 'options', source] as const,
};
