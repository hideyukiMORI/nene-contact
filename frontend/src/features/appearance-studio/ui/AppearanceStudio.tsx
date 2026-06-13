import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Appearance } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { GROUPS, applyPreset, setIn } from '@/features/appearance-studio/model/studio-model';
import { StudioPreview } from '@/features/appearance-studio/ui/StudioPreview';
import { GroupBody, Presets } from '@/features/appearance-studio/ui/StudioControls';

const MODES: {
  v: Appearance['mode'];
  labelKey: MessageKey;
  icon: IconName;
  hintKey: MessageKey;
}[] = [
  { v: 'chat', labelKey: 'studio.mode.chat', icon: 'chat', hintKey: 'studio.mode.chatHint' },
  { v: 'modal', labelKey: 'studio.mode.modal', icon: 'forms', hintKey: 'studio.mode.modalHint' },
  { v: 'inline', labelKey: 'studio.mode.inline', icon: 'code', hintKey: 'studio.mode.inlineHint' },
];

// The Appearance Studio body (spec §1: mode bar + live preview stage + icon-rail panel — 案B).
// Controlled: edits flow out through onChange so the builder owns the draft appearance.
export function AppearanceStudio({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (next: Appearance) => void;
}): ReactNode {
  const { t } = useI18n();
  const [group, setGroup] = useState('theme');
  const [play, setPlay] = useState(0);

  const replay = (): void => {
    setPlay((k) => k + 1);
  };
  const set = (path: string[], v: unknown): void => {
    onChange(setIn(value, path, v));
  };
  const pick = (id: string): void => {
    onChange({ ...applyPreset(id), mode: value.mode });
    replay();
  };
  const reset = (): void => {
    onChange({ ...applyPreset('nene'), mode: value.mode });
    replay();
  };
  const setMode = (m: Appearance['mode']): void => {
    onChange({ ...value, mode: m });
    replay();
  };

  const activeGroup = GROUPS.find((g) => g.id === group);
  const activeMode = MODES.find((m) => m.v === value.mode);
  const activeHint: MessageKey = activeMode?.hintKey ?? 'studio.mode.modalHint';
  const activeGroupLabel: MessageKey = activeGroup?.labelKey ?? 'studio.group.theme';
  const activeGroupIcon: IconName = activeGroup?.icon ?? 'sparkle';

  return (
    <div className="st-body">
      <div className="st-stage">
        <div className="st-modebar">
          <div className="st-modeseg">
            {MODES.map((m) => (
              <button
                key={m.v}
                type="button"
                className={value.mode === m.v ? 'on' : ''}
                onClick={() => {
                  setMode(m.v);
                }}
              >
                <Icon name={m.icon} size={15} />
                {t(m.labelKey)}
              </button>
            ))}
          </div>
          <span className="st-modehint">
            <Icon name="info" size={13} />
            {t(activeHint)}
          </span>
          <span className="gap" />
          <button type="button" className="st-iconbtn" title={t('studio.replay')} onClick={replay}>
            <Icon name="play" size={16} />
          </button>
        </div>
        <div className="st-canvas">
          <StudioPreview a={value} playKey={play} />
        </div>
      </div>

      <div className="st-panel">
        <div className="st-phead">
          <div>
            <h3>{t('studio.panelTitle')}</h3>
            <div className="sub">{t('studio.panelSub')}</div>
          </div>
          <button type="button" className="reset" onClick={reset}>
            <Icon name="arrowLeft" size={13} />
            {t('studio.reset')}
          </button>
        </div>
        <Presets a={value} onPick={pick} />
        <div className="st-railwrap">
          <div className="st-rail">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={group === g.id ? 'on' : ''}
                onClick={() => {
                  setGroup(g.id);
                }}
              >
                <Icon name={g.icon} size={18} />
                {t(g.labelKey)}
              </button>
            ))}
          </div>
          <div className="st-railbody">
            <div className="st-sec">
              <h4>
                <Icon name={activeGroupIcon} size={13} />
                {t(activeGroupLabel)}
              </h4>
              <GroupBody id={group} a={value} set={set} onReplay={replay} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
