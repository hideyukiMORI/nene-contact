import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/ui/theme/themes/base.css';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';

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
