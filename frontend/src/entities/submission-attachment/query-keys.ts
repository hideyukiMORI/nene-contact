export const submissionAttachmentKeys = {
  all: ['submission-attachments'] as const,
  list: (submissionId: number) => [...submissionAttachmentKeys.all, 'list', submissionId] as const,
};
