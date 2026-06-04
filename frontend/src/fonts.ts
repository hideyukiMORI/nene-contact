/**
 * Admin console fonts (@fontsource, self-hosted). Imported only from main.tsx — never the
 * public embed widget. Scope is ja/en only (ADR 0011):
 *
 *   Latin / UI : Inter
 *   Japanese   : Noto Sans JP
 *   Mono       : JetBrains Mono (ids / keys / metadata)
 *
 * Weights: 400 / 500 / 600.
 */

/* ── Inter (body / labels / UI) ──────────────────────────────────────────── */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';

/* ── JetBrains Mono (ids / slugs / metadata) ─────────────────────────────── */
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

/* ── Noto Sans JP ────────────────────────────────────────────────────────── */
import '@fontsource/noto-sans-jp/japanese-400.css';
import '@fontsource/noto-sans-jp/japanese-500.css';
import '@fontsource/noto-sans-jp/japanese-600.css';
