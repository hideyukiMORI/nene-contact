import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { countRuleText, STYLE_BY_ID } from '@/features/build-contact-form/lib/choice-core';
import type { ChoiceField } from '@/features/build-contact-form/hooks/use-choice-field';
import { OtherConfig } from '@/features/build-contact-form/ui/choice/OtherConfig';
import type { ChoiceCardLayout, ChoiceRatio } from '@/entities/contact-form';

function Switch({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      className={'cf-switch' + (on ? '' : ' off')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

function Stepper({
  value,
  set,
  min,
  max,
  disabled,
}: {
  value: number;
  set: (v: number) => void;
  min: number;
  max: number | null;
  disabled: boolean;
}): ReactNode {
  return (
    <div className={'cf-stepper' + (disabled ? ' dim' : '')}>
      <button
        type="button"
        disabled={value <= min}
        aria-label="−"
        onClick={() => {
          set(Math.max(min, value - 1));
        }}
      >
        −
      </button>
      <span className="val">{value}</span>
      <button
        type="button"
        disabled={max != null && value >= max}
        aria-label="＋"
        onClick={() => {
          set(max != null ? Math.min(max, value + 1) : value + 1);
        }}
      >
        ＋
      </button>
    </div>
  );
}

// 選択数ルール（複数選択のみ）— min / max toggles + steppers, with conflict warnings.
function CountRule({ choice }: { choice: ChoiceField }): ReactNode {
  const { t } = useI18n();
  const cr = choice.countRule;
  const total = choice.options.length + (choice.other ? 1 : 0);
  const conflict = cr.minOn && cr.maxOn && cr.min > cr.max;
  const minTooHigh = cr.minOn && cr.min > total;
  const summary = countRuleText(cr, t);

  return (
    <div style={{ marginTop: 14 }}>
      <div className="cf-rulegrid">
        <div className="cf-rulerow">
          <div className="tx">
            <div className="tl">{cr.minOn ? t('choice.rule.minOn') : t('choice.rule.minOff')}</div>
            <div className="td">{t('choice.rule.minDesc')}</div>
          </div>
          <Switch
            on={cr.minOn}
            label={t('choice.rule.minOn')}
            onToggle={() => {
              choice.patchCount({ minOn: !cr.minOn });
            }}
          />
          <Stepper
            value={cr.min}
            min={1}
            max={cr.maxOn ? cr.max : total}
            disabled={!cr.minOn}
            set={(v) => {
              choice.patchCount({ min: v });
            }}
          />
        </div>
        <div className="cf-rulerow">
          <div className="tx">
            <div className="tl">{cr.maxOn ? t('choice.rule.maxOn') : t('choice.rule.maxOff')}</div>
            <div className="td">{t('choice.rule.maxDesc')}</div>
          </div>
          <Switch
            on={cr.maxOn}
            label={t('choice.rule.maxOn')}
            onToggle={() => {
              choice.patchCount({ maxOn: !cr.maxOn });
            }}
          />
          <Stepper
            value={cr.max}
            min={cr.minOn ? cr.min : 1}
            max={total}
            disabled={!cr.maxOn}
            set={(v) => {
              choice.patchCount({ max: v });
            }}
          />
        </div>
      </div>
      {conflict ? (
        <div className="cf-rulewarn">
          <Icon name="warn" size={13} />
          {t('choice.rule.conflict')}
        </div>
      ) : !minTooHigh ? (
        summary !== '' ? (
          <div
            className="cf-rulesummary"
            dangerouslySetInnerHTML={{ __html: t('choice.rule.summary', { rule: summary }) }}
          />
        ) : (
          <div className="cf-panelnote" style={{ marginTop: 8 }}>
            <Icon name="bulb" size={13} />
            <span>{t('choice.rule.hint')}</span>
          </div>
        )
      ) : (
        <div className="cf-rulewarn">
          <Icon name="warn" size={13} />
          {t('choice.rule.minTooHigh', { min: String(cr.min), total: String(total) })}
        </div>
      )}
    </div>
  );
}

// Right-panel sections for the selected choice field.
export function ChoicePanel({
  choice,
  label,
  onLabel,
  onOpenGallery,
}: {
  choice: ChoiceField;
  label: string;
  onLabel: (value: string) => void;
  onOpenGallery: () => void;
}): ReactNode {
  const { t } = useI18n();
  const style = STYLE_BY_ID[choice.style];
  const RATIOS: ChoiceRatio[] = ['1:1', '4:3', '16:9'];

  return (
    <>
      <div className="bd-psec">
        <div className="bd-frow">
          <label className="l" htmlFor="cf-field-label">
            {t('builder.fieldLabel')}
          </label>
          <input
            id="cf-field-label"
            className="cf-input"
            value={label}
            onChange={(e) => {
              onLabel(e.target.value);
            }}
          />
        </div>
        <div className="bd-frow">
          <div className="bd-toggle">
            <div>
              <div className="tl">{t('builder.required')}</div>
              <div className="td">{t('choice.requiredDesc')}</div>
            </div>
            <Switch
              on={choice.required}
              label={t('builder.required')}
              onToggle={() => {
                choice.setRequired((v) => !v);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bd-psec">
        <h4>{t('choice.displayStyle')}</h4>
        <button type="button" className="cf-curstyle" onClick={onOpenGallery}>
          <span className="ic">
            <Icon name={style.icon} size={19} />
          </span>
          <div>
            <div className="nm">{t(style.labelKey)}</div>
            <div className="mt">
              {(choice.logic === 'single' ? t('choice.logic.single') : t('choice.logic.multiple')) +
                t('choice.tapToChange')}
            </div>
          </div>
          <span className="chev">
            <Icon name="chevRight" size={16} />
          </span>
        </button>
        <div className="cf-panelnote">
          <Icon name="info" size={13} />
          <span dangerouslySetInnerHTML={{ __html: t('choice.styleNote') }} />
        </div>
      </div>

      <div className="bd-psec">
        <h4>{t('choice.image.title')}</h4>
        <div className="cf-other" style={{ borderTop: 0, paddingTop: 0 }}>
          <span
            className="ic"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 30,
              height: 30,
              borderRadius: 7,
              background: choice.canImage ? 'var(--ex-brand-weak)' : 'var(--ex-surface2)',
              color: choice.canImage ? 'var(--ex-brand)' : 'var(--ex-faint)',
              flex: 'none',
            }}
          >
            <Icon name="image" size={16} />
          </span>
          <span className="lab">
            <b>{t('choice.image.toggle')}</b>
            <div style={{ fontWeight: 500, color: 'var(--ex-faint)', fontSize: 11, marginTop: 1 }}>
              {choice.canImage ? t('choice.image.toggleDesc') : t('choice.image.toggleDisabled')}
            </div>
          </span>
          <button
            type="button"
            className={'cf-switch' + (choice.imgMode ? '' : ' off')}
            role="switch"
            aria-checked={choice.imgMode}
            aria-label={t('choice.image.toggle')}
            disabled={!choice.canImage}
            style={!choice.canImage ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              if (choice.canImage) {
                choice.setImgMode((v) => !v);
              }
            }}
          />
        </div>

        {choice.imgMode ? (
          <div style={{ marginTop: 14 }}>
            <div className="cf-ctrlrow">
              <span className="l">{t('choice.image.layout')}</span>
              <div className="cf-seg block">
                {(['card', 'list'] as ChoiceCardLayout[]).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    className={choice.cardLayout === layout ? 'on' : ''}
                    onClick={() => {
                      choice.setCardLayout(layout);
                    }}
                  >
                    <Icon name={layout === 'card' ? 'dashboard' : 'list'} size={14} />
                    {layout === 'card' ? t('choice.image.card') : t('choice.image.list')}
                  </button>
                ))}
              </div>
            </div>
            {choice.cardLayout === 'card' ? (
              <>
                <div className="cf-ctrlrow">
                  <span className="l">{t('choice.image.cols')}</span>
                  <div className="cf-seg block">
                    {([2, 3] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={choice.cols === c ? 'on' : ''}
                        onClick={() => {
                          choice.setCols(c);
                        }}
                      >
                        {t('choice.image.colsN', { n: String(c) })}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cf-ctrlrow">
                  <span className="l">{t('choice.image.ratio')}</span>
                  <div className="cf-seg block">
                    {RATIOS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={choice.ratio === r ? 'on' : ''}
                        onClick={() => {
                          choice.setRatio(r);
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            <div className="cf-panelnote" style={{ marginTop: 4 }}>
              <Icon name="bulb" size={13} />
              <span dangerouslySetInnerHTML={{ __html: t('choice.image.note') }} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="bd-psec">
        <h4>{t('choice.other.title')}</h4>
        <div className="cf-othercfg">
          <div className="cf-othercfg-head">
            <span className="ic">
              <Icon name="edit" size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="nm">{t('choice.other.addTitle')}</div>
              <div className="mt">{t('choice.other.addDesc')}</div>
            </div>
            <Switch
              on={choice.other}
              label={t('choice.other.addTitle')}
              onToggle={() => {
                choice.setOther((v) => !v);
              }}
            />
          </div>
          {choice.other ? <OtherConfig choice={choice} /> : null}
        </div>
      </div>

      <div className="bd-psec">
        <h4>{t('choice.rule.title')}</h4>
        <div className="bd-frow">
          <div className="bd-toggle">
            <div>
              <div className="tl">
                {choice.logic === 'single'
                  ? t('choice.rule.singleTitle')
                  : t('choice.rule.multipleTitle')}
              </div>
              <div className="td">
                {choice.logic === 'single'
                  ? t('choice.rule.singleDesc')
                  : t('choice.rule.multipleDesc')}
              </div>
            </div>
            <span className="cf-pv-tag" style={{ marginLeft: 'auto' }}>
              <Icon name={choice.logic === 'single' ? 'flag' : 'check'} size={12} />
              {choice.logic === 'single' ? t('choice.logic.single') : t('choice.logic.multiple')}
            </span>
          </div>
        </div>
        {choice.logic === 'multiple' ? <CountRule choice={choice} /> : null}
      </div>
    </>
  );
}
