import type { SubmissionListParams } from '@/entities/submission/model';

export const submissionKeys = {
  all: ['submissions'] as const,
  list: (params: SubmissionListParams) => [...submissionKeys.all, 'list', params] as const,
};
