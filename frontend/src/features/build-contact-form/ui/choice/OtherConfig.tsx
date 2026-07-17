import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { ChoiceField } from '@/features/build-contact-form/model/use-choice-field';

// 「その他」自由記述 settings — shared by the right panel and the on-canvas gear popover.
export function OtherConfig({
  choice,
  compact,
}: {
  choice: ChoiceField;
  compact?: boolean;
}): ReactNode {
  const { t } = useI18n();
  const oc = choice.otherCfg;
  const [maxOn, setMaxOn] = useState(oc.maxLen > 0);

  const setMax = (on: boolean): void => {
    setMaxOn(on);
    choice.patchOther({ maxLen: on ? (oc.maxLen > 0 ? oc.maxLen : 100) : 0 });
  };

  const label = oc.label !== '' ? oc.label : t('choice.other.defaultLabel');

  return (
    <div className="cf-othercfg-body" style={compact === true ? { padding: 0 } : undefined}>
      <div className="cf-field">
        <label htmlFor="cf-other-label">{t('choice.other.labelField')}</label>
        <input
          id="cf-other-label"
          className="cf-input"
          value={oc.label}
          onChange={(e) => {
            choice.patchOther({ label: e.target.value });
          }}
          placeholder={t('choice.other.defaultLabel')}
        />
      </div>
      <div className="cf-field">
        <label htmlFor="cf-other-ph">
          {t('choice.other.placeholderField')} <span className="opt">{t('choice.optional')}</span>
        </label>
        <input
          id="cf-other-ph"
          className="cf-input"
          value={oc.placeholder}
          onChange={(e) => {
            choice.patchOther({ placeholder: e.target.value });
          }}
          placeholder={t('choice.other.freeInput')}
        />
      </div>
      <div className="cf-togglerow">
        <div className="tx">
          <div className="tl">{t('choice.other.requiredTitle')}</div>
          <div className="td">{t('choice.other.requiredDesc', { label })}</div>
        </div>
        <button
          type="button"
          className={'cf-switch' + (oc.required ? '' : ' off')}
          role="switch"
          aria-checked={oc.required}
          aria-label={t('choice.other.requiredTitle')}
          onClick={() => {
            choice.patchOther({ required: !oc.required });
          }}
        />
      </div>
      <div>
        <div className="cf-togglerow" style={{ marginBottom: maxOn ? 10 : 0 }}>
          <div className="tx">
            <div className="tl">{t('choice.other.maxLenTitle')}</div>
            <div className="td">{t('choice.other.maxLenDesc')}</div>
          </div>
          <button
            type="button"
            className={'cf-switch' + (maxOn ? '' : ' off')}
            role="switch"
            aria-checked={maxOn}
            aria-label={t('choice.other.maxLenTitle')}
            onClick={() => {
              setMax(!maxOn);
            }}
          />
        </div>
        {maxOn ? (
          <div className="cf-numwrap">
            <span className="off">{t('choice.other.max')}</span>
            <input
              className="cf-input"
              type="number"
              min={1}
              max={2000}
              value={oc.maxLen > 0 ? oc.maxLen : 100}
              aria-label={t('choice.other.maxLenTitle')}
              onChange={(e) => {
                choice.patchOther({
                  maxLen: Math.max(1, Number.parseInt(e.target.value || '1', 10)),
                });
              }}
            />
            <span className="unit">{t('choice.other.charsUnit')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
