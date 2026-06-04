/*
 * NeNe Contact embed widget (embed-widget-spec). Paste one script line:
 *
 *   <script src="https://{host}/embed.js" data-form="{public_form_key}"
 *           data-trigger="floating" data-lang="ja" async></script>
 *
 * Vanilla JS, CSP-friendly (no eval; DOM built via createElement/textContent), isolated in
 * a shadow root. Talks to the Contact host the script was loaded from, using CORS "simple"
 * requests (GET schema, multipart upload, text/plain JSON submit) so no preflight is needed.
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

  var trigger = script.getAttribute('data-trigger') || 'floating';
  var langAttr = script.getAttribute('data-lang') || '';
  var buttonLabel = script.getAttribute('data-button-label') || '';

  var api = base + '/public/forms/' + encodeURIComponent(formKey);

  fetch(api + '/schema', { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) {
        throw new Error('schema unavailable');
      }
      return r.json();
    })
    .then(function (schema) {
      mount(schema);
    })
    .catch(function () {
      /* fail silently — never break the host page */
    });

  function resolveLocale(schema) {
    var locales = Array.isArray(schema.locales) && schema.locales.length ? schema.locales : ['ja'];
    if (langAttr && locales.indexOf(langAttr) !== -1) {
      return langAttr;
    }
    return schema.default_locale || locales[0] || 'ja';
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

  function styles() {
    return [
      ':host{all:initial}',
      '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
      '.nene-contact-form{display:flex;flex-direction:column;gap:12px;max-width:420px}',
      '.nene-contact-field{display:flex;flex-direction:column;gap:4px}',
      '.nene-contact-label{font-size:13px;font-weight:600;color:#1f2937}',
      '.nene-contact-req{color:#dc2626;margin-left:2px}',
      '.nene-contact-input,.nene-contact-textarea,.nene-contact-select{padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;width:100%}',
      '.nene-contact-textarea{min-height:88px;resize:vertical}',
      '.nene-contact-consent{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#374151}',
      '.nene-contact-error{color:#dc2626;font-size:12px}',
      '.nene-contact-submit{padding:10px 14px;background:#2563eb;color:#fff;border:0;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer}',
      '.nene-contact-submit:disabled{opacity:.6;cursor:default}',
      '.nene-contact-msg{font-size:14px;padding:8px 10px;border-radius:6px}',
      '.nene-contact-msg.ok{background:#ecfdf5;color:#065f46}',
      '.nene-contact-msg.err{background:#fef2f2;color:#991b1b}',
      '.nene-contact-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
      '.nene-contact-launch{position:fixed;right:20px;bottom:20px;z-index:2147483000;padding:12px 18px;background:#2563eb;color:#fff;border:0;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2)}',
      '.nene-contact-btn{padding:10px 16px;background:#2563eb;color:#fff;border:0;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer}',
      '.nene-contact-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}',
      '.nene-contact-panel{background:#fff;border-radius:12px;padding:20px;max-width:460px;width:100%;max-height:90vh;overflow:auto;position:relative}',
      '.nene-contact-close{position:absolute;top:10px;right:12px;background:none;border:0;font-size:22px;line-height:1;cursor:pointer;color:#6b7280}',
      '.nene-contact-title{font-size:18px;font-weight:700;margin:0 0 12px;color:#111827}'
    ].join('');
  }

  function mount(schema) {
    var locale = resolveLocale(schema);
    var host = el('div', { 'data-nene-contact': formKey });
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.appendChild(el('style', null, styles()));

    if (trigger === 'inline') {
      root.appendChild(buildForm(schema, locale));
      if (script.parentNode) {
        script.parentNode.insertBefore(host, script);
      }
      return;
    }

    var launcher = el('button', { type: 'button', 'class': trigger === 'button' ? 'nene-contact-btn' : 'nene-contact-launch' },
      buttonLabel || localized(schema.name && typeof schema.name === 'object' ? schema.name : null, locale) || schema.name || 'Contact');
    root.appendChild(launcher);
    launcher.addEventListener('click', function () {
      openModal(root, schema, locale);
    });
  }

  function openModal(root, schema, locale) {
    if (root.querySelector('.nene-contact-overlay')) {
      return;
    }
    var overlay = el('div', { 'class': 'nene-contact-overlay' });
    var panel = el('div', { 'class': 'nene-contact-panel' });
    var close = el('button', { type: 'button', 'class': 'nene-contact-close', 'aria-label': 'Close' }, '×');
    close.addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) { overlay.remove(); } });
    panel.appendChild(close);
    panel.appendChild(buildForm(schema, locale));
    overlay.appendChild(panel);
    root.appendChild(overlay);
  }

  function buildForm(schema, locale) {
    var form = el('form', { 'class': 'nene-contact-form', novalidate: 'novalidate' });
    var fields = Array.isArray(schema.fields) ? schema.fields : [];

    if (schema.name) {
      form.appendChild(el('h2', { 'class': 'nene-contact-title' }, localized(typeof schema.name === 'object' ? schema.name : null, locale) || schema.name));
    }

    var controls = {};

    fields.forEach(function (field) {
      if (field.field_type === 'honeypot') {
        var hp = el('input', { type: 'text', name: field.name, autocomplete: 'off', tabindex: '-1', 'class': 'nene-contact-hp', 'aria-hidden': 'true' });
        form.appendChild(hp);
        controls[field.name] = { field: field, input: hp };
        return;
      }

      var wrap = el('div', { 'class': 'nene-contact-field' });
      var labelText = localized(field.label, locale) || field.name;
      var label = el('label', { 'class': 'nene-contact-label' }, labelText);
      if (field.required) {
        label.appendChild(el('span', { 'class': 'nene-contact-req' }, '*'));
      }
      wrap.appendChild(label);

      var input;
      if (field.field_type === 'textarea') {
        input = el('textarea', { 'class': 'nene-contact-textarea', name: field.name });
      } else if (field.field_type === 'select') {
        input = el('select', { 'class': 'nene-contact-select', name: field.name });
        input.appendChild(el('option', { value: '' }, ''));
        (Array.isArray(field.options) ? field.options : []).forEach(function (opt) {
          var value = opt && (opt.value != null ? String(opt.value) : (opt.name != null ? String(opt.name) : ''));
          var text = localized(opt && opt.label, locale) || value;
          input.appendChild(el('option', { value: value }, text));
        });
      } else if (field.field_type === 'checkbox') {
        input = el('input', { type: 'checkbox', name: field.name, value: '1' });
      } else if (field.field_type === 'file') {
        input = el('input', { type: 'file', 'class': 'nene-contact-input', name: field.name });
      } else {
        input = el('input', { type: field.field_type === 'email' ? 'email' : 'text', 'class': 'nene-contact-input', name: field.name });
      }
      wrap.appendChild(input);
      var err = el('div', { 'class': 'nene-contact-error' });
      wrap.appendChild(err);
      controls[field.name] = { field: field, input: input, error: err };
      form.appendChild(wrap);
    });

    var consentInput = null;
    if (schema.consent_required) {
      var cWrap = el('label', { 'class': 'nene-contact-consent' });
      consentInput = el('input', { type: 'checkbox' });
      cWrap.appendChild(consentInput);
      cWrap.appendChild(el('span', null, localized(schema.consent_label, locale) || 'I agree.'));
      form.appendChild(cWrap);
    }

    var msg = el('div');
    form.appendChild(msg);

    var submit = el('button', { type: 'submit', 'class': 'nene-contact-submit' }, locale === 'en' ? 'Send' : '送信');
    form.appendChild(submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(form, schema, locale, controls, consentInput, submit, msg);
    });

    return form;
  }

  function showMessage(msg, kind, text) {
    msg.textContent = '';
    var box = el('div', { 'class': 'nene-contact-msg ' + kind }, text);
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

    uploadFiles(controls)
      .then(function (attachmentIds) {
        var payload = { attachment_ids: attachmentIds };
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

        // text/plain keeps this a CORS "simple" request (no preflight); the server
        // parses the JSON body regardless of content type.
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
          showMessage(msg, 'ok', locale === 'en' ? 'Thank you — your message was sent.' : '送信しました。ありがとうございます。');
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
    // multipart/form-data is a CORS "simple" request — no preflight.
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
