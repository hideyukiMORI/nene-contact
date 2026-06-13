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
 * NOTE: chat currently renders via the modal launcher; the conversational one-by-one stepper
 * is a dedicated follow-up.
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

  var api = base + '/public/forms/' + encodeURIComponent(formKey);

  // Web-safe font stacks only (no host-page dependency; spec §0/§13). The studio preview uses
  // the loaded console fonts; the embed stays portable.
  var FONTS = {
    system: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
    sans: '"Helvetica Neue",Arial,sans-serif',
    serif: 'Georgia,"Times New Roman",serif'
  };
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
  var MODES = { modal: 1, chat: 1, inline: 1 };

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
    var h = a.hero && typeof a.hero === 'object' ? a.hero : {};
    return {
      mode: pick(a, 'mode', isOneOf(['modal', 'chat', 'inline']), 'modal'),
      theme: pick(a, 'theme', isOneOf(['light', 'dark']), 'light'),
      font: pick(a, 'font', isOneOf(['system', 'sans', 'serif']), 'sans'),
      fontH: pick(a, 'fontH', isOneOf(['system', 'sans', 'serif']), 'sans'),
      colors: {
        accent: pick(c, 'accent', isStr, '#dc5b34'),
        surface: pick(c, 'surface', isStr, '#ffffff'),
        text: pick(c, 'text', isStr, '#161a22'),
        muted: pick(c, 'muted', isStr, '#5a6273'),
        border: pick(c, 'border', isStr, '#e2e6eb'),
        inputBg: pick(c, 'inputBg', isStr, '#ffffff'),
        error: pick(c, 'error', isStr, '#d14343'),
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
      hero: {
        on: h.on !== false,
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
      '.pv-btn--solid{background:var(--pv-accent);color:var(--pv-btn-text);border:var(--pv-bw) solid transparent}',
      '.pv-btn--outline{background:transparent;color:var(--pv-accent);border:1.5px solid var(--pv-accent)}',
      '.pv-btn--soft{background:color-mix(in srgb,var(--pv-accent) 15%,var(--pv-surface));color:var(--pv-accent);border:0}',
      '.pv-foot{text-align:center;font-size:11.5px;color:var(--pv-muted);margin-top:16px}',
      '.pv-err{color:var(--pv-error);font-size:11.5px;margin-top:4px}',
      '.pv-msg{font-size:13px;padding:9px 11px;border-radius:var(--pv-r-input);margin-top:4px}',
      '.pv-msg.ok{background:color-mix(in srgb,#16a34a 12%,var(--pv-surface));color:#15803d}',
      '.pv-msg.err{background:color-mix(in srgb,var(--pv-error) 12%,var(--pv-surface));color:var(--pv-error)}',
      '.pv-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
      '.pv-hero{position:relative;overflow:hidden;background-position:center;background-repeat:no-repeat;border-radius:calc(var(--pv-r-form) * .72);margin-bottom:18px}',
      '.pv-hero__ov{position:absolute;inset:0}',
      '.pv-hero__txt{position:absolute;left:0;right:0;bottom:0;padding:16px 18px;color:#fff}',
      '.pv-hero__txt .ttl{color:#fff;margin:0;font-size:19px;font-weight:700;letter-spacing:-0.01em;font-family:var(--pv-font-h)}',
      '.pv-hero__txt .desc{color:rgba(255,255,255,.86);margin:5px 0 0;font-size:12px;line-height:1.5}',
      /* inline: a card placed in the host page flow */
      '.pv-embed{width:var(--pv-modal-w);max-width:100%;padding:26px 26px 24px;background:var(--pv-surface);border:var(--pv-bw) var(--pv-bstyle) var(--pv-bcolor);border-radius:var(--pv-r-form);box-shadow:0 10px 34px rgba(18,28,38,.10)}',
      '.pv-embed.center{margin:0 auto}.pv-embed.right{margin-left:auto}.pv-embed.left{margin-right:auto}',
      /* launcher + modal: fixed to the viewport in production */
      '.pv-launcher{position:fixed;bottom:20px;z-index:2147483000;padding:0 18px;height:48px;border:0;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:9px;background:var(--pv-accent);color:var(--pv-btn-text);font:700 13px/1 var(--pv-font);box-shadow:0 8px 24px color-mix(in srgb,var(--pv-accent) 40%,transparent)}',
      '.pv-launcher.right{right:20px}.pv-launcher.left{left:20px}',
      '.pv-launcher.circle{width:56px;height:56px;padding:0;justify-content:center}',
      '.pv-launcher svg{width:19px;height:19px}',
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

  function mount(schema, a) {
    var locale = resolveLocale(schema);
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

    // modal + chat (interim): a launcher opens the themed form in a centered/right modal.
    var launcher = el('button', { type: 'button', 'class': 'pv-launcher ' + a.launcher.side + ' ' + a.launcher.shape });
    launcher.appendChild(icon('chat'));
    if (a.launcher.shape === 'pill') {
      launcher.appendChild(el('span', null, a.launcher.label));
    }
    root.appendChild(launcher);
    launcher.addEventListener('click', function () {
      openModal(root, schema, locale, a);
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
    var submit = el('button', { type: 'submit', 'class': 'pv-btn pv-btn--' + a.button.style }, submitText);
    submit.appendChild(icon('send'));
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
    var hero = el('div', { 'class': 'pv-hero' });
    hero.setAttribute(
      'style',
      'height:' + a.hero.height + 'px;margin:' + a.hero.inset + 'px;' +
        'background-image:' + heroBackground(a.hero.media) + ';background-size:' + a.hero.fit + ';'
    );
    hero.appendChild(el('div', { 'class': 'pv-hero__ov', style: 'background:rgba(10,14,20,' + a.hero.overlay + ')' }));
    if (a.hero.overlayTitle && (titleText || descText)) {
      var txt = el('div', { 'class': 'pv-hero__txt' });
      if (titleText) { txt.appendChild(el('h3', { 'class': 'ttl' }, titleText)); }
      if (descText) { txt.appendChild(el('p', { 'class': 'desc' }, descText)); }
      hero.appendChild(txt);
    }
    return hero;
  }

  function showMessage(msg, kind, text) {
    msg.textContent = '';
    msg.appendChild(el('div', { 'class': 'pv-msg ' + kind }, text));
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
