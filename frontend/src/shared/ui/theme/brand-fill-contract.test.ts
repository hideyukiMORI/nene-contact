import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// #562 pinned the *pairing*, not the individual colour values.
//
// `--ex-brand` (oklch 0.625 0.172 40) is 3.84:1 against white: fine for a border or a focus ring
// (3:1), short of the 4.5:1 a label needs. Nine rules across the console -- the primary button,
// the login submit, the sidebar badge, three avatars, the active form tab -- filled themselves
// with `--ex-brand` and wrote their label in `--ex-brand-ink` (#fff), so every one of them sat at
// 3.84:1 in both themes. Each looked like a perfectly ordinary brand button, which is why the set
// survived a full design pass and the #312 audit: nothing about the CSS reads as wrong, and the
// number only appears if someone composites the pixels and measures.
//
// The fix moved those fills to `--ex-brand-fill` (same hue and chroma, L 0.625 -> 0.565) and left
// the brand hue itself untouched. This test fails if a new fill re-creates the old pairing, which
// a colour-value assertion would not catch: the values are legal, it is the combination that is
// unreachable.
// Resolved from the project root -- the jsdom environment gives import.meta.url an http:// URL,
// so no file:// path can be derived from it.
const css = readFileSync(resolve(process.cwd(), 'src/shared/ui/theme/index.css'), 'utf8');

/** Rule blocks (selector + declarations) that paint text in --ex-brand-ink. */
const inkRules = css
  .split('}')
  .map((chunk) => chunk.trim())
  .filter((chunk) => chunk.includes('var(--ex-brand-ink)'));

describe('brand fill contract', () => {
  it('every rule that writes in --ex-brand-ink fills with --ex-brand-fill', () => {
    expect(inkRules.length).toBeGreaterThan(0);

    for (const rule of inkRules) {
      // Section comments sit between rules, so they ride along in the chunk before the brace;
      // drop them or the failure message names a banner instead of the offending selector.
      const selector = rule
        .slice(0, rule.indexOf('{'))
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();
      // 4.91:1 with #fff, versus 3.84:1 for --ex-brand.
      expect(rule, `${selector} paints #fff on a fill that is not --ex-brand-fill`).toMatch(
        /background:\s*var\(--ex-brand-fill\)/,
      );
      expect(rule, `${selector} still fills with the decorative --ex-brand`).not.toMatch(
        /background:\s*var\(--ex-brand\)/,
      );
    }
  });

  it('--ex-brand-fill is darker than --ex-brand, and both keep the same hue', () => {
    const oklch = (name: string): [number, number, number] => {
      const value = css.match(new RegExp(`^\\s*${name}:\\s*oklch\\(([^)]+)\\);`, 'm'))?.[1];
      if (value === undefined) {
        throw new Error(`${name} is not declared as an oklch() literal`);
      }
      const parts = value.trim().split(/\s+/).map(Number);
      if (parts.length < 3 || parts.some(Number.isNaN)) {
        throw new Error(`${name} is not a three-component oklch() literal: ${value}`);
      }
      return [parts[0]!, parts[1]!, parts[2]!];
    };

    const [brandL, brandC, brandH] = oklch('--ex-brand');
    const [fillL, fillC, fillH] = oklch('--ex-brand-fill');

    // The AYANE brand hue is a deliberate choice (H40 vermilion) and this change must not move
    // it -- only lightness may differ, which is what keeps the console recognisably the same.
    expect(fillH).toBe(brandH);
    expect(fillC).toBe(brandC);
    expect(fillL).toBeLessThan(brandL);
  });

  it('states derived from a brand fill are mixed from --ex-brand-fill, not --ex-brand', () => {
    // A hover mixed from --ex-brand would land *lighter* than the --ex-brand-fill it covers,
    // inverting "darker on interaction" -- and it carries the same #fff label, so it has to
    // clear 4.5:1 too.
    for (const selector of ['.ex-btn:hover', '.lpf__btn:hover:not(:disabled)']) {
      const start = css.indexOf(selector);
      expect(start, `${selector} not found in theme CSS`).toBeGreaterThan(-1);
      const rule = css.slice(css.indexOf('{', start), css.indexOf('}', start));
      expect(rule).toMatch(/background:\s*color-mix\(in srgb, var\(--ex-brand-fill\)/);
    }
  });
});
