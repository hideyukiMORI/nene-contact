import { http, HttpResponse } from 'msw';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

    expect(await screen.findByText('ダッシュボード')).toBeInTheDocument();
    // recent submissions resolve the form name from the contact-forms list
    expect(await screen.findAllByText('Contact us')).not.toHaveLength(0);
    // unknown form id falls back to a labelled placeholder
    expect(screen.getByText('フォーム #99')).toBeInTheDocument();
    // stat labels are present
    expect(screen.getByText('公開中のフォーム')).toBeInTheDocument();
    expect(screen.getByText('未対応の送信')).toBeInTheDocument();
    // the 7-day trend card shows the API total
    expect(screen.getByText('受信の推移（7日）')).toBeInTheDocument();
  });

  it('renders the 7-day trend from real per-day counts, emphasizing today', async () => {
    // Fake only Date so the 7-day window is deterministic; MSW/react-query keep real timers.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 22, 10, 0, 0)); // 2026-07-22

    server.use(
      http.get(FORMS_URL, () => HttpResponse.json({ items: [], total: 0 })),
      http.get(SUBMISSIONS_URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              contact_form_id: 3,
              status: 'open',
              field_values: {},
              submitted_at: '2026-07-22 09:00:00',
            },
            {
              id: 2,
              contact_form_id: 3,
              status: 'open',
              field_values: {},
              submitted_at: '2026-07-22 18:00:00',
            },
            {
              id: 3,
              contact_form_id: 3,
              status: 'open',
              field_values: {},
              submitted_at: '2026-07-20 12:00:00',
            },
          ],
          total: 3,
          limit: 100,
          offset: 0,
        }),
      ),
    );

    renderDashboard();

    // Today's bar carries the real count; an empty day is 0; an earlier day its own count.
    expect(await screen.findByTitle('2026-07-22：2件受信')).toBeInTheDocument();
    expect(screen.getByTitle('2026-07-21：0件受信')).toBeInTheDocument();
    expect(screen.getByTitle('2026-07-20：1件受信')).toBeInTheDocument();

    // The card headline is the 7-day sum (2 + 1), not the all-time total.
    const trendCard = document.querySelector('.ex-sparkcard');
    expect(trendCard).not.toBeNull();
    expect(within(trendCard as HTMLElement).getByText('3')).toBeInTheDocument();
  });

  it('renders the empty state when there are no submissions', async () => {
    server.use(
      http.get(FORMS_URL, () => HttpResponse.json({ items: [], total: 0 })),
      http.get(SUBMISSIONS_URL, () =>
        HttpResponse.json({ items: [], total: 0, limit: 100, offset: 0 }),
      ),
    );

    renderDashboard();

    // the recent card shows its empty state when there are no submissions
    expect(await screen.findByText('最近の受信はありません')).toBeInTheDocument();
  });
});
