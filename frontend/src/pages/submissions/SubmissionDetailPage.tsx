import { useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SubmissionDetail } from '@/features/view-submission';

export function SubmissionDetailPage(): ReactNode {
  const { id } = useParams();
  const submissionId = Number(id);

  if (Number.isNaN(submissionId)) {
    return null;
  }
  return <SubmissionDetail submissionId={submissionId} />;
}
