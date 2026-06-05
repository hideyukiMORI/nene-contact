import { http, HttpResponse } from 'msw';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../../tests/render/renderWithProviders';
import { server } from '../../../tests/msw/server';
import type { Session } from '@/entities/auth';
import { HomePage } from '@/pages/home';

const FORMS_URL = 'http://localhost/admin/contact-forms';
const SUBMISSIONS_URL = 'http://localhost/admin/submissions';

const session: Session = {
  token: 't',
  email: 'misaki@example.com',
  role: 'admin',
  orgId: 1,
};

function LayoutWithSession(): ReactNode {
  return <Outlet context={{ session }} />;
}

function renderDashboard(): void {
  renderWithProviders(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<LayoutWithSession />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders data-backed stats and recent submissions', async () => {
    server.use(
      http.get(FORMS_URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 3,
              name: 'Contact us',
              public_form_key: 'k3',
              default_locale: 'ja',
              locales: ['ja'],
              status: 'active',
              fields: [],
            },
            {
              id: 4,
              name: 'Old form',
              public_form_key: 'k4',
              default_locale: 'ja',
              locales: ['ja'],
              status: 'disabled',
              fields: [],
            },
          ],
          total: 2,
        }),
      ),
      http.get(SUBMISSIONS_URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 9,
              contact_form_id: 3,
              status: 'open',
              field_values: {},
              submitted_at: '2026-06-04 09:00:00',
            },
            {
              id: 8,
              contact_form_id: 3,
              status: 'resolved',
              field_values: {},
              submitted_at: '2026-06-03 09:00:00',
            },
            {
              id: 7,
              contact_form_id: 99,
              status: 'open',
              field_values: {},
              submitted_at: '2026-06-02 09:00:00',
            },
          ],
          total: 3,
          limit: 100,
          offset: 0,
        }),
      ),
    );

    renderDashboard();

    expect(await screen.findByText('今日のやること')).toBeInTheDocument();
    // recent submissions resolve the form name from the contact-forms list
    expect(await screen.findAllByText('Contact us')).not.toHaveLength(0);
    // unknown form id falls back to a labelled placeholder
    expect(screen.getByText('フォーム #99')).toBeInTheDocument();
    // stat labels are present
    expect(screen.getByText('公開中のフォーム')).toBeInTheDocument();
    expect(screen.getByText('総受信')).toBeInTheDocument();
  });

  it('renders the empty state when there are no submissions', async () => {
    server.use(
      http.get(FORMS_URL, () => HttpResponse.json({ items: [], total: 0 })),
      http.get(SUBMISSIONS_URL, () =>
        HttpResponse.json({ items: [], total: 0, limit: 100, offset: 0 }),
      ),
    );

    renderDashboard();

    // needs-attention shows the all-caught-up empty state
    expect(await screen.findByText('対応待ちはありません')).toBeInTheDocument();
    // and the forms card shows its own empty state
    expect(screen.getByText('フォームがありません')).toBeInTheDocument();
  });
});
