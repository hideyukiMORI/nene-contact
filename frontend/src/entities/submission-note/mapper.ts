import type {
  SubmissionNoteDto,
  SubmissionNoteListDto,
} from '@/entities/submission-note/api-types';
import type { SubmissionNote } from '@/entities/submission-note/model';

export function toSubmissionNote(dto: SubmissionNoteDto): SubmissionNote {
  return {
    id: dto.id,
    submissionId: dto.submission_id,
    authorUserId: dto.author_user_id ?? null,
    body: dto.body,
    createdAt: dto.created_at ?? null,
  };
}

export function toSubmissionNotes(dto: SubmissionNoteListDto): SubmissionNote[] {
  return (dto.items ?? []).map(toSubmissionNote);
}
