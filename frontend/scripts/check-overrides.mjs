#!/usr/bin/env node
/**
 * Probes that dependency `overrides` did not break the packages they were forced onto.
 *
 * An override silences an advisory by pinning a version — but nothing checks that the pinned
 * version still speaks the API its dependents expect. #530 collapsed brace-expansion to a flat
 * `^5.0.8`, which forced v5 onto `minimatch@3` (a v1-era CJS consumer) and broke it with
 * `TypeError: expand is not a function`. Lint stayed green the whole time, because minimatch@3
 * only calls brace-expansion for patterns containing `{...}` — a code path our config never hit.
 * A green build is not evidence that an override is safe; this file is.
 *
 * Add a probe whenever an override crosses a major version. Keep each one to the smallest call
 * that actually exercises the overridden package, and run it against **every copy on disk** —
 * npm keeps one per incompatible range, and the hoisted one being fine proves nothing about the
 * nested ones.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Probing the hoisted copy alone is NOT enough: npm keeps a separate nested copy per
 * incompatible range, and an override reaches every one of them. A sibling product found the
 * hoisted copy healthy while a nested `minimatch@5` under its codegen path was broken. So walk
 * every copy on disk and exercise each one directly.
 *
 * @param {string} pkg
 * @param {(mod: unknown) => void} exercise
 * @returns {{ dir: string, version: string, error: string | null }[]}
 */
function probeEveryCopy(pkg, exercise) {
  const found = execFileSync(
    'find',
    ['node_modules', '-type', 'd', '-name', pkg, '-not', '-path', `*/${pkg}/node_modules/*`],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  return found.map((dir) => {
    let version = 'unknown';
    try {
      version = require(`${process.cwd()}/${dir}/package.json`).version;
      exercise(require(`${process.cwd()}/${dir}`));
      return { dir, version, error: null };
    } catch (error) {
      return { dir, version, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

/** @type {{ name: string, why: string, run: () => { dir: string, version: string, error: string | null }[] }[]} */
const PROBES = [
  {
    name: 'minimatch brace expansion (overrides: brace-expansion@1/@2/@5)',
    why: 'minimatch@3 consumes the brace-expansion v1 CJS export; a flat v5 override breaks it.',
    run: () =>
      probeEveryCopy('minimatch', (mod) => {
        const match = typeof mod === 'function' ? mod : mod.minimatch;
        if (match('abd', 'a{b,c}d') !== true) {
          throw new Error('brace pattern a{b,c}d did not match abd');
        }
      }),
  },
];

let failed = 0;
for (const probe of PROBES) {
  const results = probe.run();
  if (results.length === 0) {
    failed += 1;
    console.error(`FAIL ${probe.name}: no copy found — the probe is measuring nothing`);
    continue;
  }
  for (const { dir, version, error } of results) {
    if (error === null) {
      console.log(`ok   ${probe.name} [${version}] ${dir}`);
    } else {
      failed += 1;
      console.error(`FAIL ${probe.name} [${version}] ${dir}`);
      console.error(`     ${probe.why}`);
      console.error(`     ${error}`);
    }
  }
}

if (failed > 0) {
  console.error(
    `\n${String(failed)} override probe(s) failed — an override is breaking a dependent.`,
  );
  process.exit(1);
}
console.log(`\n${String(PROBES.length)} override probe(s) passed.`);
