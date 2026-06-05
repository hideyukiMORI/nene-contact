import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/fonts';
import '@/shared/ui/theme/index.css';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { applyTheme, readInitialTheme } from '@/shared/theme';

// Set the saved theme before first paint so there is no light→dark flash.
applyTheme(readInitialTheme());

const root = document.getElementById('root');
if (root === null) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>,
);
