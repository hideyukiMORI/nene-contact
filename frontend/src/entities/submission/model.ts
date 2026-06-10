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
  // Per-status totals for the current query (status filter ignored), for the inbox tabs.
  statusCounts: Record<string, number>;
}

export type SubmissionSort = 'date_desc' | 'date_asc' | 'status' | 'form';

export const SUBMISSION_SORTS: SubmissionSort[] = ['date_desc', 'date_asc', 'status', 'form'];

export interface SubmissionListParams {
  limit: number;
  offset: number;
  status?: SubmissionStatus;
  contactFormId?: number;
  from?: string;
  to?: string;
  q?: string;
  sort?: SubmissionSort;
}

export interface SubmissionDetail extends Submission {
  consentLabel: Record<string, string> | null;
  consentGivenAt: string | null;
}

export const SUBMISSION_STATUSES: SubmissionStatus[] = ['open', 'in_progress', 'resolved', 'spam'];
