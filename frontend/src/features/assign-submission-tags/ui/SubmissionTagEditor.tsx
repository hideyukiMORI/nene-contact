import { useState, type ReactNode } from 'react';
import {
  useAddSubmissionTagMutation,
  useRemoveSubmissionTagMutation,
  type SubmissionTagView,
} from '@/entities/submission';
import { DEFAULT_TAG_COLOR, useCreateTagMutation, useTagsQuery, type Tag } from '@/entities/tag';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';

/**
 * Applies / removes tags on one submission (ADR 0019): the current tags as removable chips, an
 * "add" menu of the org's remaining tags, and a quick-create that mints a tag (default colour)
 * and applies it. The vocabulary is managed in org settings; this is the per-submission surface.
 */
export function SubmissionTagEditor({
  submissionId,
  tags,
}: {
  submissionId: number;
  tags: SubmissionTagView[];
}): ReactNode {
  const { t } = useI18n();
  const orgTags = useTagsQuery().data ?? [];
  const add = useAddSubmissionTagMutation(submissionId);
  const remove = useRemoveSubmissionTagMutation(submissionId);
  const create = useCreateTagMutation();

  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const appliedIds = new Set(tags.map((tag) => tag.id));
  const addable = orgTags.filter((tag) => !appliedIds.has(tag.id));

  const swallow = (): void => {};

  const applyExisting = (tag: Tag): void => {
    add.mutate(tag.id);
    setOpen(false);
  };

  const quickCreate = (): void => {
    const label = newLabel.trim();
    if (label === '') {
      return;
    }
    void create.mutateAsync({ label, color: DEFAULT_TAG_COLOR }).then((tag) => {
      add.mutate(tag.id);
      setNewLabel('');
      setOpen(false);
    }, swallow);
  };

  return (
    <div className="nc-subtags">
      <div className="nc-subtags__chips">
        {tags.map((tag) => (
          <span key={tag.id} className={`nc-tag nc-tag--${tag.color}`}>
            {tag.label}
            <button
              type="button"
              className="nc-tag__x"
              aria-label={t('tags.removeAria', { label: tag.label })}
              onClick={() => {
                remove.mutate(tag.id);
              }}
            >
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}

        <div className="nc-subtags__addwrap">
          <button
            type="button"
            className="nc-subtags__add"
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
            }}
          >
            <Icon name="plus" size={12} />
            {t('tags.applyAdd')}
          </button>

          {open ? (
            <div className="nc-subtags__menu">
              {addable.length > 0 ? (
                <ul>
                  {addable.map((tag) => (
                    <li key={tag.id}>
                      <button
                        type="button"
                        onClick={() => {
                          applyExisting(tag);
                        }}
                      >
                        <span className={`nc-tag nc-tag--${tag.color}`}>{tag.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="nc-subtags__none">{t('tags.applyNone')}</p>
              )}

              <div className="nc-subtags__create">
                <input
                  type="text"
                  className="nc-input"
                  maxLength={60}
                  placeholder={t('tags.applyCreatePlaceholder')}
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      quickCreate();
                    }
                  }}
                />
                <button
                  type="button"
                  className="ex-btn sm"
                  disabled={newLabel.trim() === '' || create.isPending}
                  onClick={quickCreate}
                >
                  {t('tags.applyCreate')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
