/**
 * Choice-field management UI — visual preview layer (builder spec v2.0).
 * GalleryMini renders the scaled-down style thumbnails for the gallery cards; LivePreview renders
 * the real end-user control shown on the canvas and reused by the public renderer.
 */
import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui';
import {
  countRuleText,
  logicOf,
  type ChoiceState,
  type Translate,
} from '@/features/build-contact-form/lib/choice-core';
import type { ChoiceOtherConfig, ChoiceRatio, ChoiceStyleId } from '@/entities/contact-form';

const RATIO_CSS: Record<ChoiceRatio, string> = { '1:1': '1 / 1', '4:3': '4 / 3', '16:9': '16 / 9' };

/* ---------------- gallery mini preview (案B) ---------------- */
export function GalleryMini({ id, t }: { id: ChoiceStyleId; t: Translate }): ReactNode {
  const sample = [t('choice.sample.pricing'), t('choice.sample.howto'), t('choice.sample.bug')];
  switch (id) {
    case 'radio':
      return (
        <>
          <div className="cf-glp-row">
            <span className="cf-glp-dot on" />
            {sample[0]}
          </div>
          <div className="cf-glp-row">
            <span className="cf-glp-dot" />
            {sample[1]}
          </div>
          <div className="cf-glp-row">
            <span className="cf-glp-dot" />
            {sample[2]}
          </div>
        </>
      );
    case 'checkbox':
      return (
        <>
          <div className="cf-glp-row">
            <span className="cf-glp-sq on" />
            {sample[0]}
          </div>
          <div className="cf-glp-row">
            <span className="cf-glp-sq on" />
            {sample[1]}
          </div>
          <div className="cf-glp-row">
            <span className="cf-glp-sq" />
            {sample[2]}
          </div>
        </>
      );
    case 'dropdown':
      return (
        <div className="cf-glp-dd">
          {sample[0]}
          <Icon name="chevDown" size={12} />
        </div>
      );
    case 'segment':
      return (
        <div className="cf-glp-seg">
          <span className="cf-glp-pill on">{sample[0]}</span>
          <span className="cf-glp-pill">{sample[1]}</span>
          <span className="cf-glp-pill">{sample[2]}</span>
        </div>
      );
    case 'chips':
      return (
        <div className="cf-glp-tags">
          <span className="cf-glp-tag">{sample[0]} ✓</span>
          <span className="cf-glp-tag">{sample[1]} ✓</span>
          <span className="cf-glp-pill" style={{ flex: 'none', padding: '3px 7px' }}>
            {sample[2]}
          </span>
        </div>
      );
    case 'tags':
      return (
        <div
          className="cf-glp-dd"
          style={{ flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start' }}
        >
          <span className="cf-glp-tag">{sample[0]} ✕</span>
          <span className="cf-glp-tag">{sample[1]} ✕</span>
          <span style={{ color: 'var(--ex-faint)', fontSize: 10 }}>＋</span>
        </div>
      );
    default:
      return null;
  }
}

function CountCap({ text }: { text: string }): ReactNode {
  return text !== '' ? (
    <div className="cf-pv-countcap">
      <Icon name="check" size={12} />
      {text}
    </div>
  ) : null;
}

function ReqMark({ show, t }: { show: boolean; t: Translate }): ReactNode {
  return show ? (
    <span className="cf-pv-req" title={t('choice.required')}>
      ＊
    </span>
  ) : null;
}

function OtherFieldBox({ oc, t }: { oc: ChoiceOtherConfig; t: Translate }): ReactNode {
  return (
    <div className="cf-pv-otherbox">
      <div className="cf-pv-otherfield">
        {oc.placeholder !== '' ? oc.placeholder : t('choice.other.freeInput')}
      </div>
      {oc.maxLen > 0 ? <span className="cf-pv-othercount">0 / {oc.maxLen}</span> : null}
    </div>
  );
}

function OtherWrap({
  label,
  oc,
  t,
}: {
  label: string;
  oc: ChoiceOtherConfig;
  t: Translate;
}): ReactNode {
  return (
    <div className="cf-pv-otherwrap">
      <div className="cf-pv-otherlab">
        {t('choice.other.whenSelected', { label })}
        <ReqMark show={oc.required} t={t} />
      </div>
      <OtherFieldBox oc={oc} t={t} />
    </div>
  );
}

function ImgMark({ isCheck, on }: { isCheck: boolean; on: boolean }): ReactNode {
  return isCheck ? (
    <span className={'cf-imgmk check' + (on ? ' on' : '')}>
      <Icon name="check" size={12} />
    </span>
  ) : (
    <span className={'cf-imgmk radio' + (on ? ' on' : '')} />
  );
}

/* ============================================================
   Live preview — renders the real end-user control in the sheet
   ============================================================ */
export function LivePreview({ st, t }: { st: ChoiceState; t: Translate }): ReactNode {
  const { style, options, defaults, other, imgMode, cardLayout, cols, ratio, otherCfg } = st;
  const logic = logicOf(style);
  const isDef = (id: string): boolean => defaults.includes(id);
  const otherLabel = otherCfg.label !== '' ? otherCfg.label : t('choice.other.defaultLabel');
  const crText = logic === 'multiple' ? countRuleText(st.countRule, t) : '';
  const isCheck = style === 'checkbox';

  if (style === 'dropdown') {
    const d = options.find((o) => isDef(o.id));
    return (
      <div className="cf-pv">
        <div className={'cf-pv-dd' + (d ? '' : ' ph')}>
          {d ? d.label : t('choice.preview.selectPrompt')}
          <Icon name="chevDown" size={16} />
        </div>
        {other ? <OtherWrap label={otherLabel} oc={otherCfg} t={t} /> : null}
      </div>
    );
  }

  if (style === 'tags') {
    const chosen = options.filter((o) => isDef(o.id));
    return (
      <div className="cf-pv">
        <CountCap text={crText} />
        <div className="cf-pv-tags">
          {chosen.length > 0 ? (
            chosen.map((o) => (
              <span key={o.id} className="cf-pv-chip">
                {o.label}
                <span className="x">
                  <Icon name="x" size={11} />
                </span>
              </span>
            ))
          ) : (
            <span className="ph">{t('choice.preview.tapToSelect')}</span>
          )}
          {chosen.length > 0 ? (
            <span className="ph" style={{ fontSize: 12 }}>
              ＋
            </span>
          ) : null}
        </div>
        {other ? <OtherWrap label={otherLabel} oc={otherCfg} t={t} /> : null}
      </div>
    );
  }

  if (style === 'segment' || style === 'chips') {
    return (
      <div className="cf-pv">
        <CountCap text={crText} />
        <div className="cf-pv-seg">
          {options.map((o) => (
            <span key={o.id} className={'cf-pv-pill' + (isDef(o.id) ? ' on' : '')}>
              {o.label}
            </span>
          ))}
          {other ? <span className="cf-pv-pill">{otherLabel}</span> : null}
        </div>
        {other ? <OtherWrap label={otherLabel} oc={otherCfg} t={t} /> : null}
      </div>
    );
  }

  if (imgMode && cardLayout === 'list') {
    return (
      <div className="cf-imglist">
        {crText !== '' ? <CountCap text={crText} /> : null}
        {options.map((o) => (
          <div key={o.id} className={'cf-imglist-row' + (isDef(o.id) ? ' on' : '')}>
            <ImgMark isCheck={isCheck} on={isDef(o.id)} />
            <div className="cf-imglist-thumb">
              <span className="cf-imgph" />
            </div>
            <div className="cf-imglist-cap">
              <div className="t">{o.label}</div>
              {o.desc != null && o.desc !== '' ? <div className="d">{o.desc}</div> : null}
            </div>
          </div>
        ))}
        {other ? (
          <div className="cf-imglist-row">
            <ImgMark isCheck={isCheck} on={false} />
            <div className="cf-imglist-thumb dash">
              <Icon name="edit" size={16} />
            </div>
            <div className="cf-imglist-cap">
              <div className="t">
                {otherLabel}
                <ReqMark show={otherCfg.required} t={t} />
              </div>
              <OtherFieldBox oc={otherCfg} t={t} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (imgMode) {
    return (
      <div className={'cf-imgcards cols' + String(cols)}>
        {crText !== '' ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <CountCap text={crText} />
          </div>
        ) : null}
        {options.map((o) => (
          <div key={o.id} className={'cf-imgcard' + (isDef(o.id) ? ' on' : '')}>
            <div className="cf-imgcard-img" style={{ aspectRatio: RATIO_CSS[ratio] }}>
              <span className="cf-imgph" />
              <ImgMark isCheck={isCheck} on={isDef(o.id)} />
            </div>
            <div className="cf-imgcard-cap">
              <div className="t">{o.label}</div>
              {o.desc != null && o.desc !== '' ? <div className="d">{o.desc}</div> : null}
            </div>
          </div>
        ))}
        {other ? (
          <div className="cf-imgcard">
            <div className="cf-imgcard-img dash" style={{ aspectRatio: RATIO_CSS[ratio] }}>
              <Icon name="edit" size={18} />
            </div>
            <div className="cf-imgcard-cap">
              <div className="t">
                {otherLabel}
                <ReqMark show={otherCfg.required} t={t} />
              </div>
              <OtherFieldBox oc={otherCfg} t={t} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // radio / checkbox — plain list
  return (
    <div className="cf-pv-radio">
      <CountCap text={crText} />
      {options.map((o) => (
        <label key={o.id} className={'cf-pv-opt' + (isDef(o.id) ? ' on' : '')}>
          {isCheck ? (
            <span className="cf-pv-sq">
              <Icon name="check" size={13} />
            </span>
          ) : (
            <span className="cf-pv-dot" />
          )}
          <div>
            <div>{o.label}</div>
            {o.desc != null && o.desc !== '' ? <span className="sub">{o.desc}</span> : null}
          </div>
        </label>
      ))}
      {other ? (
        <div className="cf-pv-opt">
          {isCheck ? (
            <span className="cf-pv-sq">
              <Icon name="check" size={13} />
            </span>
          ) : (
            <span className="cf-pv-dot" />
          )}
          <div style={{ flex: 1 }}>
            {otherLabel}
            <ReqMark show={otherCfg.required} t={t} />
            <OtherFieldBox oc={otherCfg} t={t} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
