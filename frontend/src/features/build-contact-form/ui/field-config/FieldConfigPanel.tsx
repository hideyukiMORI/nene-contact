/**
 * Per-field-type configuration panel (field-config UI). Renders the shared BasicBlock (type chip
 * + purpose banner + label / description / required) followed by the type-specific sections built
 * from the shared controls. Select fields use the dedicated ChoicePanel instead.
 */
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import type {
  CharLimit as CharLimitModel,
  DateConfig,
  DraftField,
  EmailConfig,
  FieldTypeConfig,
  FileConfig,
  PhoneConfig,
  TextConfig,
  TextareaConfig,
} from '@/entities/contact-form';
import { FIELD_PURPOSE_KEY, FIELD_TYPE_ICON } from '@/features/build-contact-form/lib/field-types';
import {
  ChipGroup,
  CtrlRow,
  FieldText,
  Note,
  PickList,
  SegBlock,
  Stepper,
  Toggle,
} from '@/features/build-contact-form/ui/field-config/controls';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

export interface FieldConfigPanelProps {
  field: DraftField;
  label: string;
  typeLabel: string;
  onLabel: (v: string) => void;
  update: (patch: Partial<DraftField>) => void;
}

function BasicBlock({
  field,
  label,
  typeLabel,
  onLabel,
  update,
  t,
}: FieldConfigPanelProps & { t: Translate }): ReactNode {
  return (
    <div className="bd-psec">
      <div className="fc-purpose">
        <span className="ic">
          <Icon name={FIELD_TYPE_ICON[field.fieldType] ?? 'text'} size={17} />
        </span>
        <div className="tx">
          <b>{t('fc.purpose.heading', { label: typeLabel })}</b>
          {t(FIELD_PURPOSE_KEY[field.fieldType] ?? 'fc.purpose.text')}
        </div>
      </div>
      <FieldText
        label={t('builder.fieldLabel')}
        value={label}
        onChange={onLabel}
        placeholder={t('fc.label.ph')}
      />
      <FieldText
        label={t('fc.desc.label')}
        optLabel={t('choice.optional')}
        value={field.description}
        onChange={(v) => {
          update({ description: v });
        }}
        placeholder={t('fc.desc.ph')}
      />
      <Toggle
        tl={t('fc.required.tl')}
        td={t('fc.required.td')}
        on={field.required}
        onChange={(v) => {
          update({ required: v });
        }}
      />
    </div>
  );
}

function charLimitSummary(cl: CharLimitModel, t: Translate): string {
  const lo = cl.minOn ? cl.min : null;
  const hi = cl.maxOn ? cl.max : null;
  if (lo != null && hi != null) return t('fc.charlimit.range', { lo: String(lo), hi: String(hi) });
  if (lo != null) return t('fc.charlimit.min', { n: String(lo) });
  if (hi != null) return t('fc.charlimit.max', { n: String(hi) });
  return '';
}

function CharLimit({
  cl,
  setCl,
  t,
}: {
  cl: CharLimitModel;
  setCl: (patch: Partial<CharLimitModel>) => void;
  t: Translate;
}): ReactNode {
  const conflict = cl.minOn && cl.maxOn && cl.min > cl.max;
  const summary = charLimitSummary(cl, t);
  return (
    <div className="bd-psec">
      <h4>{t('fc.charlimit.title')}</h4>
      <p className="fc-rulehead">{t('fc.charlimit.head')}</p>
      <div className="cf-rulegrid">
        <div className="cf-rulerow">
          <div className="tx">
            <div className="tl">
              {cl.minOn ? t('fc.charlimit.minOn') : t('fc.charlimit.minOff')}
            </div>
            <div className="td">{t('fc.charlimit.minDesc')}</div>
          </div>
          <button
            type="button"
            className={'cf-switch' + (cl.minOn ? '' : ' off')}
            role="switch"
            aria-checked={cl.minOn}
            aria-label={t('fc.charlimit.minOn')}
            onClick={() => {
              setCl({ minOn: !cl.minOn });
            }}
          />
          <Stepper
            value={cl.min}
            min={1}
            max={cl.maxOn ? cl.max : 9999}
            disabled={!cl.minOn}
            set={(v) => {
              setCl({ min: v });
            }}
          />
        </div>
        <div className="cf-rulerow">
          <div className="tx">
            <div className="tl">
              {cl.maxOn ? t('fc.charlimit.maxOn') : t('fc.charlimit.maxOff')}
            </div>
            <div className="td">{t('fc.charlimit.maxDesc')}</div>
          </div>
          <button
            type="button"
            className={'cf-switch' + (cl.maxOn ? '' : ' off')}
            role="switch"
            aria-checked={cl.maxOn}
            aria-label={t('fc.charlimit.maxOn')}
            onClick={() => {
              setCl({ maxOn: !cl.maxOn });
            }}
          />
          <Stepper
            value={cl.max}
            min={cl.minOn ? cl.min : 1}
            max={9999}
            disabled={!cl.maxOn}
            set={(v) => {
              setCl({ max: v });
            }}
          />
        </div>
      </div>
      {conflict ? (
        <div className="cf-rulewarn">
          <Icon name="warn" size={13} />
          {t('fc.charlimit.conflict')}
        </div>
      ) : null}
      {!conflict && cl.maxOn ? (
        <div style={{ marginTop: 12 }}>
          <Toggle
            tl={t('fc.charlimit.counterTl')}
            td={t('fc.charlimit.counterTd')}
            on={cl.counter}
            onChange={(v) => {
              setCl({ counter: v });
            }}
          />
        </div>
      ) : null}
      {!conflict && summary !== '' ? (
        <div
          className="cf-rulesummary"
          style={{ marginTop: 10 }}
          dangerouslySetInnerHTML={{ __html: t('fc.charlimit.summary', { rule: summary }) }}
        />
      ) : null}
    </div>
  );
}

// Type-specific sections. Each receives the typed config + a setter that patches typeConfig.
function TypeSections({
  field,
  update,
  t,
}: {
  field: DraftField;
  update: (patch: Partial<DraftField>) => void;
  t: Translate;
}): ReactNode {
  const base = field.typeConfig;
  if (base == null) {
    return null;
  }
  const setCfg = (patch: Partial<FieldTypeConfig>): void => {
    update({ typeConfig: { ...base, ...patch } as FieldTypeConfig });
  };

  switch (field.fieldType) {
    case 'text': {
      const c = base as TextConfig;
      return (
        <>
          <div className="bd-psec">
            <h4>{t('fc.text.control')}</h4>
            <FieldText
              label={t('fc.ph.label')}
              optLabel={t('choice.optional')}
              value={field.placeholder}
              onChange={(v) => {
                update({ placeholder: v });
              }}
              placeholder={t('fc.text.ph.ph')}
            />
            <CtrlRow label={t('fc.text.format')}>
              <SegBlock
                value={c.format}
                onChange={(v) => {
                  setCfg({ format: v });
                }}
                options={[
                  { v: 'none', label: t('fc.format.free') },
                  { v: 'kana', label: t('fc.format.kana') },
                  { v: 'alnum', label: t('fc.format.alnum') },
                ]}
              />
            </CtrlRow>
            <Note>{t('fc.text.formatNote')}</Note>
          </div>
          <CharLimit
            cl={c}
            setCl={(p) => {
              setCfg(p);
            }}
            t={t}
          />
        </>
      );
    }
    case 'email': {
      const c = base as EmailConfig;
      const allow = c.domainMode === 'allow';
      return (
        <>
          <div className="bd-psec">
            <h4>{t('fc.email.control')}</h4>
            <FieldText
              label={t('fc.ph.label')}
              optLabel={t('choice.optional')}
              value={field.placeholder}
              onChange={(v) => {
                update({ placeholder: v });
              }}
              placeholder={t('fc.email.ph.ph')}
            />
            <Toggle
              tl={t('fc.email.confirm.tl')}
              td={t('fc.email.confirm.td')}
              on={c.confirm}
              onChange={(v) => {
                setCfg({ confirm: v });
              }}
            />
          </div>
          <div className="bd-psec">
            <h4>{t('fc.email.domain')}</h4>
            <SegBlock
              value={c.domainMode}
              onChange={(v) => {
                setCfg({ domainMode: v });
              }}
              options={[
                { v: 'none', label: t('fc.domain.none') },
                { v: 'allow', label: t('fc.domain.allow') },
                { v: 'block', label: t('fc.domain.block') },
              ]}
            />
            {c.domainMode !== 'none' ? (
              <div style={{ marginTop: 12 }}>
                <FieldText
                  label={allow ? t('fc.email.domainAllow') : t('fc.email.domainBlock')}
                  mono
                  value={c.domains}
                  onChange={(v) => {
                    setCfg({ domains: v });
                  }}
                  placeholder={t('fc.email.domainPh')}
                />
              </div>
            ) : null}
            <Note>
              {t('fc.email.domainNotePre')}
              {allow ? t('fc.email.domainNoteAllow') : t('fc.email.domainNoteBlock')}
            </Note>
          </div>
          <div className="bd-psec">
            <h4>{t('fc.email.autoreply')}</h4>
            <Toggle
              tl={t('fc.email.autoreply.tl')}
              td={t('fc.email.autoreply.td')}
              on={c.autoreply}
              onChange={(v) => {
                setCfg({ autoreply: v });
              }}
            />
          </div>
        </>
      );
    }
    case 'phone': {
      const c = base as PhoneConfig;
      return (
        <div className="bd-psec">
          <h4>{t('fc.phone.control')}</h4>
          <FieldText
            label={t('fc.ph.label')}
            optLabel={t('choice.optional')}
            value={field.placeholder}
            onChange={(v) => {
              update({ placeholder: v });
            }}
            placeholder={t('fc.phone.ph.ph')}
          />
          <CtrlRow label={t('fc.phone.format')}>
            <SegBlock
              value={c.format}
              onChange={(v) => {
                setCfg({ format: v });
              }}
              options={[
                { v: 'jp', label: t('fc.phoneFormat.jp') },
                { v: 'jp-nohyphen', label: t('fc.phoneFormat.nohyphen') },
                { v: 'intl', label: t('fc.phoneFormat.intl') },
              ]}
            />
          </CtrlRow>
          <Note>{c.format === 'intl' ? t('fc.phone.noteIntl') : t('fc.phone.noteJp')}</Note>
        </div>
      );
    }
    case 'textarea': {
      const c = base as TextareaConfig;
      return (
        <>
          <div className="bd-psec">
            <h4>{t('fc.long.control')}</h4>
            <FieldText
              label={t('fc.ph.label')}
              optLabel={t('choice.optional')}
              value={field.placeholder}
              onChange={(v) => {
                update({ placeholder: v });
              }}
              placeholder={t('fc.long.ph.ph')}
            />
            <CtrlRow label={t('fc.long.height')}>
              <SegBlock
                value={c.rows}
                onChange={(v) => {
                  setCfg({ rows: v });
                }}
                options={[
                  { v: 'sm', label: t('fc.rows.sm') },
                  { v: 'md', label: t('fc.rows.md') },
                  { v: 'lg', label: t('fc.rows.lg') },
                ]}
              />
            </CtrlRow>
            <Note>{t('fc.long.heightNote')}</Note>
          </div>
          <CharLimit
            cl={c}
            setCl={(p) => {
              setCfg(p);
            }}
            t={t}
          />
        </>
      );
    }
    case 'date': {
      const c = base as DateConfig;
      return (
        <>
          <div className="bd-psec">
            <h4>{t('fc.date.kind')}</h4>
            <SegBlock
              value={c.mode}
              onChange={(v) => {
                setCfg({ mode: v });
              }}
              options={[
                { v: 'date', label: t('fc.dateMode.date') },
                { v: 'datetime', label: t('fc.dateMode.datetime') },
                { v: 'time', label: t('fc.dateMode.time') },
              ]}
            />
          </div>
          <div className="bd-psec">
            <h4>{t('fc.date.range')}</h4>
            <PickList
              value={c.range}
              onChange={(v) => {
                setCfg({ range: v });
              }}
              options={[
                { v: 'none', t: t('fc.dateRange.none.t'), d: t('fc.dateRange.none.d') },
                { v: 'future', t: t('fc.dateRange.future.t'), d: t('fc.dateRange.future.d') },
                { v: 'past', t: t('fc.dateRange.past.t'), d: t('fc.dateRange.past.d') },
                { v: 'between', t: t('fc.dateRange.between.t'), d: t('fc.dateRange.between.d') },
              ]}
            />
            {c.range === 'between' ? (
              <div className="fc-row2" style={{ marginTop: 12 }}>
                <FieldText
                  label={t('fc.date.from')}
                  type="date"
                  value={c.from}
                  onChange={(v) => {
                    setCfg({ from: v });
                  }}
                />
                <FieldText
                  label={t('fc.date.to')}
                  type="date"
                  value={c.to}
                  onChange={(v) => {
                    setCfg({ to: v });
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="bd-psec">
            <h4>{t('fc.date.def')}</h4>
            <SegBlock
              value={c.def}
              onChange={(v) => {
                setCfg({ def: v });
              }}
              options={[
                { v: 'none', label: t('fc.dateDef.none') },
                { v: 'today', label: t('fc.dateDef.today') },
              ]}
            />
            <Note>{t('fc.date.defNote')}</Note>
          </div>
        </>
      );
    }
    case 'file': {
      const c = base as FileConfig;
      const none = !c.fmtImage && !c.fmtPdf && !c.fmtDoc;
      return (
        <>
          <div className="bd-psec">
            <h4>{t('fc.file.formats')}</h4>
            <ChipGroup
              items={[
                {
                  key: 'img',
                  label: t('fc.file.image'),
                  sub: t('fc.file.imageSub'),
                  icon: 'image',
                  on: c.fmtImage,
                  toggle: () => {
                    setCfg({ fmtImage: !c.fmtImage });
                  },
                },
                {
                  key: 'pdf',
                  label: t('fc.file.pdf'),
                  icon: 'file',
                  on: c.fmtPdf,
                  toggle: () => {
                    setCfg({ fmtPdf: !c.fmtPdf });
                  },
                },
                {
                  key: 'doc',
                  label: t('fc.file.doc'),
                  sub: t('fc.file.docSub'),
                  icon: 'lines',
                  on: c.fmtDoc,
                  toggle: () => {
                    setCfg({ fmtDoc: !c.fmtDoc });
                  },
                },
              ]}
            />
            {none ? (
              <Note icon="warn">{t('fc.file.noneWarn')}</Note>
            ) : (
              <Note>{t('fc.file.formatNote')}</Note>
            )}
          </div>
          <div className="bd-psec">
            <h4>{t('fc.file.sizeCount')}</h4>
            <CtrlRow label={t('fc.file.size')}>
              <SegBlock
                value={c.maxSize}
                onChange={(v) => {
                  setCfg({ maxSize: v });
                }}
                options={[
                  { v: 5, label: '5MB' },
                  { v: 10, label: '10MB' },
                  { v: 25, label: '25MB' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label={t('fc.file.count')}>
              <SegBlock
                value={c.multiple}
                onChange={(v) => {
                  setCfg({ multiple: v });
                }}
                options={[
                  { v: false, label: t('fc.file.single') },
                  { v: true, label: t('fc.file.multiple') },
                ]}
              />
            </CtrlRow>
            {c.multiple ? (
              <CtrlRow label={t('fc.file.maxCount')}>
                <Stepper
                  value={c.maxCount}
                  min={2}
                  max={20}
                  set={(v) => {
                    setCfg({ maxCount: v });
                  }}
                />
              </CtrlRow>
            ) : null}
          </div>
        </>
      );
    }
    default:
      return null;
  }
}

export function FieldConfigPanel(props: FieldConfigPanelProps): ReactNode {
  const { t } = useI18n();
  return (
    <>
      <BasicBlock {...props} t={t} />
      <TypeSections field={props.field} update={props.update} t={t} />
    </>
  );
}
