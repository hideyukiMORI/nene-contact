export type SubmissionStatus = 'open' | 'in_progress' | 'resolved' | 'spam';

export interface Submission {
  id: number;
  contactFormId: number;
  status: SubmissionStatus;
  submittedAt: string | null;
}

export interface SubmissionList {
  items: Submission[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubmissionListParams {
  limit: number;
  offset: number;
}

export interface SubmissionDetail extends Submission {
  fieldValues: Record<string, unknown>;
  consentLabel: Record<string, string> | null;
  consentGivenAt: string | null;
}

export const SUBMISSION_STATUSES: SubmissionStatus[] = ['open', 'in_progress', 'resolved', 'spam'];
