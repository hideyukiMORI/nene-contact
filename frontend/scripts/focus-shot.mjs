// Focus-state smoke shots.
//
// Why this exists: the console's screenshot and e2e paths never focus anything, so a broken
// focus indicator is invisible to every check we run -- which is exactly how #560 survived
// (a 1.11:1 ring on the login screen) until it was measured by hand. Fixing the values without
// adding a path that *looks* at focus would leave the next regression just as invisible.
//
// It serves the built console statically, tabs through the login screen, and writes one PNG per
// (theme x element). Ships as `npm run smoke:focus`. Output is local-only; nothing is compared
// automatically yet -- the point is that focus states are now producible on demand and land in a
// reviewable artefact. Mirrors deal's tools/smoke/focus-shot.mjs.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = resolve(process.argv[2] ?? '../public_html/console');
const OUT = resolve(process.env.FOCUS_SHOT_OUT ?? '.smoke-focus');
const PORT = Number(process.env.FOCUS_SHOT_PORT ?? 8912);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// SPA-style static server. The build hard-codes `/console/...` asset URLs, so the tree has to be
// mounted at that prefix or nothing loads; anything without a file extension falls back to
// index.html so client-side routes resolve.
const BASE = '/console';
const server = createServer(async (req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
  const file = extname(path) ? join(ROOT, path) : join(ROOT, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((r) => server.listen(PORT, r));
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const shots = [];

for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await page.addInitScript((t) => globalThis.localStorage.setItem('nc_theme', t), theme);
  // The API is not running here; the console falls through to the login screen, which is the
  // screen we want and the one a keyboard user always meets first.
  await page.goto(`http://127.0.0.1:${PORT}${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  for (const [name, selector] of [
    ['input', 'input'],
    ['button', 'button'],
  ]) {
    const el = page.locator(selector).first();
    if ((await el.count()) === 0) continue;
    await el.focus();
    await page.waitForTimeout(400); // box-shadow transitions run ~130ms
    const file = join(OUT, `login-${theme}-${name}.png`);
    await el.screenshot({ path: file, scale: 'css', animations: 'disabled' }).catch(async () => {
      await page.screenshot({ path: file });
    });
    const box = await el.boundingBox();
    const style = await el.evaluate((node) => {
      const cs = getComputedStyle(node);
      return { boxShadow: cs.boxShadow, outline: cs.outline, outlineOffset: cs.outlineOffset };
    });
    shots.push({ theme, name, file, box, style });
  }
  await page.close();
}

await browser.close();
server.close();

await writeFile(join(OUT, 'focus-shot.json'), JSON.stringify(shots, null, 2) + '\n');
for (const s of shots) {
  console.log(`${s.theme.padEnd(5)} ${s.name.padEnd(6)} -> ${s.file}`);
  console.log(`      box-shadow: ${s.style.boxShadow}`);
  console.log(`      outline   : ${s.style.outline} (offset ${s.style.outlineOffset})`);
}
console.log(`\n${shots.length} shots + focus-shot.json in ${OUT}`);
