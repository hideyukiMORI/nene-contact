export interface SubmissionNote {
  id: number;
  submissionId: number;
  authorUserId: number | null;
  body: string;
  createdAt: string | null;
}
