import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Appearance } from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { mediaCss } from '@/features/appearance-studio/model/studio-model';
import { pvVars } from '@/features/appearance-studio/lib/pv-vars';

// Live, fully token-driven rendition of the public form in the chosen mode (spec §5). Mirrors
// window.StudioPreview. The fields are representative mock content (this is a design preview).

function Field({
  label,
  ph,
  req,
  area,
}: {
  label: string;
  ph: string;
  req?: boolean;
  area?: boolean;
}): ReactNode {
  return (
    <div className="pv-field">
      <label className="fl">
        {label}
        {req === true ? <span className="rq">＊</span> : null}
      </label>
      {area === true ? (
        <textarea className="pv-input area" placeholder={ph} defaultValue="" />
      ) : (
        <input className="pv-input" placeholder={ph} defaultValue="" />
      )}
    </div>
  );
}

function Hero({ a, title, desc }: { a: Appearance; title: string; desc: string }): ReactNode {
  if (!a.hero.on) {
    return null;
  }
  return (
    <div
      className="pv-hero"
      style={{
        height: a.hero.height,
        margin: a.hero.inset,
        background: mediaCss(a.hero.media),
        backgroundSize: a.hero.fit,
      }}
    >
      <div
        className="pv-hero__ov"
        style={{ background: `rgba(10,14,20,${String(a.hero.overlay)})` }}
      />
      {a.hero.overlayTitle ? (
        <div className="pv-hero__txt">
          <h3 className="ttl">{title}</h3>
          <p className="desc">{desc}</p>
        </div>
      ) : null}
    </div>
  );
}

function FormInner({ a, compact }: { a: Appearance; compact?: boolean }): ReactNode {
  const { t } = useI18n();
  const title = t('studio.pv.title');
  const heroTitle = a.hero.on && a.hero.overlayTitle;
  return (
    <div className={`pv-form pv-focus-${a.focus.shape}`}>
      <Hero a={a} title={title} desc={t('studio.pv.heroDesc')} />
      {!heroTitle ? <h3 className="ttl">{title}</h3> : null}
      {!heroTitle ? <p className="desc">{t('studio.pv.desc')}</p> : null}
      <div className="pv-fields">
        <Field label={t('studio.pv.name')} ph={t('studio.pv.namePh')} req />
        <Field label={t('studio.pv.email')} ph={t('studio.pv.emailPh')} req />
        {compact !== true ? (
          <Field label={t('studio.pv.message')} ph={t('studio.pv.messagePh')} req area />
        ) : null}
        <button className={`pv-btn pv-btn--${a.button.style}`} type="button">
          {t('studio.pv.submit')}
          <Icon name="send" size={16} />
        </button>
      </div>
      <div className="pv-foot">{t('studio.pv.foot')}</div>
    </div>
  );
}

function FauxSite({ dark }: { dark: boolean }): ReactNode {
  const barStyle = dark ? { background: '#18212e', borderColor: '#2b3848' } : undefined;
  const dot = dark ? { background: '#2b3848' } : undefined;
  const line = dark ? { background: '#1c2735' } : undefined;
  return (
    <div className="pv-site" style={dark ? { background: '#0f1722' } : undefined}>
      <div className="bar" style={barStyle}>
        <i style={dot} />
        <i style={dot} />
        <i style={dot} />
        <span className="u" style={dark ? { background: '#22303f' } : undefined} />
      </div>
      <div className="skel">
        <div className="l t" style={dark ? { background: '#22303f' } : undefined} />
        <div className="l s" style={line} />
        <div className="l s2" style={line} />
        <div className="l s3" style={line} />
        <div className="l s" style={line} />
        {!dark ? <div className="l s2" /> : null}
      </div>
    </div>
  );
}

function ChatPanel({ a }: { a: Appearance }): ReactNode {
  const { t } = useI18n();
  const total = 4;
  const step = 2;
  return (
    <div className="pv-chat">
      <div
        className="pv-chat__hd"
        style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
      >
        <span className="av">
          <Icon name="send" size={17} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="nm">{t('studio.pv.title')}</div>
          <div className="ol">
            <i />
            {t('studio.pv.chatOnline')}
          </div>
        </div>
      </div>
      {a.chat.progress ? (
        <div className="pv-prog">
          <i style={{ width: `${String((step / total) * 100)}%` }} />
        </div>
      ) : null}
      <div className="pv-chat__body">
        <div className="pv-bubble bot">{t('studio.pv.chatGreeting')}</div>
        <div className="pv-bubble bot">{t('studio.pv.chatAskName')}</div>
        <div className="pv-bubble me">{t('studio.pv.namePh')}</div>
        <div className="pv-chat__q">
          {t('studio.pv.chatAskEmail')}
          {a.chat.progress ? (
            <span
              style={{ color: 'var(--pv-muted)', fontWeight: 500, fontSize: 11, marginLeft: 6 }}
            >
              {step} / {total}
            </span>
          ) : null}
        </div>
      </div>
      <div className="pv-chat__ft">
        <span className="ci">{t('studio.pv.emailPh')}</span>
        <span className="pv-chat__send">
          <Icon name="send" size={17} />
        </span>
      </div>
    </div>
  );
}

// Visible end-state is the base; mounts hidden (data-in=0) then transitions in. Keyed by
// playKey in the parent so each replay remounts and re-animates (reduced-motion safe via CSS).
function AnimLayer({ anim, children }: { anim: string; children: ReactNode }): ReactNode {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      setShown(true);
    }, 30);
    return () => {
      clearTimeout(id);
    };
  }, []);
  return (
    <div className="pv-anim" data-anim={anim} data-in={shown ? '1' : '0'}>
      {children}
    </div>
  );
}

export function StudioPreview({ a, playKey }: { a: Appearance; playKey: number }): ReactNode {
  const { t } = useI18n();
  const dark = a.theme === 'dark';
  return (
    <div
      className="pv-frame"
      style={{
        ...pvVars(a),
        width: 720,
        height: 600,
        background: dark ? a.colors.surface : '#fff',
      }}
    >
      <FauxSite dark={dark} />

      {a.mode === 'inline' ? (
        <div className="pv-embed" style={{ background: a.colors.surface }}>
          <FormInner a={a} />
        </div>
      ) : null}

      {a.mode === 'modal' ? (
        <>
          <span className={`pv-launcher ${a.launcher.side} ${a.launcher.shape}`}>
            <Icon name="chat" size={19} />
            {a.launcher.shape === 'pill' ? (
              <span>{a.launcher.label || t('studio.pv.launcher')}</span>
            ) : null}
          </span>
          <AnimLayer anim={a.motion.anim} key={playKey}>
            <div className="pv-backdrop" />
            <div className={`pv-modal ${a.modal.position}`}>
              <button className="pv-x" type="button" aria-label={t('common.close')}>
                <Icon name="x" size={15} />
              </button>
              <FormInner a={a} />
            </div>
          </AnimLayer>
        </>
      ) : null}

      {a.mode === 'chat' ? (
        <AnimLayer anim={a.motion.anim} key={playKey}>
          <ChatPanel a={a} />
        </AnimLayer>
      ) : null}
    </div>
  );
}
