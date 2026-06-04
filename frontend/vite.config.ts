/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Operator console SPA build → public_html/console/ (served under /console/). The admin API
// owns /admin/*, so the SPA uses a separate prefix to avoid shadowing it (#114). Source stays
// in frontend/src.
export default defineConfig({
  base: '/console/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: '../public_html/console',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/admin/auth': 'http://127.0.0.1:8900',
      '/admin/organizations': 'http://127.0.0.1:8900',
      '/admin/contact-forms': 'http://127.0.0.1:8900',
      '/admin/submissions': 'http://127.0.0.1:8900',
      '/admin/notification-channels': 'http://127.0.0.1:8900',
      '/admin/users': 'http://127.0.0.1:8900',
      '/public': 'http://127.0.0.1:8900',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    // Tests run under jsdom/undici which requires absolute URLs; give the client a base.
    env: {
      VITE_NENE_CONTACT_API_BASE_URL: 'http://localhost',
    },
  },
});
