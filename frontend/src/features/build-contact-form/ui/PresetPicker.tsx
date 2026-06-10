import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { FORM_PRESETS, type FormPreset } from '@/features/build-contact-form/presets';

/**
 * Template picker shown before the blank builder so first-time operators can start from a
 * sensible preset (and edit from there). Selecting a preset seeds the builder draft.
 */
export function PresetPicker({ onPick }: { onPick: (preset: FormPreset) => void }): ReactNode {
  const { t } = useI18n();

  return (
    <div className="bd-presets">
      {FORM_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="bd-preset"
          onClick={() => {
            onPick(preset);
          }}
        >
          <span className="pic">
            <Icon name={preset.id === 'blank' ? 'sparkle' : 'forms'} size={18} />
          </span>
          <span className="pt">{t(preset.nameKey)}</span>
          <span className="pd">{t(preset.descKey)}</span>
        </button>
      ))}
    </div>
  );
}
