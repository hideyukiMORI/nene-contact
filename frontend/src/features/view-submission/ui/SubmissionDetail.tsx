import { useState, type ReactNode } from 'react';
import { SUBMISSION_STATUSES, type SubmissionStatus } from '@/entities/submission';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useSubmission } from '@/features/view-submission/hooks/use-submission';
import { useSubmissionNotes } from '@/features/view-submission/hooks/use-submission-notes';

function display(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function SubmissionDetail({ submissionId }: { submissionId: number }): ReactNode {
  const { t } = useI18n();
  const { submission, isLoading, error, refetch, updateStatus, isUpdating } =
    useSubmission(submissionId);
  const notes = useSubmissionNotes(submissionId);
  const [noteBody, setNoteBody] = useState('');

  if (isLoading) {
    return <p>{t('common.loading')}</p>;
  }

  if (error !== null || submission === null) {
    return (
      <div className="nc-stack">
        <Alert>{t('submission.error')}</Alert>
        <Button type="button" onClick={refetch}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="nc-section">
      <div className="nc-field">
        <label className="nc-label" htmlFor="nc-status">
          {t('submission.status')}
        </label>
        <select
          id="nc-status"
          className="nc-input"
          value={submission.status}
          disabled={isUpdating}
          onChange={(e) => {
            updateStatus(e.target.value as SubmissionStatus);
          }}
        >
          {SUBMISSION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`submission.status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      <table className="nc-table">
        <thead>
          <tr>
            <th>{t('submission.field')}</th>
            <th>{t('submission.value')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(submission.fieldValues).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{display(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {submission.consentGivenAt !== null ? (
        <p className="nc-muted">
          {t('submission.consentGivenAt', { at: submission.consentGivenAt })}
        </p>
      ) : null}

      <h2>{t('submission.notes')}</h2>
      {notes.notes.length === 0 ? <p className="nc-muted">{t('submission.noNotes')}</p> : null}
      <ul>
        {notes.notes.map((note) => (
          <li key={note.id}>
            {note.body}
            {note.createdAt !== null ? <span className="nc-muted"> — {note.createdAt}</span> : null}
          </li>
        ))}
      </ul>

      <form
        className="nc-section"
        onSubmit={(e) => {
          e.preventDefault();
          if (noteBody.trim() === '') {
            return;
          }
          void notes.addNote(noteBody).then(() => {
            setNoteBody('');
          });
        }}
      >
        <textarea
          className="nc-input"
          aria-label={t('submission.addNote')}
          value={noteBody}
          onChange={(e) => {
            setNoteBody(e.target.value);
          }}
        />
        <Button type="submit" disabled={notes.isAdding}>
          {t('submission.addNote')}
        </Button>
      </form>
    </div>
  );
}
