import { Fragment, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SUBMISSION_STATUSES,
  useSubmissionTechnicalMetaQuery,
  type SubmissionStatus,
} from '@/entities/submission';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import { useSubmission } from '@/features/view-submission/hooks/use-submission';
import { useSubmissionNotes } from '@/features/view-submission/hooks/use-submission-notes';

// Known submission sources → label key; unknown values fall back to the raw string.
const SOURCE_LABEL_KEYS: Record<string, MessageKey> = {
  form: 'submission.source.form',
  concierge: 'submission.source.concierge',
  import: 'submission.source.import',
  api: 'submission.source.api',
};

function display(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

const BADGE_CLASS: Record<SubmissionStatus, string> = {
  open: 'open',
  in_progress: 'prog',
  resolved: 'done',
  spam: 'spam',
};

export function SubmissionDetail({ submissionId }: { submissionId: number }): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { submission, isLoading, error, refetch, updateStatus, isUpdating } =
    useSubmission(submissionId);
  const notes = useSubmissionNotes(submissionId);
  const [noteBody, setNoteBody] = useState('');
  // IP/UA are fetched only after an explicit reveal; the request is audited server-side.
  const [revealTech, setRevealTech] = useState(false);
  const tech = useSubmissionTechnicalMetaQuery(submissionId, revealTech);
  const sourceKey = submission !== null ? SOURCE_LABEL_KEYS[submission.source] : undefined;

  if (isLoading) {
    return <div className="ib-state">{t('common.loading')}</div>;
  }

  if (error !== null || submission === null) {
    return (
      <div className="ib-state">
        <div className="au-note" role="alert">
          {t('submission.error')}
        </div>
        <button type="button" className="ex-btn ghost" onClick={refetch}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="ib-detail">
      <div className="ib-dhead">
        <button
          type="button"
          className="ib-iconbtn"
          aria-label={t('submission.back')}
          onClick={() => {
            void navigate('/submissions');
          }}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <span className="ib-av">
          <Icon name="mail" size={18} />
        </span>
        <div className="ib-who">
          <div className="nm">{t('submission.title', { id: String(submissionId) })}</div>
          <div className="sub">
            <span className={`ex-badge ${BADGE_CLASS[submission.status]}`}>
              <span className="dot" />
              {t(`submission.status.${submission.status}`)}
            </span>
          </div>
        </div>
        <div className="ib-acts">
          <select
            className="ib-statussel"
            aria-label={t('submission.status')}
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
      </div>

      <div className="ib-dbody">
        <div className="ib-msg-lab">{t('submission.fieldsLabel')}</div>
        <dl className="ib-meta">
          {Object.entries(submission.fieldValues).map(([key, value]) => (
            <Fragment key={key}>
              <dt>{key}</dt>
              <dd>{display(value)}</dd>
            </Fragment>
          ))}
        </dl>

        <div className="ib-msg-lab">{t('submission.metaLabel')}</div>
        <dl className="ib-meta">
          <dt>{t('submission.sourceLabel')}</dt>
          <dd>{sourceKey !== undefined ? t(sourceKey) : submission.source}</dd>
          {submission.sourceUrl !== null ? (
            <>
              <dt>{t('submission.sourceUrl')}</dt>
              <dd>{submission.sourceUrl}</dd>
            </>
          ) : null}
        </dl>

        <div className="ib-tech">
          {!revealTech ? (
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setRevealTech(true);
                }}
              >
                <Icon name="shield" size={14} />
                {t('submission.showTechnicalInfo')}
              </button>
              <p className="hint">{t('submission.technicalInfoHint')}</p>
            </>
          ) : tech.isPending ? (
            <div className="ib-state">{t('common.loading')}</div>
          ) : tech.error !== null ? (
            <div className="au-note" role="alert">
              {t('submission.technicalInfoError')}
            </div>
          ) : (
            <dl className="ib-meta">
              <dt>{t('submission.ip')}</dt>
              <dd>{tech.data.ip ?? '—'}</dd>
              <dt>{t('submission.userAgent')}</dt>
              <dd>{tech.data.userAgent ?? '—'}</dd>
            </dl>
          )}
        </div>

        <div className="ib-tags">
          <button type="button" className="ib-addtag">
            <Icon name="plus" size={12} />
            {t('submission.tag')}
          </button>
        </div>

        <div className="ib-memo">
          <div className="lab">
            <Icon name="lock" size={13} />
            {t('submission.memoLabel')}
          </div>
          {notes.notes.length > 0 ? (
            <ul className="ib-notelist">
              {notes.notes.map((note) => (
                <li key={note.id} className="ib-note">
                  {note.body}
                  {note.createdAt !== null ? <span className="when">{note.createdAt}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          <form
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
              aria-label={t('submission.addNote')}
              placeholder={t('submission.memoPlaceholder')}
              value={noteBody}
              onChange={(e) => {
                setNoteBody(e.target.value);
              }}
            />
            <div className="row">
              <button type="submit" className="ex-btn" disabled={notes.isAdding}>
                <Icon name="plus" size={14} />
                {t('submission.addNote')}
              </button>
            </div>
          </form>
        </div>

        <div className="ib-msg-lab">{t('submission.history')}</div>
        <div className="ib-tl">
          <div className="ib-tlrow">
            <span className="d" />
            <div className="tlc">
              <div className="tt">{t('submission.received')}</div>
            </div>
            <span className="time2">{submission.submittedAt ?? '—'}</span>
          </div>
          {submission.consentGivenAt !== null ? (
            <div className="ib-tlrow">
              <span className="d" />
              <div className="tlc">
                <div className="tt">{t('submission.consentEvent')}</div>
              </div>
              <span className="time2">{submission.consentGivenAt}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ib-foot">
        <span className="sp" />
        {submission.status !== 'resolved' ? (
          <button
            type="button"
            className="ex-btn"
            disabled={isUpdating}
            onClick={() => {
              updateStatus('resolved');
            }}
          >
            <Icon name="check" size={14} />
            {t('submission.markResolved')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
