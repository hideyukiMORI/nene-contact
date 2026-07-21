/*
 * NeNe Contact embed widget (embed-widget-spec + Appearance Studio appearance v2). Paste:
 *
 *   <script src="https://{host}/embed.js" data-form="{public_form_key}"
 *           data-lang="ja" async></script>
 *
 * Vanilla JS, CSP-friendly (no eval; DOM built via createElement/textContent), isolated in a
 * shadow root. Themed entirely by the per-form `appearance` from the schema, applied as the
 * same --pv-* CSS variables + .pv-* rules the studio preview uses (spec §5/§6). CORS "simple"
 * requests only (GET schema, multipart upload, text/plain JSON submit) so no preflight.
 *
 * Display mode comes from appearance.mode (modal | chat | inline); data-trigger overrides it.
 * chat opens a docked conversational panel that asks each field one at a time (the stepper);
 * modal opens the full themed form behind a launcher; inline renders the form in page flow.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    return;
  }

  var formKey = script.getAttribute('data-form');
  if (!formKey) {
    return;
  }

  var base;
  try {
    base = new URL(script.src).origin;
  } catch (e) {
    return;
  }

  var triggerAttr = script.getAttribute('data-trigger') || '';
  var langAttr = script.getAttribute('data-lang') || '';
  var buttonLabelAttr = script.getAttribute('data-button-label') || '';

  var api = base + '/public/forms/' + encodeURIComponent(formKey);

  // Web-safe font stacks only (no host-page dependency; spec §0/§13). The studio preview uses
  // the loaded console fonts; the embed stays portable.
  var FONTS = {
    system: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
    sans: '"Helvetica Neue",Arial,sans-serif',
    serif: 'Georgia,"Times New Roman",serif',
    // Brand stack: self-hosted Zen Kaku Gothic New (see ensureBrandFonts) with web-safe JP
    // fallbacks so text stays readable before the woff2 loads / if font-src is blocked.
    brand: '"Zen Kaku Gothic New",-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic Medium",Meiryo,sans-serif'
  };
  // Monospace slot for the hero kicker (eyebrow). Self-hosted IBM Plex Mono when the brand
  // fonts are injected; falls back to the platform monospace otherwise.
  var FONT_MONO = '"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
  var DENSITY = {
    compact: { y: 8, x: 11, gap: 10, mb: 5 },
    cozy: { y: 11, x: 13, gap: 14, mb: 6 },
    comfortable: { y: 14, x: 15, gap: 18, mb: 8 }
  };
  // Mock media library (gradient placeholders); mirrors the studio model until uploaded assets
  // land. A hero.media that looks like a URL/data-URI is used directly as the background image.
  var MEDIA = {
    'm-team': 'linear-gradient(120deg,#3b5168,#6f8aa6 60%,#b9c8d8)',
    'm-office': 'linear-gradient(120deg,#c9d3de,#e7edf3 55%,#aeb9c6)',
    'm-warm': 'linear-gradient(125deg,#d9663f,#e69a6b 55%,#f0c9a6)',
    'm-teal': 'linear-gradient(125deg,#1f5b57,#2f8f86 60%,#7fc2ba)',
    'm-desk': 'linear-gradient(120deg,#7c6a58,#b39c83 55%,#e0d2bf)',
    'm-dark': 'linear-gradient(125deg,#1a2230,#2b3a4f 60%,#46607d)'
  };
  var MODES = { modal: 1, chat: 1, inline: 1, button: 1 };

  fetch(api + '/schema', { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) {
        throw new Error('schema unavailable');
      }
      return r.json();
    })
    .then(function (schema) {
      mount(schema, resolveAppearance(schema));
    })
    .catch(function () {
      /* fail silently — never break the host page */
    });

  function pick(obj, key, ok, fallback) {
    var v = obj && typeof obj === 'object' ? obj[key] : undefined;
    return ok(v) ? v : fallback;
  }
  function isStr(v) {
    return typeof v === 'string' && v !== '';
  }
  function inRange(min, max) {
    return function (v) {
      return typeof v === 'number' && v >= min && v <= max;
    };
  }
  function isOneOf(list) {
    return function (v) {
      return list.indexOf(v) !== -1;
    };
  }

  // Defensive normalize of the schema appearance into a complete v2 tree (the server already
  // validates; this guards a partial/legacy payload so the widget always themes fully).
  function resolveAppearance(schema) {
    var a = schema && typeof schema.appearance === 'object' && schema.appearance ? schema.appearance : {};
    var c = a.colors && typeof a.colors === 'object' ? a.colors : {};
    var r = a.radius && typeof a.radius === 'object' ? a.radius : {};
    var b = a.border && typeof a.border === 'object' ? a.border : {};
    var f = a.focus && typeof a.focus === 'object' ? a.focus : {};
    var m = a.motion && typeof a.motion === 'object' ? a.motion : {};
    var bt = a.button && typeof a.button === 'object' ? a.button : {};
    var md = a.modal && typeof a.modal === 'object' ? a.modal : {};
    var lc = a.launcher && typeof a.launcher === 'object' ? a.launcher : {};
    var il = a.inline && typeof a.inline === 'object' ? a.inline : {};
    var ch = a.chat && typeof a.chat === 'object' ? a.chat : {};
    var h = a.hero && typeof a.hero === 'object' ? a.hero : {};
    return {
      mode: pick(a, 'mode', isOneOf(['modal', 'chat', 'inline', 'button']), 'modal'),
      theme: pick(a, 'theme', isOneOf(['light', 'dark']), 'light'),
      font: pick(a, 'font', isOneOf(['system', 'sans', 'serif', 'brand']), 'sans'),
      fontH: pick(a, 'fontH', isOneOf(['system', 'sans', 'serif', 'brand']), 'sans'),
      colors: {
        accent: pick(c, 'accent', isStr, '#dc5b34'),
        surface: pick(c, 'surface', isStr, '#ffffff'),
        text: pick(c, 'text', isStr, '#161a22'),
        muted: pick(c, 'muted', isStr, '#5a6273'),
        border: pick(c, 'border', isStr, '#e2e6eb'),
        inputBg: pick(c, 'inputBg', isStr, '#ffffff'),
        error: pick(c, 'error', isStr, '#d14343'),
        success: pick(c, 'success', isStr, '#16a34a'),
        buttonText: pick(c, 'buttonText', isStr, '#ffffff')
      },
      radius: {
        form: pick(r, 'form', inRange(0, 999), 14),
        input: pick(r, 'input', inRange(0, 999), 8),
        button: pick(r, 'button', inRange(0, 999), 8)
      },
      border: {
        width: pick(b, 'width', inRange(0, 8), 1.5),
        style: pick(b, 'style', isOneOf(['solid', 'dashed', 'dotted']), 'solid'),
        color: pick(b, 'color', isStr, '#e2e6eb')
      },
      focus: {
        color: pick(f, 'color', isStr, '#dc5b34'),
        width: pick(f, 'width', inRange(0, 12), 3.5),
        shape: pick(f, 'shape', isOneOf(['ring', 'solid', 'glow']), 'ring')
      },
      motion: {
        anim: pick(m, 'anim', isOneOf(['fade', 'slide', 'scale']), 'scale'),
        speed: pick(m, 'speed', inRange(0, 2000), 320)
      },
      density: pick(a, 'density', isOneOf(['compact', 'cozy', 'comfortable']), 'cozy'),
      button: {
        style: pick(bt, 'style', isOneOf(['solid', 'outline', 'soft']), 'solid'),
        pill: bt.pill === true
      },
      modal: {
        width: pick(md, 'width', inRange(240, 960), 460),
        position: pick(md, 'position', isOneOf(['center', 'right']), 'center'),
        backdrop: pick(md, 'backdrop', inRange(0, 1), 0.45)
      },
      launcher: {
        side: pick(lc, 'side', isOneOf(['left', 'right']), 'right'),
        shape: pick(lc, 'shape', isOneOf(['pill', 'circle']), 'pill'),
        label: isStr(lc.label) ? lc.label : 'お問い合わせ'
      },
      inline: { align: pick(il, 'align', isOneOf(['left', 'center', 'right']), 'center') },
      chat: {
        oneByOne: ch.oneByOne !== false,
        progress: ch.progress !== false,
        typing: ch.typing !== false
      },
      hero: {
        on: h.on !== false,
        solid: h.solid === true,
        kicker: isStr(h.kicker) ? h.kicker : '',
        media: isStr(h.media) ? h.media : 'm-team',
        fit: pick(h, 'fit', isOneOf(['cover', 'contain']), 'cover'),
        height: pick(h, 'height', inRange(0, 600), 150),
        inset: pick(h, 'inset', inRange(0, 64), 0),
        overlay: pick(h, 'overlay', inRange(0, 1), 0.28),
        overlayTitle: h.overlayTitle !== false
      }
    };
  }

  function heroBackground(media) {
    if (/^(https?:|data:|\/)/.test(media)) {
      return 'url("' + media.replace(/"/g, '\\"') + '")';
    }
    return MEDIA[media] || 'none';
  }

  // appearance → the --pv-* custom properties (spec §6); ported from window.STUDIO.pvVars.
  function pvVars(a) {
    var d = DENSITY[a.density] || DENSITY.cozy;
    return (
      '--pv-accent:' + a.colors.accent + ';' +
      '--pv-surface:' + a.colors.surface + ';' +
      '--pv-text:' + a.colors.text + ';' +
      '--pv-muted:' + a.colors.muted + ';' +
      '--pv-border:' + a.colors.border + ';' +
      '--pv-input-bg:' + a.colors.inputBg + ';' +
      '--pv-error:' + a.colors.error + ';' +
      '--pv-btn-text:' + a.colors.buttonText + ';' +
      '--pv-r-form:' + a.radius.form + 'px;' +
      '--pv-r-input:' + a.radius.input + 'px;' +
      '--pv-r-btn:' + (a.button.pill ? 999 : a.radius.button) + 'px;' +
      '--pv-bw:' + a.border.width + 'px;' +
      '--pv-bstyle:' + a.border.style + ';' +
      '--pv-bcolor:' + a.border.color + ';' +
      '--pv-focus:' + a.focus.color + ';' +
      '--pv-focus-w:' + a.focus.width + 'px;' +
      '--pv-font:' + (FONTS[a.font] || FONTS.sans) + ';' +
      '--pv-font-h:' + (FONTS[a.fontH] || FONTS.sans) + ';' +
      '--pv-font-mono:' + FONT_MONO + ';' +
      '--pv-ok:' + a.colors.success + ';' +
      '--pv-gap:' + d.gap + 'px;' +
      '--pv-fpad:' + d.y + 'px ' + d.x + 'px;' +
      '--pv-fpad-y:' + d.y + 'px;' +
      '--pv-label-mb:' + d.mb + 'px;' +
      '--pv-modal-w:' + a.modal.width + 'px;' +
      '--pv-backdrop:' + a.modal.backdrop + ';' +
      '--pv-speed:' + a.motion.speed + 'ms;'
    );
  }

  function localized(map, locale) {
    if (map && typeof map === 'object') {
      if (map[locale]) {
        return map[locale];
      }
      for (var k in map) {
        if (Object.prototype.hasOwnProperty.call(map, k) && map[k]) {
          return map[k];
        }
      }
    }
    return '';
  }

  function resolveLocale(schema) {
    var locales = Array.isArray(schema.locales) && schema.locales.length ? schema.locales : ['ja'];
    if (langAttr && locales.indexOf(langAttr) !== -1) {
      return langAttr;
    }
    return schema.default_locale || locales[0] || 'ja';
  }

  function el(tag, props, text) {
    var node = document.createElement(tag);
    if (props) {
      for (var key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
          node.setAttribute(key, props[key]);
        }
      }
    }
    if (text != null) {
      node.textContent = text;
    }
    return node;
  }

  // The shared visual .pv-* rules (verbatim from studio.css) + production positioning: the
  // launcher / backdrop / modal are fixed to the viewport (the studio frames them in a canvas).
  function styles(a) {
    return [
      ':host{all:initial;' + pvVars(a) + '}',
      '*{box-sizing:border-box}',
      '.pv-form{background:var(--pv-surface);color:var(--pv-text);font-family:var(--pv-font)}',
      '.pv-form .ttl{font-size:19px;font-weight:700;letter-spacing:-0.01em;color:var(--pv-text);margin:0;font-family:var(--pv-font-h)}',
      '.pv-form .desc{font-size:12.5px;color:var(--pv-muted);margin:6px 0 0;line-height:1.6}',
      '.pv-fields{display:flex;flex-direction:column;gap:var(--pv-gap);margin-top:18px}',
      '.pv-field .fl{display:block;font-size:12px;font-weight:600;color:var(--pv-text);margin-bottom:var(--pv-label-mb)}',
      '.pv-field .fl .rq{color:var(--pv-error);margin-left:3px}',
      '.pv-input{width:100%;box-sizing:border-box;padding:var(--pv-fpad);font-size:13px;font-family:inherit;color:var(--pv-text);background:var(--pv-input-bg);border:var(--pv-bw) var(--pv-bstyle) var(--pv-bcolor);border-radius:var(--pv-r-input);outline:none;transition:border-color .15s,box-shadow .15s}',
      '.pv-input::placeholder{color:var(--pv-muted);opacity:.65}',
      '.pv-input.area{min-height:64px;resize:vertical}',
      '.pv-input:focus{border-color:var(--pv-focus)}',
      '.pv-focus-ring .pv-input:focus{box-shadow:0 0 0 var(--pv-focus-w) color-mix(in srgb,var(--pv-focus) 26%,transparent)}',
      '.pv-focus-solid .pv-input:focus{border-color:var(--pv-focus);box-shadow:inset 0 0 0 1px var(--pv-focus)}',
      '.pv-focus-glow .pv-input:focus{box-shadow:0 0 0 1px var(--pv-focus),0 0 14px color-mix(in srgb,var(--pv-focus) 55%,transparent)}',
      '.pv-check{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--pv-text);line-height:1.5}',
      '.pv-check input{margin-top:2px}',
      '.pv-btn{width:100%;box-sizing:border-box;padding:calc(var(--pv-fpad-y) + 2px) 16px;border-radius:var(--pv-r-btn);font:700 13.5px/1 var(--pv-font);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s,filter .15s;margin-top:4px}',
      '.pv-btn:active{transform:translateY(1px)}',
      '.pv-btn:disabled{opacity:.6;cursor:default}',
      '.pv-btn svg{width:16px;height:16px;flex:none}',
      '.pv-btn__lbl{display:inline-flex;align-items:center;gap:8px}',
      '.pv-btn__load{display:none;align-items:center;gap:8px}',
      '.pv-btn.pv-is-load .pv-btn__lbl{display:none}',
      '.pv-btn.pv-is-load .pv-btn__load{display:inline-flex}',
      '.pv-spin{width:15px;height:15px;border:2px solid color-mix(in srgb,currentColor 30%,transparent);border-top-color:currentColor;border-radius:50%;animation:pv-spin .7s linear infinite}',
      '.pv-btn--solid{background:var(--pv-accent);color:var(--pv-btn-text);border:var(--pv-bw) solid transparent}',
      '.pv-btn--outline{background:transparent;color:var(--pv-accent);border:1.5px solid var(--pv-accent)}',
      '.pv-btn--soft{background:color-mix(in srgb,var(--pv-accent) 15%,var(--pv-surface));color:var(--pv-accent);border:0}',
      '.pv-foot{text-align:center;font-size:11.5px;color:var(--pv-muted);margin-top:16px}',
      '.pv-err{color:var(--pv-error);font-size:11.5px;margin-top:4px}',
      '.pv-msg{font-size:13px;padding:9px 11px;border-radius:var(--pv-r-input);margin-top:4px;display:flex;align-items:center;gap:7px;animation:pv-fade .25s ease}',
      '.pv-msg svg{width:16px;height:16px;flex:none}',
      '.pv-msg.ok{background:color-mix(in srgb,var(--pv-ok) 12%,var(--pv-surface));color:var(--pv-ok)}',
      '.pv-msg.err{background:color-mix(in srgb,var(--pv-error) 12%,var(--pv-surface));color:var(--pv-error)}',
      '.pv-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
      '.pv-hero{position:relative;overflow:hidden;background-position:center;background-repeat:no-repeat;border-radius:calc(var(--pv-r-form) * .72);margin-bottom:18px}',
      '.pv-hero__ov{position:absolute;inset:0}',
      '.pv-hero__txt{position:absolute;left:0;right:0;bottom:0;padding:16px 18px;color:#fff}',
      '.pv-hero__txt .ttl{color:#fff;margin:0;font-size:19px;font-weight:700;letter-spacing:-0.01em;font-family:var(--pv-font-h)}',
      '.pv-hero__txt .desc{color:rgba(255,255,255,.86);margin:5px 0 0;font-size:12px;line-height:1.5}',
      // Solid-accent hero band + brand top rule + mono kicker (AYANE skin, #402).
      '.pv-hero__txt .kick{display:block;margin-bottom:8px;font-family:var(--pv-font-mono);font-size:10.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--pv-btn-text);opacity:.9}',
      '.pv-hero--solid{background:var(--pv-accent)}',
      '.pv-hero--solid .pv-hero__ov{background:linear-gradient(90deg,rgba(20,18,15,.20),rgba(20,18,15,0) 60%)}',
      '.pv-hero--solid::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:var(--pv-text)}',
      '.pv-hero--solid .pv-hero__txt .ttl{font-weight:900}',
      /* inline: a card placed in the host page flow */
      '.pv-embed{width:var(--pv-modal-w);max-width:100%;padding:26px 26px 24px;background:var(--pv-surface);border:var(--pv-bw) var(--pv-bstyle) var(--pv-bcolor);border-radius:var(--pv-r-form);box-shadow:0 10px 34px rgba(18,28,38,.10)}',
      '.pv-embed.center{margin:0 auto}.pv-embed.right{margin-left:auto}.pv-embed.left{margin-right:auto}',
      /* launcher + modal: fixed to the viewport in production */
      '.pv-launcher{position:fixed;bottom:20px;z-index:2147483000;padding:0 18px;height:48px;border:0;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:9px;background:var(--pv-accent);color:var(--pv-btn-text);font:700 13px/1 var(--pv-font);box-shadow:0 8px 24px color-mix(in srgb,var(--pv-accent) 40%,transparent)}',
      '.pv-launcher.right{right:20px}.pv-launcher.left{left:20px}',
      // In-flow trigger button (data-trigger="button") — placed wherever the script sits, opens the modal.
      '.pv-trigger{display:inline-flex;align-items:center;gap:9px;padding:0 18px;height:46px;border:0;border-radius:var(--pv-r-btn);cursor:pointer;background:var(--pv-accent);color:var(--pv-btn-text);font:700 13.5px/1 var(--pv-font);box-shadow:0 8px 24px color-mix(in srgb,var(--pv-accent) 30%,transparent)}',
      '.pv-trigger:active{transform:translateY(1px)}',
      '.pv-trigger svg{width:17px;height:17px;flex:none}',
      '.pv-launcher.circle{width:56px;height:56px;padding:0;justify-content:center}',
      '.pv-launcher svg{width:19px;height:19px}',
      /* chat: a docked conversational panel (mirrors the studio .pv-chat preview) */
      '.pv-chat{position:fixed;bottom:20px;z-index:2147483002;width:360px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 40px);background:var(--pv-surface);color:var(--pv-text);font-family:var(--pv-font);border-radius:var(--pv-r-form);box-shadow:0 24px 60px rgba(0,0,0,.26);display:flex;flex-direction:column;overflow:hidden}',
      '.pv-chat.right{right:20px}.pv-chat.left{left:20px}',
      '.pv-chat__hd{padding:15px 16px;background:var(--pv-accent);color:var(--pv-btn-text);display:flex;align-items:center;gap:10px}',
      '.pv-chat__hd .av{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;flex:none}',
      '.pv-chat__hd .av svg{width:17px;height:17px}',
      '.pv-chat__meta{min-width:0;flex:1}',
      '.pv-chat__hd .nm{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.pv-chat__hd .ol{font-size:10.5px;opacity:.85;display:flex;align-items:center;gap:5px}',
      '.pv-chat__hd .ol i{width:6px;height:6px;border-radius:50%;background:#7ef0a8}',
      '.pv-chat__x{flex:none;width:26px;height:26px;border:0;border-radius:7px;cursor:pointer;background:rgba(255,255,255,.18);color:var(--pv-btn-text);display:grid;place-items:center;font-size:17px;line-height:1}',
      '.pv-prog{height:3px;background:color-mix(in srgb,var(--pv-text) 8%,transparent)}',
      '.pv-prog>i{display:block;height:100%;width:0;background:var(--pv-accent);border-radius:0 2px 2px 0;transition:width .3s}',
      '.pv-chat__body{flex:1;min-height:0;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px}',
      '.pv-bubble{max-width:80%;padding:10px 13px;border-radius:13px;font-size:12.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}',
      '.pv-bubble.bot{align-self:flex-start;background:color-mix(in srgb,var(--pv-text) 6%,var(--pv-surface));color:var(--pv-text);border-bottom-left-radius:4px}',
      '.pv-bubble.me{align-self:flex-end;background:var(--pv-accent);color:var(--pv-btn-text);border-bottom-right-radius:4px}',
      '.pv-bubble.err{align-self:flex-start;background:color-mix(in srgb,var(--pv-error) 12%,var(--pv-surface));color:var(--pv-error);border-bottom-left-radius:4px}',
      '.pv-typing{align-self:flex-start;display:inline-flex;gap:4px;padding:12px 14px;background:color-mix(in srgb,var(--pv-text) 6%,var(--pv-surface));border-radius:13px;border-bottom-left-radius:4px}',
      '.pv-typing i{width:6px;height:6px;border-radius:50%;background:var(--pv-muted);animation:pv-blink 1.2s infinite}',
      '.pv-typing i:nth-child(2){animation-delay:.2s}.pv-typing i:nth-child(3){animation-delay:.4s}',
      '@keyframes pv-blink{0%,60%,100%{opacity:.3}30%{opacity:1}}',
      '@keyframes pv-spin{to{transform:rotate(360deg)}}',
      '@keyframes pv-fade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}',
      '@media (prefers-reduced-motion:reduce){.pv-spin{animation-duration:1.6s}.pv-msg{animation:none}}',
      '.pv-chat__ft{padding:12px 14px;border-top:var(--pv-bw) var(--pv-bstyle) var(--pv-bcolor);display:flex;gap:9px;align-items:center;flex-wrap:wrap}',
      '.pv-chat__in{flex:1;min-width:0;padding:10px 12px;border:var(--pv-bw) var(--pv-bstyle) var(--pv-bcolor);border-radius:var(--pv-r-input);font-size:12.5px;font-family:inherit;color:var(--pv-text);background:var(--pv-input-bg);outline:none}',
      '.pv-chat__in:focus{border-color:var(--pv-focus)}',
      'textarea.pv-chat__in{resize:none;min-height:40px}',
      '.pv-chat__send{flex:none;width:38px;height:38px;border:0;border-radius:var(--pv-r-btn);cursor:pointer;background:var(--pv-accent);color:var(--pv-btn-text);display:grid;place-items:center}',
      '.pv-chat__send:disabled{opacity:.6;cursor:default}',
      '.pv-chat__send svg{width:17px;height:17px}',
      '.pv-qr{flex:1 1 auto;padding:10px 14px;border:1.5px solid var(--pv-accent);border-radius:var(--pv-r-btn);cursor:pointer;background:transparent;color:var(--pv-accent);font:600 12.5px/1 var(--pv-font)}',
      '.pv-qr:active{transform:translateY(1px)}',
      '.pv-overlay{position:fixed;inset:0;z-index:2147483001}',
      '.pv-backdrop{position:absolute;inset:0;background:rgba(18,24,33,var(--pv-backdrop))}',
      '.pv-modal{position:absolute;box-sizing:border-box;width:var(--pv-modal-w);max-width:calc(100% - 40px);max-height:calc(100% - 40px);overflow:auto;padding:24px 24px 22px;background:var(--pv-surface);border-radius:var(--pv-r-form);box-shadow:0 30px 70px rgba(0,0,0,.3)}',
      '.pv-modal.center{left:50%;top:50%;transform:translate(-50%,-50%)}',
      '.pv-modal.right{right:16px;top:50%;transform:translateY(-50%)}',
      '.pv-x{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:7px;border:0;cursor:pointer;background:color-mix(in srgb,var(--pv-text) 7%,transparent);color:var(--pv-muted);display:grid;place-items:center;font-size:18px;line-height:1}',
      '@media (prefers-reduced-motion: no-preference){',
      '.pv-anim .pv-modal{transition:transform var(--pv-speed) cubic-bezier(.2,.8,.3,1)}',
      '.pv-anim .pv-backdrop{transition:opacity var(--pv-speed) ease}',
      '.pv-anim[data-in="0"] .pv-backdrop{opacity:0}',
      '.pv-anim[data-in="0"][data-anim="fade"] .pv-modal.center{transform:translate(-50%,-50%) scale(.985)}',
      '.pv-anim[data-in="0"][data-anim="fade"] .pv-modal.right{transform:translateY(-50%) scale(.985)}',
      '.pv-anim[data-in="0"][data-anim="scale"] .pv-modal.center{transform:translate(-50%,-50%) scale(.92)}',
      '.pv-anim[data-in="0"][data-anim="scale"] .pv-modal.right{transform:translateY(-50%) scale(.92)}',
      '.pv-anim[data-in="0"][data-anim="slide"] .pv-modal.center{transform:translate(-50%,calc(-50% + 34px))}',
      '.pv-anim[data-in="0"][data-anim="slide"] .pv-modal.right{transform:translate(40px,-50%)}',
      '}'
    ].join('');
  }

  // @font-face must be registered at the document level — declarations inside a shadow root are
  // not reliably applied. This appends a single <style> with the self-hosted brand faces to the
  // host document's head, using absolute URLs derived from the widget's own origin (`base`). It
  // is font-family registration only (no visual rules leak into the host page) and CSP-safe
  // (font-src must allow the contact origin on the host page). Called only when a form actually
  // uses the brand font / kicker, so other forms load nothing extra.
  var brandFontsInjected = false;
  function ensureBrandFonts() {
    if (brandFontsInjected) { return; }
    brandFontsInjected = true;
    var fb = base + '/embed-fonts/';
    function face(family, weight, file) {
      return "@font-face{font-family:'" + family + "';font-style:normal;font-display:swap;font-weight:" +
        weight + ";src:url('" + fb + file + "') format('woff2')}";
    }
    var css = [
      face('Zen Kaku Gothic New', 400, 'zen-kaku-gothic-new-jp-subset-400.woff2'),
      face('Zen Kaku Gothic New', 500, 'zen-kaku-gothic-new-jp-subset-500.woff2'),
      face('Zen Kaku Gothic New', 700, 'zen-kaku-gothic-new-jp-subset-700.woff2'),
      face('Zen Kaku Gothic New', 900, 'zen-kaku-gothic-new-jp-subset-900.woff2'),
      face('IBM Plex Mono', 400, 'ibm-plex-mono-latin-400-normal.woff2'),
      face('IBM Plex Mono', 500, 'ibm-plex-mono-latin-500-normal.woff2'),
      face('IBM Plex Mono', 600, 'ibm-plex-mono-latin-600-normal.woff2')
    ].join('');
    (document.head || document.documentElement).appendChild(el('style', null, css));
  }

  function mount(schema, a) {
    var locale = resolveLocale(schema);
    if (a.font === 'brand' || a.fontH === 'brand' || a.hero.kicker) {
      ensureBrandFonts();
    }
    var mode = MODES[triggerAttr] ? triggerAttr : a.mode;
    var host = el('div', { 'data-nene-contact': formKey });
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.appendChild(el('style', null, styles(a)));

    if (mode === 'inline') {
      var card = el('div', { 'class': 'pv-embed ' + a.inline.align });
      card.appendChild(buildForm(schema, locale, a));
      root.appendChild(card);
      if (script.parentNode) {
        script.parentNode.insertBefore(host, script);
      }
      return;
    }

    // `button`: render an in-flow trigger button exactly where the script tag sits (not a fixed
    // launcher), so an operator can place a "contact" button anywhere in the page — click opens
    // the same modal. Multiple placements are fine (each script tag renders its own button).
    if (mode === 'button') {
      host.setAttribute('style', 'display:inline-block');
      var trigger = el('button', { type: 'button', 'class': 'pv-trigger' });
      trigger.appendChild(icon('chat'));
      trigger.appendChild(el('span', null, buttonLabelAttr || a.launcher.label));
      root.appendChild(trigger);
      if (script.parentNode) {
        script.parentNode.insertBefore(host, script);
      }
      trigger.addEventListener('click', function () {
        openModal(root, schema, locale, a);
      });
      return;
    }

    // modal + chat: a launcher opens the themed form, either in a modal or a conversational
    // chat panel (the one-by-one stepper) depending on the mode.
    var launcher = el('button', { type: 'button', 'class': 'pv-launcher ' + a.launcher.side + ' ' + a.launcher.shape });
    launcher.appendChild(icon('chat'));
    if (a.launcher.shape === 'pill') {
      launcher.appendChild(el('span', null, a.launcher.label));
    }
    root.appendChild(launcher);
    launcher.addEventListener('click', function () {
      if (mode === 'chat') {
        openChat(root, schema, locale, a);
      } else {
        openModal(root, schema, locale, a);
      }
    });
  }

  function openModal(root, schema, locale, a) {
    if (root.querySelector('.pv-overlay')) {
      return;
    }
    var overlay = el('div', { 'class': 'pv-overlay' });
    var anim = el('div', { 'class': 'pv-anim', 'data-anim': a.motion.anim, 'data-in': '0' });
    var backdrop = el('div', { 'class': 'pv-backdrop' });
    var modal = el('div', { 'class': 'pv-modal ' + a.modal.position });
    var close = el('button', { type: 'button', 'class': 'pv-x', 'aria-label': 'Close' }, '×');

    var dismiss = function () { overlay.remove(); };
    close.addEventListener('click', dismiss);
    backdrop.addEventListener('click', dismiss);

    modal.appendChild(close);
    modal.appendChild(buildForm(schema, locale, a));
    anim.appendChild(backdrop);
    anim.appendChild(modal);
    overlay.appendChild(anim);
    root.appendChild(overlay);

    // Visible end-state is the base; flip data-in to "1" next frame so the transition plays.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { anim.setAttribute('data-in', '1'); });
    });
  }

  // Conversational chat mode: ask each field one at a time as bot bubbles, the visitor answers
  // in the footer, then submit through the same pipeline as the modal/inline forms.
  function openChat(root, schema, locale, a) {
    if (root.querySelector('.pv-chat')) {
      return;
    }
    var en = locale === 'en';
    var allFields = Array.isArray(schema.fields) ? schema.fields : [];
    var askable = [];
    var values = {};
    var fileMap = {};
    allFields.forEach(function (field) {
      if (field.field_type === 'honeypot') {
        values[field.name] = '';
      } else {
        askable.push(field);
      }
    });

    var panel = el('div', { 'class': 'pv-chat ' + a.launcher.side });
    var hd = el('div', { 'class': 'pv-chat__hd' });
    var av = el('span', { 'class': 'av' });
    av.appendChild(icon('chat'));
    var meta = el('div', { 'class': 'pv-chat__meta' });
    meta.appendChild(el('div', { 'class': 'nm' },
      (schema.name && (localized(typeof schema.name === 'object' ? schema.name : null, locale) || schema.name)) || (en ? 'Contact' : 'お問い合わせ')));
    var ol = el('div', { 'class': 'ol' });
    ol.appendChild(el('i'));
    ol.appendChild(el('span', null, en ? 'Online' : 'オンライン'));
    meta.appendChild(ol);
    var x = el('button', { type: 'button', 'class': 'pv-chat__x', 'aria-label': 'Close' }, '×');
    hd.appendChild(av);
    hd.appendChild(meta);
    hd.appendChild(x);
    panel.appendChild(hd);

    var progBar = null;
    if (a.chat.progress) {
      var prog = el('div', { 'class': 'pv-prog' });
      progBar = el('i');
      prog.appendChild(progBar);
      panel.appendChild(prog);
    }

    var body = el('div', { 'class': 'pv-chat__body' });
    var ft = el('div', { 'class': 'pv-chat__ft' });
    panel.appendChild(body);
    panel.appendChild(ft);
    root.appendChild(panel);
    x.addEventListener('click', function () { panel.remove(); });

    var idx = 0;
    var consentGiven = false;
    var totalSteps = askable.length + (schema.consent_required ? 1 : 0);

    function bubble(cls, text) {
      var b = el('div', { 'class': 'pv-bubble ' + cls }, text);
      body.appendChild(b);
      body.scrollTop = body.scrollHeight;
      return b;
    }
    function clearFooter() {
      while (ft.firstChild) { ft.removeChild(ft.firstChild); }
    }
    function setProgress(done) {
      if (progBar) {
        progBar.style.width = (totalSteps ? Math.round((done / totalSteps) * 100) : 0) + '%';
      }
    }
    function sendButton(onGo) {
      var btn = el('button', { type: 'button', 'class': 'pv-chat__send', 'aria-label': 'Send' });
      btn.appendChild(icon('send'));
      btn.addEventListener('click', onGo);
      return btn;
    }

    function advance(field, value, display) {
      values[field.name] = value;
      bubble('me', display);
      idx++;
      ask();
    }

    function askText(field) {
      clearFooter();
      var area = field.field_type === 'textarea';
      var input = area
        ? el('textarea', { 'class': 'pv-chat__in', rows: '2' })
        : el('input', { type: field.field_type === 'email' ? 'email' : field.field_type === 'date' ? 'date' : 'text', 'class': 'pv-chat__in' });
      if (isStr(field.placeholder) && field.placeholder) { input.setAttribute('placeholder', field.placeholder); }
      var go = function () {
        var v = (input.value || '').replace(/^\s+|\s+$/g, '');
        if (field.required && v === '') {
          bubble('err', en ? 'This field is required.' : 'この項目は必須です。');
          input.focus();
          return;
        }
        advance(field, v, v || '—');
      };
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !area) { e.preventDefault(); go(); }
      });
      ft.appendChild(input);
      ft.appendChild(sendButton(go));
      input.focus();
    }

    function askSelect(field) {
      clearFooter();
      var sel = el('select', { 'class': 'pv-chat__in' });
      sel.appendChild(el('option', { value: '' }, en ? 'Select…' : '選択してください'));
      var opts = Array.isArray(field.options) ? field.options : [];
      opts.forEach(function (opt) {
        var value = opt && (opt.value != null ? String(opt.value) : (opt.name != null ? String(opt.name) : ''));
        sel.appendChild(el('option', { value: value }, localized(opt && opt.label, locale) || value));
      });
      var go = function () {
        var v = sel.value;
        if (field.required && v === '') {
          bubble('err', en ? 'Please choose an option.' : '選択してください。');
          return;
        }
        var label = v ? (sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : v) : '—';
        advance(field, v, label);
      };
      ft.appendChild(sel);
      ft.appendChild(sendButton(go));
    }

    function askChoice(field) {
      // checkbox-style boolean: a pair of quick-reply buttons.
      clearFooter();
      var yes = el('button', { type: 'button', 'class': 'pv-qr' }, en ? 'Yes' : 'はい');
      var no = el('button', { type: 'button', 'class': 'pv-qr' }, en ? 'No' : 'いいえ');
      yes.addEventListener('click', function () { advance(field, '1', en ? 'Yes' : 'はい'); });
      no.addEventListener('click', function () {
        if (field.required) {
          bubble('err', en ? 'This field is required.' : 'この項目は必須です。');
          return;
        }
        advance(field, '', en ? 'No' : 'いいえ');
      });
      ft.appendChild(yes);
      ft.appendChild(no);
    }

    function askFile(field) {
      clearFooter();
      var input = el('input', { type: 'file', 'class': 'pv-chat__in' });
      var go = function () {
        var files = input.files;
        if ((!files || !files.length) && field.required) {
          bubble('err', en ? 'A file is required.' : 'ファイルが必要です。');
          return;
        }
        if (files && files.length) {
          fileMap[field.name] = files;
          var names = [];
          for (var i = 0; i < files.length; i++) { names.push(files[i].name); }
          advance(field, '', names.join(', '));
        } else {
          advance(field, '', '—');
        }
      };
      ft.appendChild(input);
      ft.appendChild(sendButton(go));
    }

    function askConsent() {
      bubble('bot', localized(schema.consent_label, locale) || (en ? 'Do you agree to the privacy policy?' : 'プライバシーポリシーに同意しますか？'));
      clearFooter();
      var yes = el('button', { type: 'button', 'class': 'pv-qr' }, en ? 'I agree' : '同意する');
      var no = el('button', { type: 'button', 'class': 'pv-qr' }, en ? 'No' : '同意しない');
      yes.addEventListener('click', function () {
        consentGiven = true;
        bubble('me', en ? 'I agree' : '同意する');
        idx++;
        setProgress(idx);
        finish();
      });
      no.addEventListener('click', function () {
        bubble('err', en ? 'Consent is required to submit.' : '送信には同意が必要です。');
      });
      ft.appendChild(yes);
      ft.appendChild(no);
    }

    function ask() {
      setProgress(idx);
      if (idx >= askable.length) {
        if (schema.consent_required && !consentGiven) { askConsent(); return; }
        finish();
        return;
      }
      var field = askable[idx];
      bubble('bot', localized(field.label, locale) || field.name);
      var type = field.field_type;
      if (type === 'select') { askSelect(field); }
      else if (type === 'checkbox') { askChoice(field); }
      else if (type === 'file') { askFile(field); }
      else { askText(field); }
    }

    function finish() {
      clearFooter();
      var typing = el('div', { 'class': 'pv-typing' });
      typing.appendChild(el('i'));
      typing.appendChild(el('i'));
      typing.appendChild(el('i'));
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      submitChat(schema, locale, values, fileMap, consentGiven).then(function (res) {
        typing.remove();
        if (res.ok) {
          if (schema.post_submit === 'redirect' && isStr(schema.redirect_url) && schema.redirect_url) {
            location.href = schema.redirect_url;
            return;
          }
          bubble('bot', localized(schema.success_message, locale) || (en ? 'Thank you — your message was sent.' : '送信しました。ありがとうございます。'));
          return;
        }
        if (res.fieldError) {
          bubble('err', res.fieldError);
        } else {
          bubble('err', en ? 'Could not send. Please try again later.' : '送信できませんでした。時間をおいて再度お試しください。');
        }
      });
    }

    // Greeting then the first question.
    bubble('bot', isStr(schema.description) && schema.description
      ? schema.description
      : (en ? 'Hi! I’ll ask a few quick questions.' : 'こんにちは！いくつか順番にお伺いします。'));
    ask();
  }

  function submitChat(schema, locale, values, fileMap, consentGiven) {
    var en = locale === 'en';
    var uploads = [];
    var name;
    for (name in fileMap) {
      if (Object.prototype.hasOwnProperty.call(fileMap, name)) {
        var files = fileMap[name];
        for (var i = 0; i < files.length; i++) { uploads.push(uploadOne(files[i])); }
      }
    }
    return Promise.all(uploads)
      .then(function (ids) {
        var attachmentIds = ids.filter(function (id) { return id != null; });
        var payload = { attachment_ids: attachmentIds, source_url: location.href, locale: locale };
        if (schema.consent_required) { payload.consent = !!consentGiven; }
        var k;
        for (k in values) {
          if (Object.prototype.hasOwnProperty.call(values, k)) { payload[k] = values[k]; }
        }
        return fetch(api + '/submissions', {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload)
        });
      })
      .then(function (r) {
        if (r.status === 201 || r.status === 204) { return { ok: true }; }
        if (r.status === 422) {
          return r.json().then(function (body) {
            var errs = body && Array.isArray(body.errors) ? body.errors : [];
            var first = errs.length && errs[0] ? errs[0].message : null;
            return { ok: false, fieldError: first || (en ? 'Please check your input.' : '入力内容をご確認ください。') };
          }, function () { return { ok: false }; });
        }
        return { ok: false };
      })
      .catch(function () { return { ok: false }; });
  }

  // Minimal inline SVG icons (CSP-safe; built via DOM, not innerHTML).
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var d = name === 'send'
      ? 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z'
      : name === 'check'
        ? 'M20 6 9 17l-5-5'
        : 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
    return svg;
  }

  function buildForm(schema, locale, a) {
    a = a || resolveAppearance(schema);
    var form = el('form', { 'class': 'pv-form pv-focus-' + a.focus.shape, novalidate: 'novalidate' });
    var fields = Array.isArray(schema.fields) ? schema.fields : [];

    var titleText = schema.name
      ? (localized(typeof schema.name === 'object' ? schema.name : null, locale) || schema.name)
      : '';
    var descText = isStr(schema.description) ? schema.description : '';
    var heroTitle = a.hero.on && a.hero.overlayTitle;

    if (a.hero.on) {
      form.appendChild(buildHero(a, titleText, descText));
    }
    if (!heroTitle && titleText) {
      form.appendChild(el('h3', { 'class': 'ttl' }, titleText));
    }
    if (!heroTitle && descText) {
      form.appendChild(el('p', { 'class': 'desc' }, descText));
    }

    var wrap = el('div', { 'class': 'pv-fields' });
    var controls = {};

    fields.forEach(function (field) {
      if (field.field_type === 'honeypot') {
        var hp = el('input', { type: 'text', name: field.name, autocomplete: 'off', tabindex: '-1', 'class': 'pv-hp', 'aria-hidden': 'true' });
        form.appendChild(hp);
        controls[field.name] = { field: field, input: hp };
        return;
      }

      var ph = typeof field.placeholder === 'string' ? field.placeholder : '';

      if (field.field_type === 'checkbox') {
        var crow = el('label', { 'class': 'pv-check' });
        var cb = el('input', { type: 'checkbox', name: field.name, value: '1' });
        crow.appendChild(cb);
        crow.appendChild(el('span', null, localized(field.label, locale) || field.name));
        wrap.appendChild(crow);
        controls[field.name] = { field: field, input: cb };
        return;
      }

      var fld = el('div', { 'class': 'pv-field' });
      var label = el('label', { 'class': 'fl' }, localized(field.label, locale) || field.name);
      if (field.required) {
        label.appendChild(el('span', { 'class': 'rq' }, '＊'));
      }
      fld.appendChild(label);

      var input;
      if (field.field_type === 'textarea') {
        input = el('textarea', { 'class': 'pv-input area', name: field.name });
        if (ph) { input.setAttribute('placeholder', ph); }
      } else if (field.field_type === 'select') {
        input = el('select', { 'class': 'pv-input', name: field.name });
        input.appendChild(el('option', { value: '' }, ''));
        (Array.isArray(field.options) ? field.options : []).forEach(function (opt) {
          var value = opt && (opt.value != null ? String(opt.value) : (opt.name != null ? String(opt.name) : ''));
          input.appendChild(el('option', { value: value }, localized(opt && opt.label, locale) || value));
        });
      } else if (field.field_type === 'file') {
        input = el('input', { type: 'file', 'class': 'pv-input', name: field.name });
      } else {
        var inputType = field.field_type === 'email' ? 'email' : field.field_type === 'date' ? 'date' : 'text';
        input = el('input', { type: inputType, 'class': 'pv-input', name: field.name });
        if (ph) { input.setAttribute('placeholder', ph); }
      }
      fld.appendChild(input);
      var err = el('div', { 'class': 'pv-err' });
      fld.appendChild(err);
      controls[field.name] = { field: field, input: input, error: err };
      wrap.appendChild(fld);
    });

    var consentInput = null;
    if (schema.consent_required) {
      var cWrap = el('label', { 'class': 'pv-check' });
      consentInput = el('input', { type: 'checkbox' });
      cWrap.appendChild(consentInput);
      cWrap.appendChild(el('span', null, localized(schema.consent_label, locale) || (locale === 'en' ? 'I agree.' : '同意します。')));
      wrap.appendChild(cWrap);
    }

    var submitText = localized(schema.submit_label, locale) || (locale === 'en' ? 'Send' : '送信する');
    var submit = el('button', { type: 'submit', 'class': 'pv-btn pv-btn--' + a.button.style });
    var submitLbl = el('span', { 'class': 'pv-btn__lbl' }, submitText);
    submitLbl.appendChild(icon('send'));
    var submitLoad = el('span', { 'class': 'pv-btn__load' });
    submitLoad.appendChild(el('span', { 'class': 'pv-spin' }));
    submitLoad.appendChild(el('span', null, locale === 'en' ? 'Sending…' : '送信中…'));
    submit.appendChild(submitLbl);
    submit.appendChild(submitLoad);
    wrap.appendChild(submit);

    var msg = el('div');
    wrap.appendChild(msg);
    form.appendChild(wrap);
    form.appendChild(el('div', { 'class': 'pv-foot' }, locale === 'en'
      ? 'By sending, you agree to the Privacy Policy.'
      : '送信により プライバシーポリシー に同意したものとみなされます。'));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(form, schema, locale, controls, consentInput, submit, msg);
    });

    return form;
  }

  function buildHero(a, titleText, descText) {
    var solid = a.hero.solid;
    var hero = el('div', { 'class': 'pv-hero' + (solid ? ' pv-hero--solid' : '') });
    var style = 'height:' + a.hero.height + 'px;margin:' + a.hero.inset + 'px;';
    if (!solid) {
      // Image/gradient hero: background + flat overlay tint.
      style += 'background-image:' + heroBackground(a.hero.media) + ';background-size:' + a.hero.fit + ';';
    }
    hero.setAttribute('style', style);
    // Solid hero uses the gradient overlay from the CSS rule; image hero uses a flat rgba tint.
    var ov = el('div', { 'class': 'pv-hero__ov' });
    if (!solid) { ov.setAttribute('style', 'background:rgba(10,14,20,' + a.hero.overlay + ')'); }
    hero.appendChild(ov);
    if (a.hero.overlayTitle && (titleText || descText || a.hero.kicker)) {
      var txt = el('div', { 'class': 'pv-hero__txt' });
      if (a.hero.kicker) { txt.appendChild(el('span', { 'class': 'kick' }, a.hero.kicker)); }
      if (titleText) { txt.appendChild(el('h3', { 'class': 'ttl' }, titleText)); }
      if (descText) { txt.appendChild(el('p', { 'class': 'desc' }, descText)); }
      hero.appendChild(txt);
    }
    return hero;
  }

  function showMessage(msg, kind, text) {
    msg.textContent = '';
    var box = el('div', { 'class': 'pv-msg ' + kind });
    if (kind === 'ok') {
      box.appendChild(icon('check'));
    }
    box.appendChild(el('span', null, text));
    msg.appendChild(box);
  }

  function clearErrors(controls) {
    for (var name in controls) {
      if (controls[name].error) {
        controls[name].error.textContent = '';
      }
    }
  }

  function handleSubmit(form, schema, locale, controls, consentInput, submit, msg) {
    clearErrors(controls);
    msg.textContent = '';

    if (schema.consent_required && consentInput && !consentInput.checked) {
      showMessage(msg, 'err', locale === 'en' ? 'Consent is required.' : '同意が必要です。');
      return;
    }

    submit.disabled = true;
    submit.classList.add('pv-is-load');
    form.setAttribute('aria-busy', 'true');

    uploadFiles(controls)
      .then(function (attachmentIds) {
        var payload = { attachment_ids: attachmentIds, source_url: location.href, locale: locale };
        if (schema.consent_required) {
          payload.consent = !!(consentInput && consentInput.checked);
        }
        for (var name in controls) {
          var c = controls[name];
          if (c.field.field_type === 'file') {
            continue;
          }
          if (c.field.field_type === 'checkbox') {
            payload[name] = c.input.checked ? '1' : '';
          } else {
            payload[name] = c.input.value;
          }
        }

        return fetch(api + '/submissions', {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload)
        });
      })
      .then(function (r) {
        if (r.status === 201 || r.status === 204) {
          form.reset();
          // After-submit behaviour (builder フォーム設定): redirect away, or show the form's
          // completion message (falling back to the built-in thank-you text).
          if (schema.post_submit === 'redirect' && isStr(schema.redirect_url) && schema.redirect_url) {
            location.href = schema.redirect_url;
            return;
          }
          var done = localized(schema.success_message, locale)
            || (locale === 'en' ? 'Thank you — your message was sent.' : '送信しました。ありがとうございます。');
          showMessage(msg, 'ok', done);
          return;
        }
        if (r.status === 422) {
          return r.json().then(function (body) {
            applyValidationErrors(controls, body, msg, locale);
          });
        }
        showMessage(msg, 'err', locale === 'en' ? 'Could not send. Please try again later.' : '送信できませんでした。時間をおいて再度お試しください。');
      })
      .catch(function () {
        showMessage(msg, 'err', locale === 'en' ? 'Network error. Please try again.' : '通信エラーが発生しました。');
      })
      .then(function () {
        submit.disabled = false;
        submit.classList.remove('pv-is-load');
        form.removeAttribute('aria-busy');
      });
  }

  function uploadFiles(controls) {
    var uploads = [];
    for (var name in controls) {
      var c = controls[name];
      if (c.field.field_type === 'file' && c.input.files && c.input.files.length) {
        for (var i = 0; i < c.input.files.length; i++) {
          uploads.push(uploadOne(c.input.files[i]));
        }
      }
    }
    return Promise.all(uploads).then(function (ids) {
      return ids.filter(function (id) { return id != null; });
    });
  }

  function uploadOne(file) {
    var fd = new FormData();
    fd.append('file', file);
    return fetch(api + '/attachments', { method: 'POST', credentials: 'omit', body: fd })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) { return body && body.attachment_id ? body.attachment_id : null; })
      .catch(function () { return null; });
  }

  function applyValidationErrors(controls, body, msg, locale) {
    var errors = body && Array.isArray(body.errors) ? body.errors : [];
    var handled = false;
    errors.forEach(function (e) {
      var c = controls[e.field];
      if (c && c.error) {
        c.error.textContent = e.message || 'Invalid value.';
        handled = true;
      }
    });
    if (!handled) {
      showMessage(msg, 'err', locale === 'en' ? 'Please check your input.' : '入力内容をご確認ください。');
    }
  }
})();
