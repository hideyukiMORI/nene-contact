// Builds the operator install snippet for the 連携・公開 tab. When the production build output
// (`public_html/embed/manifest.json`, see `npm run build:embed` / #330) is reachable, the snippet
// uses the content-hashed filename + Subresource Integrity for immutable caching (ADR 0010 §7);
// otherwise it falls back to the plain `/embed.js` (dev, or before a build). #334.

export interface EmbedManifest {
  /** Path relative to the public base, e.g. `embed/embed.<hash>.js`. */
  file: string;
  /** Subresource Integrity hash, e.g. `sha384-…`. */
  integrity: string;
}

/** Fetch + validate the embed manifest; resolves to null on 404/parse/network error. */
export async function fetchEmbedManifest(base: string): Promise<EmbedManifest | null> {
  try {
    const res = await fetch(`${base}/embed/manifest.json`, { credentials: 'omit' });
    if (!res.ok) {
      return null;
    }
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) {
      return null;
    }
    const rec = data as Record<string, unknown>;
    if (typeof rec.file !== 'string' || typeof rec.integrity !== 'string') {
      return null;
    }
    return { file: rec.file, integrity: rec.integrity };
  } catch {
    return null;
  }
}

/** The `<script>` install snippet — hashed + SRI when a manifest is given, else plain /embed.js. */
export function buildEmbedSnippet(
  base: string,
  key: string,
  mode: string,
  manifest: EmbedManifest | null,
): string {
  if (manifest !== null) {
    return (
      `<script src="${base}/${manifest.file}" data-form="${key}"\n` +
      `        data-trigger="${mode}" integrity="${manifest.integrity}"\n` +
      `        crossorigin="anonymous" async></script>`
    );
  }
  return (
    `<script src="${base}/embed.js" data-form="${key}"\n` +
    `        data-trigger="${mode}" async></script>`
  );
}
