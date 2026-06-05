/**
 * Admin console fonts (@fontsource, self-hosted). Imported only from main.tsx — never the
 * public embed widget. Scope is ja/en only (ADR 0011):
 *
 *   UI       : Plus Jakarta Sans (design system)
 *   Serif    : Spectral + Noto Serif JP (display headings — Design System v2)
 *   Japanese : Noto Sans JP
 *   Mono     : JetBrains Mono (ids / keys / metadata)
 */

/* ── Plus Jakarta Sans (UI) ──────────────────────────────────────────────── */
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';

/* ── Spectral + Noto Serif JP (display headings — h1/h2 render at 600) ────── */
import '@fontsource/spectral/latin-600.css';
import '@fontsource/noto-serif-jp/japanese-600.css';

/* ── JetBrains Mono (ids / slugs / metadata) ─────────────────────────────── */
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

/* ── Noto Sans JP ────────────────────────────────────────────────────────── */
import '@fontsource/noto-sans-jp/japanese-400.css';
import '@fontsource/noto-sans-jp/japanese-500.css';
import '@fontsource/noto-sans-jp/japanese-600.css';
