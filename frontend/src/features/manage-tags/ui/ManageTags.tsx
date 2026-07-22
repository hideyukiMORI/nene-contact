import { useState, type ReactNode } from 'react';
import { DEFAULT_TAG_COLOR, TAG_COLORS, type Tag, type TagColor } from '@/entities/tag';
import { useI18n } from '@/shared/i18n';
import { Icon, Modal } from '@/shared/ui';
import { useTags } from '@/features/manage-tags/model/use-tags';

interface Editing {
  tag: Tag | null; // null = creating
  label: string;
  color: TagColor;
}

/**
 * Org tag vocabulary management (ManageSettings, ADR 0019): create / rename / recolour /
 * soft-delete the tags operators apply to submissions. Carries the compliance warning that tags
 * must not encode 要配慮個人情報 (charter §8).
 */
export function ManageTags(): ReactNode {
  const { t } = useI18n();
  const {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    isSaving,
    saveError,
    deleteError,
  } = useTags();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

  const openCreate = (): void => {
    setEditing({ tag: null, label: '', color: DEFAULT_TAG_COLOR });
  };
  const openEdit = (tag: Tag): void => {
    setEditing({ tag, label: tag.label, color: tag.color });
  };

  const onSave = (): void => {
    if (editing === null || editing.label.trim() === '') {
      return;
    }
    const done = (): void => {
      setEditing(null);
    };
    // On failure (e.g. 409 duplicate) the modal stays open; the error is shown from saveError.
    const swallow = (): void => {};
    if (editing.tag === null) {
      void createTag({ label: editing.label.trim(), color: editing.color }).then(done, swallow);
    } else {
      void updateTag({
        id: editing.tag.id,
        label: editing.label.trim(),
        color: editing.color,
      }).then(done, swallow);
    }
  };

  return (
    <div className="nc-tags-manage">
      <div className="au-note nc-tags-warn" role="note">
        <Icon name="shield" size={15} />
        {t('tags.warn')}
      </div>

      <div className="ex-cardhead">
        <h3>{t('tags.heading')}</h3>
        <span className="c">{t('tags.count', { n: String(tags.length) })}</span>
        <span className="sp" />
        <button type="button" className="ex-btn" onClick={openCreate}>
          <Icon name="plus" size={14} />
          {t('tags.add')}
        </button>
      </div>

      {isLoading ? <div className="fm-state">{t('common.loading')}</div> : null}
      {error !== null ? (
        <div className="au-note" role="alert">
          {t('tags.error')}
        </div>
      ) : null}
      {deleteError !== null ? (
        <div className="au-note" role="alert">
          {t('tags.deleteError')}
        </div>
      ) : null}

      {!isLoading && error === null && tags.length === 0 ? (
        <div className="nc-tags-empty">{t('tags.empty')}</div>
      ) : null}

      {tags.length > 0 ? (
        <ul className="nc-tags-list">
          {tags.map((tag) => (
            <li key={tag.id} className="nc-tags-row">
              <span className={`nc-tag nc-tag--${tag.color}`}>{tag.label}</span>
              <span className="sp" />
              <button
                type="button"
                className="ex-btn ghost sm"
                aria-label={t('tags.editAria', { label: tag.label })}
                onClick={() => {
                  openEdit(tag);
                }}
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                type="button"
                className="ex-btn ghost sm"
                aria-label={t('tags.deleteAria', { label: tag.label })}
                onClick={() => {
                  setDeleteTarget(tag);
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {editing !== null ? (
        <Modal
          title={editing.tag === null ? t('tags.add') : t('tags.edit')}
          onClose={() => {
            setEditing(null);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setEditing(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="ex-btn"
                disabled={isSaving || editing.label.trim() === ''}
                onClick={onSave}
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
            </>
          }
        >
          <label className="nc-field">
            <span className="nc-field__label">{t('tags.labelField')}</span>
            <input
              type="text"
              className="nc-input"
              maxLength={60}
              value={editing.label}
              onChange={(e) => {
                setEditing({ ...editing, label: e.target.value });
              }}
            />
          </label>
          <div className="nc-field">
            <span className="nc-field__label">{t('tags.colorField')}</span>
            <div className="nc-tag-colors" role="radiogroup" aria-label={t('tags.colorField')}>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={editing.color === color}
                  aria-label={color}
                  className={`nc-tag-swatch nc-tag--${color}${editing.color === color ? ' on' : ''}`}
                  onClick={() => {
                    setEditing({ ...editing, color });
                  }}
                />
              ))}
            </div>
          </div>
          {saveError !== null ? (
            <div className="au-note" role="alert">
              {saveError.status === 409 ? t('tags.conflict') : t('tags.saveError')}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {deleteTarget !== null ? (
        <Modal
          title={t('tags.deleteTitle')}
          onClose={() => {
            setDeleteTarget(null);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setDeleteTarget(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="ex-btn danger"
                onClick={() => {
                  deleteTag(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                {t('tags.deleteConfirm')}
              </button>
            </>
          }
        >
          <p>{t('tags.deleteBody', { label: deleteTarget.label })}</p>
        </Modal>
      ) : null}
    </div>
  );
}
