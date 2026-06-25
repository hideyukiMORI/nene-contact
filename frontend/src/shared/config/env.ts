import { z } from 'zod';

// Only public VITE_* config reaches the browser; validated once here (frontend-standards §F).
const envSchema = z.object({
  apiBaseUrl: z.string(),
  publicBaseUrl: z.string(),
});

export const env = envSchema.parse({
  apiBaseUrl: import.meta.env.VITE_NENE_CONTACT_API_BASE_URL ?? '',
  publicBaseUrl: import.meta.env.VITE_NENE_CONTACT_PUBLIC_BASE_URL ?? '',
});
