/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NENE_CONTACT_API_BASE_URL?: string;
  // Public host that embed.js + /public/* are served from — used to build the operator install
  // snippet/public URL. Unset → the console's own origin (correct for single-host deploys).
  readonly VITE_NENE_CONTACT_PUBLIC_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
