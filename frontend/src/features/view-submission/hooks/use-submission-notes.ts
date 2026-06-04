import { useAddSubmissionNoteMutation, useSubmissionNotesQuery } from '@/entities/submission-note';
import type { AppError } from '@/shared/api/errors';
import type { SubmissionNote } from '@/entities/submission-note';

interface UseSubmissionNotes {
  notes: SubmissionNote[];
  isLoading: boolean;
  error: AppError | null;
  addNote: (body: string) => Promise<SubmissionNote>;
  isAdding: boolean;
}

export function useSubmissionNotes(submissionId: number): UseSubmissionNotes {
  const query = useSubmissionNotesQuery(submissionId);
  const mutation = useAddSubmissionNoteMutation(submissionId);

  return {
    notes: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    addNote: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}
