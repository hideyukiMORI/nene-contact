import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Operator console SPA build → public_html/console/ (served under /console/). The admin API
// owns /admin/*, so the SPA uses a separate prefix to avoid shadowing it (#114). Source stays
// in frontend/src.
export default defineConfig(({ mode }) => {
  // Read NENE_CONTACT_PORT from the project-root .env (one level up from frontend/) so the dev
  // proxy stays in sync with the configured app port without duplicating it.
  const projectEnv = loadEnv(mode, path.resolve(dirname, '..'), '');
  const appPort = projectEnv['NENE_CONTACT_PORT'] ?? '8900';
  const target = `http://127.0.0.1:${appPort}`;
  const frontendPort = parseInt(projectEnv['NENE_CONTACT_FRONTEND_PORT'] ?? '5173', 10);

  return {
    base: '/console/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
        '@tests': path.resolve(dirname, './tests'),
      },
    },
    build: {
      outDir: '../public_html/console',
      emptyOutDir: true,
    },
    server: {
      port: frontendPort,
      proxy: {
        '/admin/auth': target,
        '/admin/media': target,
        '/admin/account': target,
        '/admin/organizations': target,
        '/admin/contact-forms': target,
        '/admin/submissions': target,
        '/admin/notification-channels': target,
        '/admin/users': target,
        '/admin/audit-events': target,
        '/admin/records': target,
        '/api': target,
        '/public': target,
        '/health': target,
      },
    },
  };
});
