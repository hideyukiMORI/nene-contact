import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { SubmissionList } from '@/features/list-submissions';

const URL = 'http://localhost/admin/submissions';

function renderList(): void {
  renderWithProviders(
    <MemoryRouter initialEntries={['/submissions']}>
      <SubmissionList />
    </MemoryRouter>,
  );
}

describe('SubmissionList', () => {
  it('renders submissions and the page indicator on success', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 9,
              contact_form_id: 3,
              status: 'open',
              field_values: {},
              submitted_at: '2026-06-04 00:00:00',
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        }),
      ),
    );

    renderList();

    expect(await screen.findByText('2026-06-04 00:00:00')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })),
    );

    renderList();

    expect(await screen.findByText('受信データがまだありません。')).toBeInTheDocument();
  });

  it('renders an error with retry', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json(
          { type: 'e', title: 'Error', status: 500, detail: 'boom' },
          { status: 500 },
        ),
      ),
    );

    renderList();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
  });
});
