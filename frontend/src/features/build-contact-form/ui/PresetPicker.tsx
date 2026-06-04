import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { FORM_PRESETS, type FormPreset } from '@/features/build-contact-form/presets';

/**
 * Template picker shown before the blank builder so first-time operators can start from a
 * sensible preset (and edit from there). Selecting a preset seeds the builder draft.
 */
export function PresetPicker({ onPick }: { onPick: (preset: FormPreset) => void }): ReactNode {
  const { t } = useI18n();

  return (
    <div className="nc-section">
      <p className="nc-muted">{t('preset.pick.subtitle')}</p>
      <ul className="nc-list-reset nc-section">
        {FORM_PRESETS.map((preset) => (
          <li key={preset.id} className="nc-fieldset">
            <strong>{t(preset.nameKey)}</strong>
            <span className="nc-muted">{t(preset.descKey)}</span>
            <Button
              onClick={() => {
                onPick(preset);
              }}
            >
              {t('preset.pick.use')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
