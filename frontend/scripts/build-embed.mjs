// Production build for the embed widget (#330, M7 / ADR 0010 §7).
//
// Takes the hand-written, CSP-friendly `public_html/embed.js` and produces a minified,
// content-hashed, long-cache-immutable artifact plus an SRI manifest:
//
//   public_html/embed/embed.<hash>.js   minified widget (immutable; safe for long-cache)
//   public_html/embed/embed.js          stable alias — the main install path, same bytes
//   public_html/embed/manifest.json     { file, stable, bytes, integrity (sha384), snippets, previous }
//
// The hash is derived only from the minified bytes (no timestamps) so the build is
// reproducible: unchanged source → identical filename + manifest (no churn). Nothing in the
// manifest carries a timestamp for the same reason — a build that reports itself as changed when
// it has not is a false signal, and #585 kept it that way deliberately.
//
// Distribution contract (#585): the **stable URL is the main path**, it is SRI-pinnable (the
// integrity value covers it, because the bytes are identical), and **one** previous hashed
// generation is retained as a transition window.
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

// Retention: keep the current hashed build **and exactly one previous generation**; drop the rest.
// The stable alias (`embed.js`, no hash segment) never matches this pattern, so it is
// preserved/updated. Deleting every old generation immediately (what this did before #585) is what
// made a recorded hashed URL 404 as soon as the widget was rebuilt — a caller who had pinned it was
// broken with no overlap at all. One generation is a transition window, not a second distribution
// channel: the main path stays the stable URL, which always holds the latest bytes.
//
// The generation to keep is read from the **previous manifest**, not from mtimes, so the choice is
// deterministic and a rebuild from unchanged source still produces an identical manifest.
const HASHED = /^embed\.[0-9a-f]+\.js$/;
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

/** Basename of a manifest path field (`embed/embed.<hash>.js` → `embed.<hash>.js`), or null. */
const basenameOf = (value) => (typeof value === 'string' ? path.basename(value) : null);

let previousManifest = null;
try {
  previousManifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch {
  // No manifest yet (fresh checkout — the build output is gitignored), or it is unreadable.
  // Either way there is no recorded generation to retain.
}

const lastBuilt = basenameOf(previousManifest?.file);
// An unchanged rebuild must not shift the window: when the current build *is* the last one, the
// retained generation stays whatever the last manifest already retained.
const candidate = lastBuilt === file ? basenameOf(previousManifest?.previous) : lastBuilt;
const existing = new Set(readdirSync(OUT_DIR).filter((f) => HASHED.test(f)));
const retained =
  candidate !== null && candidate !== file && existing.has(candidate) ? candidate : null;

for (const f of existing) {
  if (f !== file && f !== retained) rmSync(path.join(OUT_DIR, f));
}
writeFileSync(path.join(OUT_DIR, file), bytes);

// Stable alias: a fixed name that always holds the latest widget bytes, so a caller embeds
// `/embed/embed.js` and the URL never moves under them. Long-cache must NOT be applied to this file
// (serve it no-cache / short TTL).
//
// #585 changed what this alias means for SRI. It is byte-identical to the hashed artifact, so the
// integrity value below covers **both** URLs, and a caller that must pin (records' `trusted-embed`
// hardcodes `crossorigin` + `integrity`) pins *this* URL and re-reads the value from this manifest
// at deploy time. The trade is explicit: the URL is stable and the SRI value moves, instead of the
// SRI value being stable and the URL 404-ing. Pinning is fail-closed either way — a stale
// `integrity` blocks the script — so whoever redeploys the widget must update the embedding site
// in the same wave.
const STABLE = 'embed.js';
writeFileSync(path.join(OUT_DIR, STABLE), bytes);

const manifest = {
  source: 'public_html/embed.js',
  file: `embed/${file}`,
  bytes: bytes.length,
  integrity,
  // The two URLs below are the *same bytes*, so this one integrity value is valid for both. Stated
  // rather than duplicated: a second copy of the value would be a second thing to keep in step.
  integrityAppliesTo: [`embed/${file}`, `embed/${STABLE}`],
  // Production install snippet — long-cache immutable + SRI. Replace {host} and {public_form_key}.
  snippet:
    `<script src="https://{host}/embed/${file}" data-form="{public_form_key}"\n` +
    `        data-trigger="modal" integrity="${integrity}"\n` +
    `        crossorigin="anonymous" async></script>`,
  // Stable alias: fixed URL that follows the latest build (no hash churn, no 404 on redeploy).
  // SRI-pinnable as of #585 — same bytes, same value — but the value moves whenever the widget is
  // rebuilt, so an embedding site must re-read it from this manifest on every widget deploy.
  stable: `embed/${STABLE}`,
  stableSnippet:
    `<script src="https://{host}/embed/${STABLE}" data-form="{public_form_key}"\n` +
    `        data-trigger="modal" integrity="${integrity}"\n` +
    `        crossorigin="anonymous" async></script>`,
  // The one retained previous generation (#585), or null when this is the first build in this
  // output directory. It exists only so a caller that pinned the last hashed URL is not 404'd the
  // moment a new build lands; it is not a supported install target.
  previous: retained === null ? null : `embed/${retained}`,
};
writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const srcBytes = Buffer.byteLength(source, 'utf8');
console.log(`✓ built public_html/embed/${file}`);
console.log(`  + stable alias public_html/embed/${STABLE} (main install path; SRI = same value)`);
console.log(
  retained === null
    ? '  + no previous generation retained (first build in this output directory)'
    : `  + retained previous generation public_html/embed/${retained}`,
);
console.log(
  `  ${srcBytes}B → ${bytes.length}B minified (${Math.round((1 - bytes.length / srcBytes) * 100)}% smaller)`,
);
console.log(`  integrity: ${integrity}`);
console.log(`  manifest:  public_html/embed/manifest.json`);
