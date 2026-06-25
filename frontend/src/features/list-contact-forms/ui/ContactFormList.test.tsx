import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ContactFormList } from '@/features/list-contact-forms';

const URL = 'http://localhost/admin/contact-forms';

function LocationProbe(): ReactNode {
  return <div data-testid="loc">{useLocation().pathname}</div>;
}

function withOneForm(): void {
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
}

describe('ContactFormList', () => {
  it('renders a row per form on success', async () => {
    withOneForm();

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

  it('opens the form detail when the row (not just the name) is clicked', async () => {
    withOneForm();
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter initialEntries={['/contact-forms']}>
        <Routes>
          <Route path="/contact-forms" element={<ContactFormList />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    );

    // Click the status badge — a non-action part of the row, away from the name link.
    await user.click(await screen.findByText('公開中'));

    expect(screen.getByTestId('loc')).toHaveTextContent('/contact-forms/1');
  });

  it('keeps per-form action links navigating to their own target, not the detail', async () => {
    withOneForm();
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter initialEntries={['/contact-forms']}>
        <Routes>
          <Route path="/contact-forms" element={<ContactFormList />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('link', { name: '編集' }));

    expect(screen.getByTestId('loc')).toHaveTextContent('/contact-forms/1/edit');
  });

  it('duplicates a form into a new draft with a copy-suffixed name and no key (#317)', async () => {
    withOneForm();
    const created: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      // The clone fetches the full form, then POSTs a create.
      http.get(`${URL}/1`, () =>
        HttpResponse.json({
          id: 1,
          name: 'Contact us',
          public_form_key: 'key-1',
          default_locale: 'ja',
          locales: ['ja'],
          status: 'active',
          fields: [],
        }),
      ),
      http.post(URL, async ({ request }) => {
        created.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 2,
            name: created.body.name,
            public_form_key: 'key-2',
            default_locale: 'ja',
            locales: ['ja'],
            status: 'draft',
            fields: [],
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <ContactFormList />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: '複製' }));

    await waitFor(() => {
      expect(created.body).not.toBeNull();
    });
    expect(created.body?.name).toBe('Contact us のコピー');
    // The clone never reuses the source public key — the server mints a new one.
    expect(created.body).not.toHaveProperty('public_form_key');
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
