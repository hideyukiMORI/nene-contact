export type SubmissionStatus = 'open' | 'in_progress' | 'resolved' | 'spam';

export interface Submission {
  id: number;
  contactFormId: number;
  status: SubmissionStatus;
  submittedAt: string | null;
  // The admin list endpoint returns field values for every row, so the inbox can search
  // content / show the sender without per-row detail fetches.
  fieldValues: Record<string, unknown>;
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
  consentLabel: Record<string, string> | null;
  consentGivenAt: string | null;
}

export const SUBMISSION_STATUSES: SubmissionStatus[] = ['open', 'in_progress', 'resolved', 'spam'];
