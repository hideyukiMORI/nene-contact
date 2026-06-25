// The host the operator install snippet + public form URL point at — embed.js and /public/* are
// served there. Configurable for split-host deploys (the console on a different origin than the
// public form host, e.g. embed.js on a CDN); falls back to the console's own origin, which is
// correct for the common single-host deployment. (#327 req B)
export function resolvePublicBase(configured: string, origin: string): string {
  const trimmed = configured.trim().replace(/\/+$/, '');
  return trimmed === '' ? origin : trimmed;
}
