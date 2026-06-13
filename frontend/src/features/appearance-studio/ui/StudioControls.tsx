import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { Appearance } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { useMediaQuery, useUploadMediaMutation } from '@/entities/media';
import { MEDIA, mediaCss, PRESETS } from '@/features/appearance-studio/model/studio-model';

export type SetPath = (path: string[], value: unknown) => void;

// Makes a non-button element keyboard-activatable (Enter/Space) — for the media-library tiles
// and inline text actions that are styled as plain spans/divs.
function clickProps(fn: () => void): {
  role: 'button';
  tabIndex: 0;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
} {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: fn,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
      }
    },
  };
}

interface SegOpt {
  v: string;
  labelKey: MessageKey;
  icon?: IconName;
}

// ---- primitives ----
function Seg({
  opts,
  value,
  onChange,
}: {
  opts: SegOpt[];
  value: string;
  onChange: (v: string) => void;
}): ReactNode {
  const { t } = useI18n();
  return (
    <div className="st-seg">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          className={value === o.v ? 'on' : ''}
          onClick={() => {
            onChange(o.v);
          }}
        >
          {o.icon !== undefined ? <Icon name={o.icon} size={14} /> : null}
          {t(o.labelKey)}
        </button>
      ))}
    </div>
  );
}

function Swatch({ value, onChange }: { value: string; onChange: (v: string) => void }): ReactNode {
  return (
    <label className="st-swatch">
      <span className="chip" style={{ background: value }} />
      <span className="hex">{value}</span>
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </label>
  );
}

function Slider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}): ReactNode {
  return (
    <input
      className="st-slider"
      type="range"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onChange={(e) => {
        onChange(parseFloat(e.target.value));
      }}
    />
  );
}

function Row({
  t,
  h,
  v,
  children,
}: {
  t: string;
  h?: string;
  v?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="st-row">
      <div className="lab">
        <span className="t">{t}</span>
        {h !== undefined ? <span className="h">{h}</span> : null}
        {v !== undefined ? <span className="v">{v}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  tt,
  td,
  value,
  onChange,
}: {
  tt: string;
  td?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): ReactNode {
  return (
    <div className="st-tog">
      <div>
        <div className="tt">{tt}</div>
        {td !== undefined ? <div className="td">{td}</div> : null}
      </div>
      <button
        type="button"
        className={'st-switch' + (value ? '' : ' off')}
        aria-pressed={value}
        aria-label={tt}
        onClick={() => {
          onChange(!value);
        }}
      />
    </div>
  );
}

function ColorRow({
  nm,
  sub,
  value,
  onChange,
}: {
  nm: string;
  sub?: string;
  value: string;
  onChange: (v: string) => void;
}): ReactNode {
  return (
    <div className="st-swrow">
      <span className="nm">
        {nm}
        {sub !== undefined ? <small>{sub}</small> : null}
      </span>
      <Swatch value={value} onChange={onChange} />
    </div>
  );
}

// ---- preset block (always pinned above the rail) ----
export function Presets({ a, onPick }: { a: Appearance; onPick: (id: string) => void }): ReactNode {
  const { t } = useI18n();
  return (
    <div className="st-presets">
      <div className="cap">
        <Icon name="sparkle" size={13} />
        {t('studio.presetsCap')}
      </div>
      <div className="st-presetgrid">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'st-preset' + (a.preset === p.id ? ' on' : '')}
            onClick={() => {
              onPick(p.id);
            }}
          >
            <span
              className="mini"
              style={{ background: p.swatches[1], border: `1px solid ${p.swatches[2]}` }}
            >
              <b style={{ background: p.swatches[0], color: '#fff' }}>あ</b>
              <span style={{ flex: 1 }} />
              <i style={{ width: 12, height: 12, borderRadius: 4, background: p.swatches[0] }} />
            </span>
            <span className="nm">{t(p.nameKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const FONT_OPTS: SegOpt[] = [
  { v: 'system', labelKey: 'studio.font.system' },
  { v: 'sans', labelKey: 'studio.font.sans' },
  { v: 'serif', labelKey: 'studio.font.serif' },
];

// ---- HERO group (media library: uploaded assets + built-in gradients) ----
function HeroGroup({ a, set }: { a: Appearance; set: SetPath }): ReactNode {
  const { t } = useI18n();
  const [lib, setLib] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: uploaded } = useMediaQuery();
  const upload = useUploadMediaMutation();

  const media = a.hero.media;
  const hasMedia = media !== '';
  const selUpload = (uploaded ?? []).find((m) => m.url === media);
  const selMock = MEDIA.find((m) => m.id === media);
  const selLabel = selUpload
    ? (selUpload.originalName ?? t('studio.media.uploaded'))
    : selMock
      ? t(selMock.labelKey)
      : t('studio.media.none');

  const onPick = (file: File | undefined): void => {
    if (file === undefined) {
      return;
    }
    upload.mutate(file, {
      onSuccess: (asset) => {
        set(['hero', 'media'], asset.url);
      },
    });
  };

  return (
    <>
      <Toggle
        tt={t('studio.hero.on')}
        td={t('studio.hero.onDesc')}
        value={a.hero.on}
        onChange={(v) => {
          set(['hero', 'on'], v);
        }}
      />
      {a.hero.on ? (
        <>
          <div className="st-media">
            <span
              className={'st-media__thumb' + (hasMedia ? '' : ' empty')}
              style={
                hasMedia
                  ? {
                      backgroundImage: mediaCss(media),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!hasMedia ? <Icon name="image" size={18} /> : null}
            </span>
            <div className="st-media__meta">
              <div className="n">{selLabel}</div>
              <div className="acts">
                <span
                  {...clickProps(() => {
                    setLib((o) => !o);
                  })}
                >
                  {hasMedia ? t('studio.media.change') : t('studio.media.choose')}
                </span>
                {hasMedia ? (
                  <span
                    className="rm"
                    {...clickProps(() => {
                      set(['hero', 'media'], '');
                    })}
                  >
                    {t('studio.media.remove')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {lib ? (
            <div className="st-medialib">
              <div className="h">
                <Icon name="lines" size={13} />
                {t('studio.media.library')}
                <span
                  className="x"
                  {...clickProps(() => {
                    setLib(false);
                  })}
                >
                  <Icon name="x" size={14} />
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                hidden
                onChange={(e) => {
                  onPick(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <div className="st-mediagrid">
                <button
                  type="button"
                  className="st-mediaup"
                  disabled={upload.isPending}
                  onClick={() => {
                    fileRef.current?.click();
                  }}
                >
                  <Icon name="plus" size={15} />
                  {upload.isPending ? t('studio.media.uploading') : t('studio.media.upload')}
                </button>
                {(uploaded ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={'st-mediacell' + (media === m.url ? ' on' : '')}
                    style={{
                      backgroundImage: `url("${m.url}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    {...clickProps(() => {
                      set(['hero', 'media'], m.url);
                      setLib(false);
                    })}
                  >
                    {media === m.url ? (
                      <span className="ck">
                        <Icon name="check" size={11} />
                      </span>
                    ) : null}
                  </div>
                ))}
                {MEDIA.map((m) => (
                  <div
                    key={m.id}
                    className={'st-mediacell' + (media === m.id ? ' on' : '')}
                    style={{ background: m.css }}
                    {...clickProps(() => {
                      set(['hero', 'media'], m.id);
                      setLib(false);
                    })}
                  >
                    {media === m.id ? (
                      <span className="ck">
                        <Icon name="check" size={11} />
                      </span>
                    ) : null}
                    <span className="lb">{t(m.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Row t={t('studio.hero.fit')}>
            <Seg
              value={a.hero.fit}
              onChange={(v) => {
                set(['hero', 'fit'], v);
              }}
              opts={[
                { v: 'cover', labelKey: 'studio.hero.fitCover' },
                { v: 'contain', labelKey: 'studio.hero.fitContain' },
              ]}
            />
          </Row>
          <Row t={t('studio.hero.height')} v={`${String(a.hero.height)}px`}>
            <Slider
              min={80}
              max={280}
              step={5}
              value={a.hero.height}
              onChange={(v) => {
                set(['hero', 'height'], v);
              }}
            />
          </Row>
          <Row
            t={t('studio.hero.inset')}
            h={t('studio.hero.insetHint')}
            v={`${String(a.hero.inset)}px`}
          >
            <Slider
              min={0}
              max={28}
              value={a.hero.inset}
              onChange={(v) => {
                set(['hero', 'inset'], v);
              }}
            />
          </Row>
          <Row
            t={t('studio.hero.overlay')}
            h={t('studio.hero.overlayHint')}
            v={`${String(Math.round(a.hero.overlay * 100))}%`}
          >
            <Slider
              min={0}
              max={0.7}
              step={0.05}
              value={a.hero.overlay}
              onChange={(v) => {
                set(['hero', 'overlay'], v);
              }}
            />
          </Row>
          <Toggle
            tt={t('studio.hero.overlayTitle')}
            value={a.hero.overlayTitle}
            onChange={(v) => {
              set(['hero', 'overlayTitle'], v);
            }}
          />
        </>
      ) : null}
    </>
  );
}

const COLOR_ROWS: { key: string; nmKey: MessageKey; subKey: MessageKey }[] = [
  { key: 'accent', nmKey: 'studio.color.accent', subKey: 'studio.color.accentSub' },
  { key: 'surface', nmKey: 'studio.color.surface', subKey: 'studio.color.surfaceSub' },
  { key: 'text', nmKey: 'studio.color.text', subKey: 'studio.color.textSub' },
  { key: 'muted', nmKey: 'studio.color.muted', subKey: 'studio.color.mutedSub' },
  { key: 'inputBg', nmKey: 'studio.color.inputBg', subKey: 'studio.color.inputBgSub' },
  { key: 'error', nmKey: 'studio.color.error', subKey: 'studio.color.errorSub' },
  { key: 'buttonText', nmKey: 'studio.color.buttonText', subKey: 'studio.color.buttonTextSub' },
];

export function GroupBody({
  id,
  a,
  set,
  onReplay,
}: {
  id: string;
  a: Appearance;
  set: SetPath;
  onReplay: () => void;
}): ReactNode {
  const { t } = useI18n();

  if (id === 'theme') {
    return (
      <>
        <div className="st-note">
          <Icon name="bulb" size={14} />
          <span>{t('studio.theme.note')}</span>
        </div>
        <Row t={t('studio.theme.appearance')}>
          <Seg
            value={a.theme}
            onChange={(v) => {
              set(['theme'], v);
            }}
            opts={[
              { v: 'light', labelKey: 'studio.theme.light', icon: 'sun' },
              { v: 'dark', labelKey: 'studio.theme.dark', icon: 'moon' },
            ]}
          />
        </Row>
        <Row t={t('studio.theme.bodyFont')}>
          <Seg
            value={a.font}
            onChange={(v) => {
              set(['font'], v);
            }}
            opts={FONT_OPTS}
          />
        </Row>
        <Row t={t('studio.theme.headingFont')} h={t('studio.theme.headingFontHint')}>
          <Seg
            value={a.fontH}
            onChange={(v) => {
              set(['fontH'], v);
            }}
            opts={FONT_OPTS}
          />
        </Row>
      </>
    );
  }

  if (id === 'color') {
    const c = a.colors as unknown as Record<string, string>;
    return (
      <>
        {COLOR_ROWS.map((r) => (
          <ColorRow
            key={r.key}
            nm={t(r.nmKey)}
            sub={t(r.subKey)}
            value={c[r.key] ?? '#000000'}
            onChange={(v) => {
              set(['colors', r.key], v);
            }}
          />
        ))}
        <ColorRow
          nm={t('studio.color.border')}
          sub={t('studio.color.borderSub')}
          value={a.border.color}
          onChange={(v) => {
            set(['border', 'color'], v);
          }}
        />
      </>
    );
  }

  if (id === 'shape') {
    const quad: { k: string; labelKey: MessageKey }[] = [
      { k: 'overall', labelKey: 'studio.shape.overall' },
      { k: 'form', labelKey: 'studio.shape.form' },
      { k: 'input', labelKey: 'studio.shape.input' },
      { k: 'button', labelKey: 'studio.shape.button' },
    ];
    const radius = a.radius as unknown as Record<string, number>;
    return (
      <>
        <Row t={t('studio.shape.radius')} h={t('studio.shape.radiusHint')}>
          <div className="st-quad">
            {quad.map((q) => {
              const val =
                q.k === 'overall'
                  ? Math.max(a.radius.form, a.radius.input, a.radius.button)
                  : (radius[q.k] ?? 0);
              return (
                <div className="qcell" key={q.k}>
                  <div className="qlab">
                    <span className="t">{t(q.labelKey)}</span>
                    <span className="v">{val}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={28}
                    value={val}
                    onChange={(v) => {
                      if (q.k === 'overall') {
                        set(['radius'], {
                          form: v,
                          input: Math.min(v, 16),
                          button: Math.min(v, 16),
                        });
                      } else {
                        set(['radius', q.k], v);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </Row>
        <Row t={t('studio.shape.density')}>
          <Seg
            value={a.density}
            onChange={(v) => {
              set(['density'], v);
            }}
            opts={[
              { v: 'compact', labelKey: 'studio.shape.compact' },
              { v: 'cozy', labelKey: 'studio.shape.cozy' },
              { v: 'comfortable', labelKey: 'studio.shape.comfortable' },
            ]}
          />
        </Row>
        <Row t={t('studio.shape.buttonStyle')}>
          <Seg
            value={a.button.style}
            onChange={(v) => {
              set(['button', 'style'], v);
            }}
            opts={[
              { v: 'solid', labelKey: 'studio.shape.solid' },
              { v: 'outline', labelKey: 'studio.shape.outline' },
              { v: 'soft', labelKey: 'studio.shape.soft' },
            ]}
          />
        </Row>
        <Toggle
          tt={t('studio.shape.pill')}
          value={a.button.pill}
          onChange={(v) => {
            set(['button', 'pill'], v);
          }}
        />
      </>
    );
  }

  if (id === 'header') {
    return <HeroGroup a={a} set={set} />;
  }

  if (id === 'line') {
    return (
      <>
        <div className="st-sec" style={{ padding: 0, border: 0 }}>
          <Row t={t('studio.line.width')} v={`${String(a.border.width)}px`}>
            <Slider
              min={0}
              max={4}
              step={0.5}
              value={a.border.width}
              onChange={(v) => {
                set(['border', 'width'], v);
              }}
            />
          </Row>
          <Row t={t('studio.line.style')}>
            <Seg
              value={a.border.style}
              onChange={(v) => {
                set(['border', 'style'], v);
              }}
              opts={[
                { v: 'solid', labelKey: 'studio.line.solid' },
                { v: 'dashed', labelKey: 'studio.line.dashed' },
                { v: 'dotted', labelKey: 'studio.line.dotted' },
              ]}
            />
          </Row>
          <div className="st-swrow">
            <span className="nm">{t('studio.line.color')}</span>
            <Swatch
              value={a.border.color}
              onChange={(v) => {
                set(['border', 'color'], v);
              }}
            />
          </div>
        </div>
        <div className="st-sec" style={{ padding: '16px 0 0', border: 0 }}>
          <h4 style={{ margin: '0 0 13px' }}>
            <Icon name="edit" size={13} />
            {t('studio.line.focus')}
          </h4>
          <div className="st-swrow">
            <span className="nm">{t('studio.line.ringColor')}</span>
            <Swatch
              value={a.focus.color}
              onChange={(v) => {
                set(['focus', 'color'], v);
              }}
            />
          </div>
          <Row t={t('studio.line.ringWidth')} v={`${String(a.focus.width)}px`}>
            <Slider
              min={0}
              max={6}
              step={0.5}
              value={a.focus.width}
              onChange={(v) => {
                set(['focus', 'width'], v);
              }}
            />
          </Row>
          <Row t={t('studio.line.ringShape')}>
            <Seg
              value={a.focus.shape}
              onChange={(v) => {
                set(['focus', 'shape'], v);
              }}
              opts={[
                { v: 'ring', labelKey: 'studio.line.ring' },
                { v: 'solid', labelKey: 'studio.line.frame' },
                { v: 'glow', labelKey: 'studio.line.glow' },
              ]}
            />
          </Row>
        </div>
      </>
    );
  }

  if (id === 'motion') {
    return (
      <>
        <Row t={t('studio.motion.anim')}>
          <Seg
            value={a.motion.anim}
            onChange={(v) => {
              set(['motion', 'anim'], v);
              onReplay();
            }}
            opts={[
              { v: 'fade', labelKey: 'studio.motion.fade' },
              { v: 'slide', labelKey: 'studio.motion.slide' },
              { v: 'scale', labelKey: 'studio.motion.scale' },
            ]}
          />
        </Row>
        <Row t={t('studio.motion.speed')} v={`${String(a.motion.speed)}ms`}>
          <Slider
            min={120}
            max={600}
            step={20}
            value={a.motion.speed}
            onChange={(v) => {
              set(['motion', 'speed'], v);
            }}
          />
        </Row>
        <button
          type="button"
          className="st-disc"
          onClick={onReplay}
          style={{
            borderStyle: 'solid',
            borderColor: 'var(--ex-brand-weak-bd)',
            color: 'var(--ex-brand)',
          }}
        >
          <Icon name="play" size={13} />
          {t('studio.motion.replay')}
        </button>
      </>
    );
  }

  // type — depends on the current mode
  if (id === 'type') {
    if (a.mode === 'modal') {
      return (
        <>
          <h4 className="st-subhead">{t('studio.type.modal')}</h4>
          <Row t={t('studio.type.width')} v={`${String(a.modal.width)}px`}>
            <Slider
              min={360}
              max={680}
              step={10}
              value={a.modal.width}
              onChange={(v) => {
                set(['modal', 'width'], v);
              }}
            />
          </Row>
          <Row t={t('studio.type.position')}>
            <Seg
              value={a.modal.position}
              onChange={(v) => {
                set(['modal', 'position'], v);
              }}
              opts={[
                { v: 'center', labelKey: 'studio.type.center' },
                { v: 'right', labelKey: 'studio.type.drawer' },
              ]}
            />
          </Row>
          <Row t={t('studio.type.backdrop')} v={`${String(Math.round(a.modal.backdrop * 100))}%`}>
            <Slider
              min={0}
              max={0.8}
              step={0.05}
              value={a.modal.backdrop}
              onChange={(v) => {
                set(['modal', 'backdrop'], v);
              }}
            />
          </Row>
          <h4 className="st-subhead" style={{ marginTop: 18 }}>
            {t('studio.type.launcher')}
          </h4>
          <Row t={t('studio.type.launcherSide')}>
            <Seg
              value={a.launcher.side}
              onChange={(v) => {
                set(['launcher', 'side'], v);
              }}
              opts={[
                { v: 'left', labelKey: 'studio.type.bottomLeft' },
                { v: 'right', labelKey: 'studio.type.bottomRight' },
              ]}
            />
          </Row>
          <Row t={t('studio.type.launcherShape')}>
            <Seg
              value={a.launcher.shape}
              onChange={(v) => {
                set(['launcher', 'shape'], v);
              }}
              opts={[
                { v: 'pill', labelKey: 'studio.type.pill' },
                { v: 'circle', labelKey: 'studio.type.circle' },
              ]}
            />
          </Row>
        </>
      );
    }
    if (a.mode === 'chat') {
      return (
        <>
          <h4 className="st-subhead">{t('studio.type.chat')}</h4>
          <Toggle
            tt={t('studio.type.oneByOne')}
            td={t('studio.type.oneByOneDesc')}
            value={a.chat.oneByOne}
            onChange={(v) => {
              set(['chat', 'oneByOne'], v);
            }}
          />
          <Toggle
            tt={t('studio.type.progress')}
            value={a.chat.progress}
            onChange={(v) => {
              set(['chat', 'progress'], v);
            }}
          />
          <Toggle
            tt={t('studio.type.typing')}
            value={a.chat.typing}
            onChange={(v) => {
              set(['chat', 'typing'], v);
            }}
          />
        </>
      );
    }
    return (
      <>
        <h4 className="st-subhead">{t('studio.type.inline')}</h4>
        <Row t={t('studio.type.maxWidth')} v={`${String(a.modal.width)}px`}>
          <Slider
            min={360}
            max={680}
            step={10}
            value={a.modal.width}
            onChange={(v) => {
              set(['modal', 'width'], v);
            }}
          />
        </Row>
        <Row t={t('studio.type.align')}>
          <Seg
            value={a.inline.align}
            onChange={(v) => {
              set(['inline', 'align'], v);
            }}
            opts={[
              { v: 'left', labelKey: 'studio.type.left' },
              { v: 'center', labelKey: 'studio.type.alignCenter' },
              { v: 'right', labelKey: 'studio.type.right' },
            ]}
          />
        </Row>
      </>
    );
  }

  return null;
}
