export { useSubmissionsQuery, useSubmissionQuery } from '@/entities/submission/queries';
export { useUpdateSubmissionStatusMutation } from '@/entities/submission/mutations';
export { toSubmission, toSubmissionDetail, toSubmissionList } from '@/entities/submission/mapper';
export { submissionKeys } from '@/entities/submission/query-keys';
export {
  SUBMISSION_STATUSES,
  type Submission,
  type SubmissionDetail,
  type SubmissionList,
  type SubmissionListParams,
  type SubmissionStatus,
} from '@/entities/submission/model';
