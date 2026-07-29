import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// #560 / #312 pinned the *shape* of the focus indicator, not just its colour values, because the
// two defects they fixed were both shape failures that a colour check would have called green:
//   - a translucent ring measured 1.1-1.8:1 while looking like a perfectly normal focus style,
//   - a solid ring on a filled button would measure fine against the page and still be invisible
//     against the button it sits on.
// Nothing in type-check, lint or the render tests can see either, so these assertions read the
// stylesheet and fail if the shape regresses.
// Resolved from the project root: the test runs in a jsdom environment where import.meta.url is
// an http:// URL, so a file:// URL cannot be derived from it.
const css = readFileSync(resolve(process.cwd(), 'src/shared/ui/theme/index.css'), 'utf8');

// A custom-property declaration ends at the semicolon, not at a brace -- reusing the rule-block
// reader here would silently return the *next* rule and assert against the wrong text.
const decl = (name: string): string => {
  const value = css.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'))?.[1];
  if (value === undefined) {
    throw new Error(`${name} is not declared in the theme CSS`);
  }
  return value;
};

const block = (selector: string): string => {
  const start = css.indexOf(selector);
  expect(start, `${selector} not found in theme CSS`).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open, close);
};

describe('focus indicator contract', () => {
  it('--focus-ring paints two rings, so the accent never sits directly on the component', () => {
    const ring = decl('--focus-ring');
    // WCAG 2.2 SC 1.4.11 measures against every adjacent colour, including the component itself.
    // The inner ring is the surface colour; drop it and a focused accent-filled control loses
    // its indicator entirely.
    expect(ring).toMatch(/var\(--surface\)/);
    expect(ring).toMatch(/var\(--focus\)/);
  });

  it('--focus is a solid colour, never a transparent mix', () => {
    // `color-mix(..., transparent)` is what produced the 1.48:1 ring this contract replaced.
    expect(decl('--focus')).not.toMatch(/transparent/);
  });

  it('the shared button focus outline keeps its offset', () => {
    // .ex-btn is filled with --ex-brand and its outline is --ex-brand: without the gap the
    // contrast against the button is 1.00:1. The offset is the whole indicator.
    const rule = block('.ex-btn:focus-visible');
    expect(rule).toMatch(/outline-offset:\s*2px/);
  });

  it('controls that clear the UA outline put a :focus-visible ring back', () => {
    for (const selector of ['.fb-desc-in', '.st-slider']) {
      expect(css, `${selector} clears outline without a :focus-visible replacement`).toMatch(
        new RegExp(`\\${selector}[^{]*:focus-visible`),
      );
    }
  });

  it('studio controls are registered for focus-visible rather than relying on the UA default', () => {
    for (const selector of [
      '.st-btn:focus-visible',
      '.st-tab:focus-visible',
      '.st-iconbtn:focus-visible',
    ]) {
      expect(css).toContain(selector);
    }
  });
});

describe('brand text contrast contract', () => {
  it('defines an accessible pair alongside the decorative accent', () => {
    // --ex-brand is 3.84:1 on white: a border colour, not a text colour. These two carry text.
    expect(css).toMatch(/--ex-brand-fill:/);
    expect(css).toMatch(/--ex-brand-text:/);
  });

  it('dark overrides --ex-brand-text, because the light value is too dark on a dark surface', () => {
    const darkBlock = css.slice(
      css.indexOf("[data-theme='dark']", css.indexOf('--ex-brand-fill:')),
    );
    expect(darkBlock).toMatch(/--ex-brand-text:/);
  });

  it('the studio button and active tab use the accessible tokens, not the accent', () => {
    expect(block('.st-btn {')).toMatch(/background:\s*var\(--ex-brand-fill\)/);
    expect(block('.st-tab.on {')).toMatch(/color:\s*var\(--ex-brand-text\)/);
  });

  it('the studio breadcrumb is not drawn in --ex-faint', () => {
    // --ex-faint measured 2.75-3.09:1 on the surfaces the crumb sits on.
    expect(block('.st-crumb {')).not.toMatch(/var\(--ex-faint\)/);
  });
});
