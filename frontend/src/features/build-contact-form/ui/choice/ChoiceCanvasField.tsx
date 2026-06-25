import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { AppError } from '@/shared/api/errors';
import { recordsOptionsQuery, type RecordsOption } from '@/entities/records';
import {
  countRuleText,
  pressable,
  STYLE_BY_ID,
} from '@/features/build-contact-form/lib/choice-core';
import { LivePreview } from '@/features/build-contact-form/lib/choice-preview';
import {
  useDragList,
  type ChoiceField,
} from '@/features/build-contact-form/hooks/use-choice-field';
import { OtherConfig } from '@/features/build-contact-form/ui/choice/OtherConfig';

// Editable option rows (案C, source of truth). Includes the add row and, when enabled, the
// 「その他」 row with a gear popover.
function OptionRows({ choice }: { choice: ChoiceField }): ReactNode {
  const { t } = useI18n();
  const drag = useDragList(choice.move);
  const markCls = choice.logic === 'single' ? 'radio' : 'check';
  const lastRef = useRef<HTMLInputElement>(null);
  const img = choice.imgMode;
  const [otherPop, setOtherPop] = useState(false);
  const oc = choice.otherCfg;
  const otherLabel = oc.label !== '' ? oc.label : t('choice.other.defaultLabel');

  return (
    <div className="cf-ce-opts">
      {choice.options.map((o, i) => {
        const handlers = drag.make(i);
        const isLast = i === choice.options.length - 1;
        return (
          <div
            key={o.id}
            {...handlers}
            className={'cf-ce-opt' + (img ? ' img' : '') + (drag.over === i ? ' drag-over' : '')}
          >
            <button
              type="button"
              className="cf-ce-grip"
              aria-label={t('choice.dragReorder')}
              style={{ paddingTop: img ? 14 : 0 }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' && i > 0) {
                  e.preventDefault();
                  choice.move(i, i - 1);
                } else if (e.key === 'ArrowDown' && i < choice.options.length - 1) {
                  e.preventDefault();
                  choice.move(i, i + 1);
                }
              }}
            >
              <Icon name="drag" size={15} />
            </button>
            <span
              {...pressable(() => {
                choice.toggleDefault(o.id);
              })}
              className={'cf-ce-mark ' + markCls + (choice.defaults.includes(o.id) ? ' on' : '')}
              style={{ marginTop: img ? 13 : 0 }}
              title={
                choice.logic === 'single' ? t('choice.makeDefault') : t('choice.includeDefault')
              }
              aria-label={
                choice.logic === 'single' ? t('choice.makeDefault') : t('choice.includeDefault')
              }
              aria-pressed={choice.defaults.includes(o.id)}
            >
              <span className="ck">
                <Icon name="check" size={12} />
              </span>
            </span>
            {img ? (
              <span
                {...pressable(() => {
                  choice.toggleImg(o.id);
                })}
                className={'cf-ce-drop' + (o.img === true ? ' set' : '')}
                title={t('choice.attachImage')}
                aria-label={t('choice.attachImage')}
              >
                {o.img === true ? (
                  <span className="cf-imgph" />
                ) : (
                  <span className="ic">
                    <Icon name="image" size={16} />
                  </span>
                )}
              </span>
            ) : null}
            {img ? (
              <div className="cf-ce-body2">
                <input
                  className="cf-ce-input"
                  value={o.label}
                  onChange={(e) => {
                    choice.updateOption(o.id, { label: e.target.value });
                  }}
                  placeholder={t('choice.optionPlaceholder')}
                  ref={isLast ? lastRef : null}
                />
                <input
                  className="cf-ce-desc"
                  value={o.desc ?? ''}
                  onChange={(e) => {
                    choice.updateOption(o.id, { desc: e.target.value });
                  }}
                  placeholder={t('choice.descPlaceholder')}
                />
              </div>
            ) : (
              <input
                className="cf-ce-input"
                value={o.label}
                onChange={(e) => {
                  choice.updateOption(o.id, { label: e.target.value });
                }}
                placeholder={t('choice.optionPlaceholder')}
                ref={isLast ? lastRef : null}
              />
            )}
            <button
              type="button"
              className="cf-ce-rm"
              title={t('choice.removeOption')}
              aria-label={t('choice.removeOption')}
              style={{ marginTop: img ? 11 : 0 }}
              onClick={() => {
                choice.removeOption(o.id);
              }}
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        );
      })}

      <div className="cf-ce-add">
        <span className="cf-ce-grip" style={{ opacity: 0 }}>
          <Icon name="drag" size={15} />
        </span>
        <span className={'cf-ce-mark ' + markCls + ' mk'} style={{ opacity: 0.4 }} />
        <input
          placeholder={t('choice.addOptionHint')}
          aria-label={t('choice.addOption')}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            const value = e.currentTarget.value.trim();
            if (e.key === 'Enter' && value !== '') {
              choice.addOption(value);
              e.currentTarget.value = '';
            }
          }}
          onBlur={(e) => {
            const value = e.currentTarget.value.trim();
            if (value !== '') {
              choice.addOption(value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      {choice.other ? (
        <div className="cf-ce-opt" style={{ position: 'relative' }}>
          <span className="cf-ce-grip" style={{ opacity: 0 }}>
            <Icon name="drag" size={15} />
          </span>
          <span className={'cf-ce-mark ' + markCls} style={{ opacity: 0.5 }} />
          <input
            className="cf-ce-input ph"
            value={t('choice.other.rowLabel', { label: otherLabel })}
            readOnly
            aria-label={t('choice.other.defaultLabel')}
          />
          <div className="cf-other-badges">
            {oc.required ? (
              <span className="cf-other-badge req">{t('choice.required')}</span>
            ) : null}
            {oc.maxLen > 0 ? (
              <span className="cf-other-badge">
                {t('choice.other.charsBadge', { n: String(oc.maxLen) })}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className={'cf-other-cog' + (otherPop ? ' on' : '')}
            title={t('choice.other.settings')}
            aria-label={t('choice.other.settings')}
            aria-expanded={otherPop}
            onClick={() => {
              setOtherPop((v) => !v);
            }}
          >
            <Icon name="settings" size={15} />
          </button>
          <button
            type="button"
            className="cf-ce-rm"
            title={t('choice.other.remove')}
            aria-label={t('choice.other.remove')}
            onClick={() => {
              choice.setOther(false);
              setOtherPop(false);
            }}
          >
            <Icon name="x" size={15} />
          </button>
          {otherPop ? (
            <div className="cf-pop" style={{ top: 38, right: 0 }}>
              <div className="cf-pop-head">
                <Icon name="settings" size={15} />
                <span className="t">{t('choice.other.settings')}</span>
                <button
                  type="button"
                  className="x"
                  aria-label={t('common.close')}
                  onClick={() => {
                    setOtherPop(false);
                  }}
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
              <div className="cf-pop-body">
                <OtherConfig choice={choice} compact />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// The selected choice field on the canvas: floating toolbar + label/desc + (conditional) live
// preview strip + editable option rows.
export function ChoiceCanvasField({
  choice,
  label,
  error,
  onOpenGallery,
  onDelete,
  onDuplicate,
}: {
  choice: ChoiceField;
  label: string;
  error?: string | undefined;
  onOpenGallery: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}): ReactNode {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  // Records import (#316): a source-key input → fetch → confirm-replace.
  const [recOpen, setRecOpen] = useState(false);
  const [source, setSource] = useState('');
  const [fetching, setFetching] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<RecordsOption[] | null>(null);
  const style = STYLE_BY_ID[choice.style];
  const listStyle = choice.style === 'radio' || choice.style === 'checkbox';
  const showStrip = !listStyle || choice.imgMode;
  const crText = countRuleText(choice.countRule, t);

  const openBulk = (): void => {
    setBulkText(choice.options.map((o) => o.label).join('\n'));
    setBulk(true);
  };
  const applyBulk = (): void => {
    choice.bulkReplace(bulkText);
    setBulk(false);
  };

  const runRecordsFetch = (): void => {
    setRecError(null);
    setPendingImport(null);
    if (source.trim() === '') {
      setRecError(t('choice.records.errorSource'));
      return;
    }
    setFetching(true);
    void queryClient
      .fetchQuery(recordsOptionsQuery(source))
      .then((items) => {
        if (items.length === 0) {
          setRecError(t('choice.records.empty'));
          return;
        }
        setPendingImport(items);
      })
      .catch((e: unknown) => {
        const status = e instanceof AppError ? e.status : 0;
        setRecError(
          status === 422 ? t('choice.records.errorSource') : t('choice.records.errorUpstream'),
        );
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const applyRecordsImport = (): void => {
    if (pendingImport !== null) {
      choice.importOptions(pendingImport);
      setPendingImport(null);
      setRecOpen(false);
      setSource('');
    }
  };

  return (
    <div
      className={'cf-canvasfield' + (error !== undefined ? ' err' : '')}
      style={{ marginTop: 34 }}
    >
      {error !== undefined ? (
        <div className="fb-ferr" role="alert" style={{ marginBottom: 8 }}>
          <Icon name="warn" size={13} />
          {error}
        </div>
      ) : null}
      <div className="cf-float">
        <button
          type="button"
          className="cf-fbtn-wide"
          onClick={onOpenGallery}
          title={t('choice.changeStyle')}
        >
          <span className="ic">
            <Icon name={style.icon} size={15} />
          </span>
          <span className="lab">{t('choice.style')}</span>
          <span className="nm">{t(style.labelKey)}</span>
          <span className="chev">
            <Icon name="chevDown" size={14} />
          </span>
        </button>
        <div className="div" />
        <button
          type="button"
          className={'cf-fbtn' + (choice.imgMode ? ' on' : '')}
          disabled={!choice.canImage}
          aria-pressed={choice.imgMode}
          aria-label={choice.canImage ? t('choice.tip.image') : t('choice.tip.imageOnly')}
          style={!choice.canImage ? { opacity: 0.32, cursor: 'not-allowed' } : undefined}
          onClick={() => {
            if (choice.canImage) {
              choice.setImgMode((v) => !v);
            }
          }}
        >
          <Icon name="image" size={16} />
          <span className="tip">
            {choice.canImage ? t('choice.tip.image') : t('choice.tip.imageOnly')}
          </span>
        </button>
        <button
          type="button"
          className={'cf-fbtn' + (choice.other ? ' on' : '')}
          aria-pressed={choice.other}
          aria-label={t('choice.tip.other')}
          onClick={() => {
            choice.setOther((v) => !v);
          }}
        >
          <Icon name="plus" size={16} />
          <span className="tip">{t('choice.tip.other')}</span>
        </button>
        <button
          type="button"
          className={'cf-fbtn' + (bulk ? ' on' : '')}
          aria-pressed={bulk}
          aria-label={t('choice.tip.bulk')}
          onClick={() => {
            if (bulk) {
              setBulk(false);
            } else {
              openBulk();
            }
          }}
        >
          <Icon name="lines" size={16} />
          <span className="tip">{t('choice.tip.bulk')}</span>
        </button>
        <button
          type="button"
          className={'cf-fbtn' + (recOpen ? ' on' : '')}
          aria-pressed={recOpen}
          aria-label={t('choice.records.import')}
          onClick={() => {
            setRecOpen((v) => !v);
            setRecError(null);
            setPendingImport(null);
          }}
        >
          <Icon name="external" size={16} />
          <span className="tip">{t('choice.records.import')}</span>
        </button>
        <div className="div" />
        <button
          type="button"
          className="cf-fbtn"
          aria-label={t('choice.tip.duplicate')}
          onClick={onDuplicate}
        >
          <Icon name="copy" size={16} />
          <span className="tip">{t('choice.tip.duplicate')}</span>
        </button>
        <button
          type="button"
          className="cf-fbtn"
          aria-label={t('choice.tip.delete')}
          onClick={onDelete}
        >
          <Icon name="trash" size={16} />
          <span className="tip">{t('choice.tip.delete')}</span>
        </button>
      </div>

      <div className="flab">
        {label}
        {choice.required ? <span className="req">＊</span> : null}
      </div>
      <div className="fdesc">
        {choice.logic === 'multiple'
          ? t('choice.canvas.descMultiple')
          : t('choice.canvas.descSingle')}
      </div>

      {showStrip ? (
        <div className="cf-previewstrip">
          <div className="ttl">
            <span className="d" />
            {t('choice.preview.shownAs')}
          </div>
          <LivePreview st={choice} t={t} />
        </div>
      ) : null}

      {bulk ? (
        <div className="cf-ce-bulk">
          <h5>{t('choice.bulk.title')}</h5>
          <p>{t('choice.bulk.desc')}</p>
          <textarea
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
            }}
            placeholder={t('choice.bulk.placeholder')}
          />
          <div className="cf-ce-bulk-act">
            <button
              type="button"
              className="ex-btn ghost"
              onClick={() => {
                setBulk(false);
              }}
            >
              {t('choice.cancel')}
            </button>
            <button type="button" className="ex-btn" onClick={applyBulk}>
              <Icon name="check" size={14} />
              {t('choice.bulk.replace')}
            </button>
          </div>
        </div>
      ) : null}

      {recOpen ? (
        <div className="cf-ce-bulk">
          <h5>{t('choice.records.import')}</h5>
          <p>{t('choice.records.desc')}</p>
          <div className="cf-rec-row">
            <input
              className="cf-rec-input"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
              }}
              placeholder={t('choice.records.sourcePh')}
              aria-label={t('choice.records.sourceLabel')}
            />
            <button type="button" className="ex-btn" disabled={fetching} onClick={runRecordsFetch}>
              {fetching ? t('choice.records.loading') : t('choice.records.fetch')}
            </button>
          </div>
          {recError !== null ? (
            <div className="cf-rec-err" role="alert">
              <Icon name="warn" size={13} />
              {recError}
            </div>
          ) : null}
          {pendingImport !== null ? (
            <div className="cf-rec-confirm">
              <span>
                {t('choice.records.confirmReplace', { n: String(choice.options.length) })}
              </span>
              <div className="cf-ce-bulk-act">
                <button
                  type="button"
                  className="ex-btn ghost"
                  onClick={() => {
                    setPendingImport(null);
                  }}
                >
                  {t('choice.cancel')}
                </button>
                <button type="button" className="ex-btn" onClick={applyRecordsImport}>
                  <Icon name="check" size={14} />
                  {t('choice.records.replace')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showStrip ? (
        <div className="cf-ce-sublabel">
          <Icon name="list" size={13} />
          {t('choice.editOptions')}
          <span className="ct">
            {t('choice.optionCount', { n: String(choice.options.length) })}
          </span>
          <span className="sp" />
          <span className="lnk" {...pressable(openBulk)}>
            <Icon name="lines" size={12} />
            {t('choice.tip.bulk')}
          </span>
        </div>
      ) : null}
      {!showStrip && choice.logic === 'multiple' && crText !== '' ? (
        <div className="cf-pv-countcap" style={{ marginBottom: 12 }}>
          <Icon name="check" size={12} />
          {crText}
        </div>
      ) : null}

      <OptionRows choice={choice} />

      <div className="cf-canvasnote">
        <Icon name="bulb" size={13} />
        {choice.logic === 'single'
          ? t('choice.canvas.noteSingle')
          : t('choice.canvas.noteMultiple')}
      </div>
    </div>
  );
}
