export const submissionNoteKeys = {
  all: ['submission-notes'] as const,
  list: (submissionId: number) => [...submissionNoteKeys.all, submissionId] as const,
};
