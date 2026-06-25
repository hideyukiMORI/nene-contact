export const submissionHandoffKeys = {
  all: ['submission-handoffs'] as const,
  list: (submissionId: number) => [...submissionHandoffKeys.all, submissionId] as const,
};
