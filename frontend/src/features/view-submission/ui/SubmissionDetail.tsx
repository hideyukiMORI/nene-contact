import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SUBMISSION_STATUSES,
  useSubmissionTechnicalMetaQuery,
  type SubmissionDetail as SubmissionDetailModel,
  type SubmissionStatus,
} from '@/entities/submission';
import {
  useContactFormQuery,
  type ContactFormDetail,
  type DraftField,
} from '@/entities/contact-form';
import {
  useSubmissionAttachmentsQuery,
  type SubmissionAttachment,
} from '@/entities/submission-attachment';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon, type IconName } from '@/shared/ui';
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

// Field type → list icon (spec §03 fieldIcon()).
function fieldIcon(fieldType: string): IconName {
  switch (fieldType) {
    case 'email':
      return 'mail';
    case 'select':
    case 'checkbox':
      return 'chevDown';
    case 'file':
      return 'file';
    default:
      return 'edit';
  }
}

// Endonym label key for a known locale code; unknown codes fall back to the raw code.
const LOCALE_LABEL_KEYS: Record<string, MessageKey> = {
  ja: 'submission.language.ja',
  en: 'submission.language.en',
};

// Display name + avatar initial: name → company → first non-empty value → untitled (spec §01).
function resolveDisplayName(values: Record<string, unknown>, fallback: string): string {
  const byKey = (key: string): string => display(values[key]).trim();
  const named = byKey('name') || byKey('company');
  if (named !== '') {
    return named;
  }
  for (const value of Object.values(values)) {
    const text = display(value).trim();
    if (text !== '') {
      return text;
    }
  }
  return fallback;
}

function localeLabel(code: string, t: (key: MessageKey) => string): string {
  const key = LOCALE_LABEL_KEYS[code];
  return `${key !== undefined ? t(key) : code} (${code})`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileChip({ attachment }: { attachment: SubmissionAttachment }): ReactNode {
  return (
    <span className="file-chip">
      <Icon name="file" size={14} />
      <span className="fn">{attachment.originalFilename}</span>
      <span className="fs">{formatBytes(attachment.sizeBytes)}</span>
    </span>
  );
}

interface KvRow {
  key: string;
  label: string;
  fieldType: string;
  value: unknown;
}

// Builds the field-driven rows: when the form is known we follow its field order and labels
// (skipping the honeypot); otherwise we fall back to the raw submitted keys.
function buildRows(
  submission: SubmissionDetailModel,
  form: ContactFormDetail | null,
  locale: string,
): KvRow[] {
  if (form !== null) {
    return form.fields
      .filter((field: DraftField) => field.fieldType !== 'honeypot')
      .map((field: DraftField) => ({
        key: field.name,
        label: field.label[locale] ?? field.label[form.defaultLocale] ?? field.name,
        fieldType: field.fieldType,
        value: submission.fieldValues[field.name],
      }));
  }
  return Object.entries(submission.fieldValues).map(([key, value]) => ({
    key,
    label: key,
    fieldType: 'text',
    value,
  }));
}

export function SubmissionDetail({ submissionId }: { submissionId: number }): ReactNode {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { submission, isLoading, error, refetch, updateStatus, isUpdating } =
    useSubmission(submissionId);
  const notes = useSubmissionNotes(submissionId);
  const [noteBody, setNoteBody] = useState('');
  // IP/UA are fetched only after the operator opens the technical section; audited server-side.
  const [revealTech, setRevealTech] = useState(false);
  const tech = useSubmissionTechnicalMetaQuery(submissionId, revealTech);
  // Form (name + field labels/types) and attachments are fetched once the submission is loaded.
  const form = useContactFormQuery(submission?.contactFormId ?? 0, submission !== null);
  const attachments = useSubmissionAttachmentsQuery(submissionId, submission !== null);

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

  const formData = form.data ?? null;
  const dispName = resolveDisplayName(submission.fieldValues, t('submission.untitled'));
  const formName = formData?.name ?? '—';
  const rows = buildRows(submission, formData, locale);
  const attachmentItems = attachments.data?.items ?? [];
  const isSpam = submission.status === 'spam';

  const subParts = [t('submission.title', { id: String(submissionId) }), formName];
  if (submission.submittedAt !== null) {
    subParts.push(submission.submittedAt);
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
        <span className="ib-av">{dispName.slice(0, 1)}</span>
        <div className="ib-who">
          <div className="nm">{dispName}</div>
          <div className="sub">{subParts.join(' ・ ')}</div>
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

      <div className="ib-body">
        <div className="ib-grid">
          <div className="ib-center">
            <div className="ib-msg-lab">{t('submission.contentLabel')}</div>
            <div className="kv">
              {rows.map((row) => {
                const fieldAttachments = attachmentItems.filter((a) => a.fieldName === row.key);
                const text = display(row.value);
                return (
                  <div className="kv-row" key={row.key}>
                    <div className="k">
                      <span className="fi">
                        <Icon name={fieldIcon(row.fieldType)} size={14} />
                      </span>
                      <span className="ty">{row.label}</span>
                    </div>
                    {row.fieldType === 'file' && fieldAttachments.length > 0 ? (
                      <div className="v">
                        {fieldAttachments.map((a) => (
                          <FileChip key={a.id} attachment={a} />
                        ))}
                      </div>
                    ) : (
                      <div className={text === '' ? 'v empty' : 'v'}>
                        {text === '' ? '—' : text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rail">
            <div className="rail-lab">{t('submission.receptionMeta')}</div>
            <div className="rail-meta">
              <div className="rm">
                <span>{t('submission.formLabel')}</span>
                <b>{formName}</b>
              </div>
              {submission.locale !== null ? (
                <div className="rm">
                  <span>{t('submission.localeLabel')}</span>
                  <b>{localeLabel(submission.locale, t)}</b>
                </div>
              ) : null}
              <div className="rm">
                <span>{t('submission.receivedAt')}</span>
                <b>{submission.submittedAt ?? '—'}</b>
              </div>
              <div className="rm">
                <span>{t('submission.judgementLabel')}</span>
                <b style={{ color: isSpam ? '#a85a66' : 'var(--ex-muted)' }}>
                  {t(isSpam ? 'submission.judgement.spam' : 'submission.judgement.normal')}
                </b>
              </div>
              {submission.consentGivenAt !== null ? (
                <div className="rm">
                  <span>{t('submission.consentAtLabel')}</span>
                  <b>{submission.consentGivenAt}</b>
                </div>
              ) : null}
            </div>

            <div className="rail-lab" style={{ marginTop: '6px' }}>
              {t('submission.memoRailLabel')}
            </div>
            {notes.notes.length > 0 ? (
              <div className="memo-list">
                {notes.notes.map((note) => (
                  <div className="memo-item" key={note.id}>
                    {note.body}
                    {note.createdAt !== null ? <span className="at">{note.createdAt}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="memo-empty">{t('submission.memoEmpty')}</div>
            )}
            <form
              className="memo-add"
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
              <button type="submit" className="ex-btn" disabled={notes.isAdding}>
                <Icon name="plus" size={14} />
                {t('submission.addNote')}
              </button>
            </form>

            <details
              className="tech"
              onToggle={(e) => {
                if (e.currentTarget.open) {
                  setRevealTech(true);
                }
              }}
            >
              <summary>
                <Icon name="lock" size={13} />
                {t('submission.technicalInfo')}
              </summary>
              <div className="tech-body">
                {tech.isPending && revealTech ? (
                  <div className="rm">
                    <span>{t('common.loading')}</span>
                  </div>
                ) : tech.error !== null ? (
                  <div className="au-note" role="alert">
                    {t('submission.technicalInfoError')}
                  </div>
                ) : (
                  <>
                    <div className="rm">
                      <span>{t('submission.ip')}</span>
                      <b className="mono">{tech.data?.ip ?? '—'}</b>
                    </div>
                    <div className="rm">
                      <span>{t('submission.userAgent')}</span>
                      <b className="mono ua">{tech.data?.userAgent ?? '—'}</b>
                    </div>
                  </>
                )}
                <div className="rm">
                  <span>{t('submission.sourcePageLabel')}</span>
                  <b className="mono">{submission.sourceUrl ?? '—'}</b>
                </div>
                <div className="rm">
                  <span>{t('submission.honeypotLabel')}</span>
                  <b>{t('submission.honeypotClear')}</b>
                </div>
                <p className="audit-note">
                  <Icon name="lock" size={11} />
                  {t('submission.auditNote')}
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
