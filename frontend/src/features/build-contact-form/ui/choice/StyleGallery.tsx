import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { STYLES, type ChoiceLogic } from '@/features/build-contact-form/lib/choice-core';
import { GalleryMini } from '@/features/build-contact-form/lib/choice-preview';
import type { ChoiceField } from '@/features/build-contact-form/hooks/use-choice-field';

// Style gallery modal (案B): pick the display style from preview-bearing cards, grouped by
// single / multiple. Picking a style closes the modal.
export function StyleGallery({
  choice,
  onClose,
}: {
  choice: ChoiceField;
  onClose: () => void;
}): ReactNode {
  const { t } = useI18n();
  const groups: ChoiceLogic[] = ['single', 'multiple'];

  return (
    <div className="cf-scrim">
      <button
        type="button"
        className="cf-scrim-btn"
        aria-label={t('common.close')}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('choice.gallery.title')}
      >
        <div className="cf-modal-head">
          <div>
            <h3>{t('choice.gallery.title')}</h3>
            <p>{t('choice.gallery.subtitle')}</p>
          </div>
          <button
            type="button"
            className="cf-modal-x"
            aria-label={t('common.close')}
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="cf-modal-body">
          <div className="cf-modal-groups">
            {groups.map((lg) => (
              <div key={lg}>
                <div className="cf-modal-grouplab">
                  {lg === 'single'
                    ? t('choice.gallery.singleGroup')
                    : t('choice.gallery.multipleGroup')}
                </div>
                <div className="cf-gallery">
                  {STYLES.filter((s) => s.logic === lg).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={'cf-gcard' + (choice.style === s.id ? ' on' : '')}
                      onClick={() => {
                        choice.setStyle(s.id);
                        onClose();
                      }}
                    >
                      <span className="tick">
                        <Icon name="check" size={12} />
                      </span>
                      <div className="lp">
                        <GalleryMini id={s.id} t={t} />
                      </div>
                      <div className="cap">
                        <div className="nm">{t(s.labelKey)}</div>
                        <div className="hint">{t(s.hintKey)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
