import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { countRuleText, pressable } from '@/features/build-contact-form/lib/choice-core';
import type { ChoiceField } from '@/features/build-contact-form/model/use-choice-field';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type { ChoiceRatio } from '@/entities/contact-form';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

interface Answers {
  sel: string[];
  otherSel: boolean;
  otherText: string;
}

const RATIO_CSS: Record<ChoiceRatio, string> = { '1:1': '1 / 1', '4:3': '4 / 3', '16:9': '16 / 9' };

// Enforce the rules configured in the builder: field required, count min/max (multiple),
// 「その他」 required + maxLen. Returns localized error messages (first one is surfaced).
function validate(st: ChoiceField, ans: Answers, t: Translate): string[] {
  const otherText = ans.otherText.trim();
  const totalSel = ans.sel.length + (ans.otherSel ? 1 : 0);
  const errs: string[] = [];
  const otherLabel = st.otherCfg.label !== '' ? st.otherCfg.label : t('choice.other.defaultLabel');

  if (st.logic === 'single') {
    if (st.required && totalSel === 0) {
      errs.push(t('choice.resp.err.singleRequired'));
    }
  } else {
    const lo = st.countRule.minOn ? st.countRule.min : st.required ? 1 : 0;
    const hi = st.countRule.maxOn ? st.countRule.max : null;
    if (st.required && totalSel === 0 && lo === 0) {
      errs.push(t('choice.resp.err.multipleRequired'));
    } else if (totalSel < lo) {
      errs.push(t('choice.resp.err.belowMin', { remain: String(lo - totalSel), lo: String(lo) }));
    }
    if (hi != null && totalSel > hi) {
      errs.push(t('choice.resp.err.aboveMax', { hi: String(hi), total: String(totalSel) }));
    }
  }
  if (st.other && ans.otherSel) {
    if (st.otherCfg.required && otherText === '') {
      errs.push(t('choice.resp.err.otherRequired', { label: otherLabel }));
    }
    if (st.otherCfg.maxLen > 0 && otherText.length > st.otherCfg.maxLen) {
      errs.push(
        t('choice.resp.err.otherMaxLen', { label: otherLabel, max: String(st.otherCfg.maxLen) }),
      );
    }
  }
  return errs;
}

export function RespondentForm({
  choice,
  formName,
  formDescription,
  fieldLabel,
  onClose,
}: {
  choice: ChoiceField;
  formName: string;
  formDescription: string;
  fieldLabel: string;
  onClose: () => void;
}): ReactNode {
  const { t } = useI18n();
  // Seed answers from the builder defaults once (the preview mounts fresh each time it opens).
  const [ans, setAns] = useState<Answers>(() => ({
    sel: [...choice.defaults],
    otherSel: false,
    otherText: '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [tagFocus, setTagFocus] = useState(false);
  const [ok, setOk] = useState(false);

  const { style, logic, options, other, otherCfg, imgMode, cols, ratio } = choice;
  const single = logic === 'single';
  const errs = submitted ? validate(choice, ans, t) : [];
  const invalid = errs.length > 0;
  const otherLabel = otherCfg.label !== '' ? otherCfg.label : t('choice.other.defaultLabel');

  const pick = (id: string): void => {
    setOk(false);
    setAns((a) => {
      if (single) {
        return { ...a, sel: [id], otherSel: false };
      }
      return { ...a, sel: a.sel.includes(id) ? a.sel.filter((x) => x !== id) : [...a.sel, id] };
    });
  };
  const pickOther = (): void => {
    setOk(false);
    setAns((a) =>
      single ? { ...a, sel: [], otherSel: !a.otherSel } : { ...a, otherSel: !a.otherSel },
    );
  };
  const isOn = (id: string): boolean => ans.sel.includes(id);

  const submit = (): void => {
    setSubmitted(true);
    setOk(validate(choice, ans, t).length === 0);
  };

  const reqRule = (): string => {
    if (single) {
      return choice.required ? t('choice.resp.rule.singleRequired') : t('choice.resp.rule.single');
    }
    const text = countRuleText(choice.countRule, t);
    if (text !== '') {
      return text;
    }
    return choice.required
      ? t('choice.resp.rule.multipleRequired')
      : t('choice.resp.rule.multiple');
  };

  const otherBlock = other ? (
    <div className="cf-r-other">
      <textarea
        className={'cf-r-otherinp' + (invalid && ans.otherSel ? ' invalid' : '')}
        placeholder={
          otherCfg.placeholder !== '' ? otherCfg.placeholder : t('choice.other.freeInput')
        }
        value={ans.otherText}
        maxLength={otherCfg.maxLen > 0 ? otherCfg.maxLen : undefined}
        aria-label={otherLabel}
        onChange={(e) => {
          setOk(false);
          setAns((a) => ({ ...a, otherText: e.target.value }));
        }}
        onFocus={() => {
          if (!ans.otherSel) {
            pickOther();
          }
        }}
      />
      {otherCfg.maxLen > 0 ? (
        <div className="cf-r-othermeta">
          <span className="sp" />
          <span className={'cf-r-count' + (ans.otherText.length > otherCfg.maxLen ? ' over' : '')}>
            {ans.otherText.length} / {otherCfg.maxLen}
          </span>
        </div>
      ) : null}
    </div>
  ) : null;

  let control: ReactNode;
  if ((style === 'radio' || style === 'checkbox') && imgMode) {
    control = (
      <div className={'cf-r-imgcards cols' + String(cols) + (invalid ? ' invalid' : '')}>
        {options.map((o) => (
          <div
            key={o.id}
            className={'cf-r-imgcard' + (isOn(o.id) ? ' on' : '')}
            aria-label={o.label}
            aria-pressed={isOn(o.id)}
            {...pressable(() => {
              pick(o.id);
            })}
          >
            <div className="img" style={{ aspectRatio: RATIO_CSS[ratio] }}>
              <span className="cf-imgph" />
              <span
                className={'cf-imgmk ' + (single ? 'radio' : 'check') + (isOn(o.id) ? ' on' : '')}
              >
                <Icon name="check" size={12} />
              </span>
            </div>
            <div className="cap">
              {o.label}
              {o.desc != null && o.desc !== '' ? (
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--ex-faint)',
                    fontWeight: 400,
                    marginTop: 3,
                  }}
                >
                  {o.desc}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {other ? (
          <div
            className={'cf-r-imgcard' + (ans.otherSel ? ' on' : '')}
            aria-label={otherLabel}
            aria-pressed={ans.otherSel}
            {...pressable(pickOther)}
          >
            <div
              className="img dash"
              style={{
                aspectRatio: RATIO_CSS[ratio],
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ex-faint)',
                background:
                  'repeating-linear-gradient(45deg, var(--ex-surface2) 0 9px, var(--ex-bg) 9px 18px)',
              }}
            >
              <Icon name="edit" size={20} />
            </div>
            <div className="cap">{otherLabel}</div>
          </div>
        ) : null}
      </div>
    );
  } else if (style === 'radio' || style === 'checkbox') {
    control = (
      <div className="cf-r-opts">
        {options.map((o) => (
          <div
            key={o.id}
            className={'cf-r-opt' + (isOn(o.id) ? ' on' : '') + (invalid ? ' invalid' : '')}
            aria-label={o.label}
            aria-pressed={isOn(o.id)}
            {...pressable(() => {
              pick(o.id);
            })}
          >
            <span className={'cf-r-mk ' + (single ? 'radio' : 'check')}>
              <Icon name="check" size={13} />
            </span>
            <div className="cf-r-cap">
              <div className="t">{o.label}</div>
              {o.desc != null && o.desc !== '' ? <div className="d">{o.desc}</div> : null}
            </div>
          </div>
        ))}
        {other ? (
          <div
            className={'cf-r-opt' + (ans.otherSel ? ' on' : '') + (invalid ? ' invalid' : '')}
            aria-label={otherLabel}
            aria-pressed={ans.otherSel}
            {...pressable(pickOther)}
          >
            <span className={'cf-r-mk ' + (single ? 'radio' : 'check')}>
              <Icon name="check" size={13} />
            </span>
            <div className="cf-r-cap">
              <div className="t">{otherLabel}</div>
            </div>
          </div>
        ) : null}
      </div>
    );
  } else if (style === 'dropdown') {
    const cur = options.find((o) => isOn(o.id));
    const ddLabel = ans.otherSel ? otherLabel : cur ? cur.label : null;
    control = (
      <div className="cf-r-dd">
        <button
          type="button"
          className={
            'cf-r-ddbtn' +
            (ddLabel != null ? '' : ' ph') +
            (ddOpen ? ' open' : '') +
            (invalid ? ' invalid' : '')
          }
          onClick={() => {
            setDdOpen((v) => !v);
          }}
        >
          {ddLabel ?? t('choice.preview.selectPrompt')}
          <Icon name="chevDown" size={17} />
        </button>
        {ddOpen ? (
          <div className="cf-r-ddmenu">
            {options.map((o) => (
              <div
                key={o.id}
                className={'cf-r-ddopt' + (isOn(o.id) ? ' on' : '')}
                aria-label={o.label}
                {...pressable(() => {
                  pick(o.id);
                  setDdOpen(false);
                })}
              >
                {o.label}
                {isOn(o.id) ? <Icon name="check" size={15} /> : null}
              </div>
            ))}
            {other ? (
              <div
                className={'cf-r-ddopt' + (ans.otherSel ? ' on' : '')}
                aria-label={otherLabel}
                {...pressable(() => {
                  pickOther();
                  setDdOpen(false);
                })}
              >
                {otherLabel}
                {ans.otherSel ? <Icon name="check" size={15} /> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  } else if (style === 'segment' || style === 'chips') {
    control = (
      <div className={'cf-r-seg' + (invalid ? ' invalid' : '')}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={'cf-r-pill' + (isOn(o.id) ? ' on' : '')}
            onClick={() => {
              pick(o.id);
            }}
          >
            {o.label}
          </button>
        ))}
        {other ? (
          <button
            type="button"
            className={'cf-r-pill' + (ans.otherSel ? ' on' : '')}
            onClick={pickOther}
          >
            {otherLabel}
          </button>
        ) : null}
      </div>
    );
  } else {
    // tags / multiselect
    const chosen = options.filter((o) => isOn(o.id));
    control = (
      <div className="cf-r-dd">
        <div
          className={'cf-r-tags' + (invalid ? ' invalid' : '') + (tagFocus ? ' focus' : '')}
          aria-label={t('choice.preview.tapToSelect')}
          {...pressable(() => {
            setTagFocus((v) => !v);
          })}
        >
          {chosen.length === 0 && !ans.otherSel ? (
            <span className="ph">{t('choice.preview.tapToSelect')}</span>
          ) : null}
          {chosen.map((o) => (
            <span key={o.id} className="cf-r-tag">
              {o.label}
              <button
                type="button"
                className="x"
                aria-label={t('choice.removeOption')}
                onClick={(e) => {
                  e.stopPropagation();
                  pick(o.id);
                }}
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          {ans.otherSel ? (
            <span className="cf-r-tag">
              {otherLabel}
              <button
                type="button"
                className="x"
                aria-label={t('choice.removeOption')}
                onClick={(e) => {
                  e.stopPropagation();
                  pickOther();
                }}
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ) : null}
        </div>
        {tagFocus ? (
          <div className="cf-r-pop">
            {options.map((o) => (
              <div
                key={o.id}
                className={'cf-r-ddopt' + (isOn(o.id) ? ' on' : '')}
                aria-label={o.label}
                {...pressable(() => {
                  pick(o.id);
                })}
              >
                {o.label}
                {isOn(o.id) ? <Icon name="check" size={15} /> : null}
              </div>
            ))}
            {other ? (
              <div
                className={'cf-r-ddopt' + (ans.otherSel ? ' on' : '')}
                aria-label={otherLabel}
                {...pressable(pickOther)}
              >
                {otherLabel}
                {ans.otherSel ? <Icon name="check" size={15} /> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="cf-resp-scrim">
      <div className="cf-resp-bar">
        <span className="badge">
          <span className="ic">
            <Icon name="eye" size={15} />
          </span>
          {t('choice.resp.title')}
        </span>
        <span className="sub">{t('choice.resp.subtitle')}</span>
        <span className="sp" />
        <button
          type="button"
          className="cf-resp-x"
          aria-label={t('common.close')}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="cf-resp-scroll">
        <div className="cf-resp-form">
          <div className="cf-resp-head">
            <div className="t">{formName !== '' ? formName : t('builder.untitled')}</div>
            {formDescription !== '' ? <div className="d">{formDescription}</div> : null}
          </div>
          <div className="cf-resp-body">
            {submitted && invalid ? (
              <div className="cf-resp-errbanner">
                <span className="ic">
                  <Icon name="warn" size={18} />
                </span>
                <div
                  className="tx"
                  dangerouslySetInnerHTML={{ __html: t('choice.resp.errBanner') }}
                />
              </div>
            ) : null}
            {ok ? (
              <div className="cf-resp-ok">
                <span className="ic">
                  <Icon name="check" size={15} />
                </span>
                {t('choice.resp.okBanner')}
              </div>
            ) : null}

            <div className={'cf-q' + (invalid ? ' invalid' : '')}>
              <div className="qlab">
                {fieldLabel}
                {choice.required ? <span className="req">＊</span> : null}
              </div>
              <div className="qhint">
                {choice.logic === 'multiple'
                  ? t('choice.canvas.descMultiple')
                  : t('choice.canvas.descSingle')}
                <span style={{ color: 'var(--ex-brand)', fontWeight: 650 }}> · {reqRule()}</span>
              </div>
              {control}
              {ans.otherSel ? otherBlock : null}
              {invalid ? (
                <div className="cf-q-err">
                  <Icon name="warn" size={14} />
                  {errs[0]}
                </div>
              ) : null}
            </div>
          </div>
          <div className="cf-resp-foot">
            <button type="button" className="cf-resp-submit" onClick={submit}>
              <Icon name="send" size={16} />
              {t('choice.resp.submit')}
            </button>
            <span className="note">
              {submitted
                ? invalid
                  ? t('choice.resp.footRetry')
                  : t('choice.resp.footOk')
                : t('choice.resp.footInitial')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
