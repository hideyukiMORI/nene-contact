// Production build for the embed widget (#330, M7 / ADR 0010 §7).
//
// Takes the hand-written, CSP-friendly `public_html/embed.js` and produces a minified,
// content-hashed, long-cache-immutable artifact plus an SRI manifest:
//
//   public_html/embed/embed.<hash>.js   minified widget (immutable; safe for long-cache)
//   public_html/embed/manifest.json     { file, bytes, integrity (sha384), snippet }
//
// The hash is derived only from the minified bytes (no timestamps) so the build is
// reproducible: unchanged source → identical filename + manifest (no churn).
//
// Run: `npm run build:embed` (from frontend/). esbuild is already a dev dependency.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transform } from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(repoRoot, 'public_html', 'embed.js');
const OUT_DIR = path.join(repoRoot, 'public_html', 'embed');

const source = readFileSync(SRC, 'utf8');

// CSP guard — the widget must stay eval-free with no inline-HTML injection (spec §"CSP-friendly").
const FORBIDDEN = [
  [/\beval\s*\(/, 'eval('],
  [/new\s+Function\s*\(/, 'new Function('],
  [/\.innerHTML\b/, '.innerHTML'],
  [/\bdocument\.write\b/, 'document.write'],
  [/insertAdjacentHTML/, 'insertAdjacentHTML'],
];
const violations = FORBIDDEN.filter(([re]) => re.test(source)).map(([, name]) => name);
if (violations.length > 0) {
  console.error(`✗ CSP guard failed — embed.js must not use: ${violations.join(', ')}`);
  process.exit(1);
}

const { code, warnings } = await transform(source, {
  minify: true,
  target: 'es2017',
  legalComments: 'none',
});
for (const w of warnings) console.warn(`esbuild: ${w.text}`);

const bytes = Buffer.from(code, 'utf8');
const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const file = `embed.${hash}.js`;
const integrity = 'sha384-' + createHash('sha384').update(bytes).digest('base64');

mkdirSync(OUT_DIR, { recursive: true });
// Drop any previous hashed builds so the dir holds exactly the current artifact.
for (const f of readdirSync(OUT_DIR)) {
  if (/^embed\.[0-9a-f]+\.js$/.test(f)) rmSync(path.join(OUT_DIR, f));
}
writeFileSync(path.join(OUT_DIR, file), bytes);

const manifest = {
  source: 'public_html/embed.js',
  file: `embed/${file}`,
  bytes: bytes.length,
  integrity,
  // Production install snippet — long-cache immutable + SRI. Replace {host} and {public_form_key}.
  snippet:
    `<script src="https://{host}/embed/${file}" data-form="{public_form_key}"\n` +
    `        data-trigger="modal" integrity="${integrity}"\n` +
    `        crossorigin="anonymous" async></script>`,
};
writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const srcBytes = Buffer.byteLength(source, 'utf8');
console.log(`✓ built public_html/embed/${file}`);
console.log(
  `  ${srcBytes}B → ${bytes.length}B minified (${Math.round((1 - bytes.length / srcBytes) * 100)}% smaller)`,
);
console.log(`  integrity: ${integrity}`);
console.log(`  manifest:  public_html/embed/manifest.json`);
