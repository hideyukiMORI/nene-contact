import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ContactFormList } from '@/features/list-contact-forms';

const URL = 'http://localhost/admin/contact-forms';

describe('ContactFormList', () => {
  it('renders a row per form on success', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              name: 'Contact us',
              public_form_key: 'key-1',
              default_locale: 'ja',
              locales: ['ja', 'en'],
              status: 'active',
              fields: [],
            },
          ],
          total: 1,
        }),
      ),
    );

    renderWithProviders(
      <MemoryRouter>
        <ContactFormList />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Contact us')).toBeInTheDocument();
    expect(screen.getByText('key-1')).toBeInTheDocument();
    // locales render as individual chips
    expect(screen.getByText('ja')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    // active status renders the localized badge
    expect(screen.getByText('公開中')).toBeInTheDocument();
  });

  it('renders the empty state when there are no forms', async () => {
    server.use(http.get(URL, () => HttpResponse.json({ items: [], total: 0 })));

    renderWithProviders(
      <MemoryRouter>
        <ContactFormList />
      </MemoryRouter>,
    );

    expect(await screen.findByText('まだフォームがありません')).toBeInTheDocument();
  });

  it('renders an error with retry on failure', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json(
          { type: 'internal', title: 'Error', status: 500, detail: 'boom' },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(
      <MemoryRouter>
        <ContactFormList />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
  });
});
