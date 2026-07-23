import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { SubmissionList } from '@/features/list-submissions';

const URL = 'http://localhost/admin/submissions';
const FORMS_URL = 'http://localhost/admin/contact-forms';
const TAGS_URL = 'http://localhost/admin/tags';

// The list also queries the org's tag vocabulary; stub it so it never hits an unmatched
// handler (whose failure can perturb query timing during a page transition).
function mockTags(): void {
  server.use(http.get(TAGS_URL, () => HttpResponse.json({ items: [] })));
}

function mockForms(): void {
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
        ],
        total: 1,
      }),
    ),
  );
}

function renderList(): void {
  renderWithProviders(
    <MemoryRouter initialEntries={['/submissions']}>
      <SubmissionList selectedId={null} />
    </MemoryRouter>,
  );
}

function submissionItem(id: number): Record<string, unknown> {
  return {
    id,
    contact_form_id: 3,
    status: 'open',
    field_values: { name: `Sender ${String(id)}` },
    submitted_at: '2026-06-04 00:00:00',
  };
}

// Serves a list of `total` submissions honoring limit/offset, like the real API.
function mockSubmissions(total: number): void {
  server.use(
    http.get(URL, ({ request }) => {
      // NB: the module-scoped URL constant shadows the global URL constructor here.
      const search = new URLSearchParams(request.url.split('?')[1] ?? '');
      const limit = Number(search.get('limit') ?? '20');
      const offset = Number(search.get('offset') ?? '0');
      const count = Math.max(0, Math.min(limit, total - offset));
      return HttpResponse.json({
        items: Array.from({ length: count }, (_, i) => submissionItem(offset + i + 1)),
        total,
        limit,
        offset,
        status_counts: { open: total },
      });
    }),
  );
}

describe('SubmissionList', () => {
  it('renders submission rows on success', async () => {
    mockForms();
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 9,
              contact_form_id: 3,
              status: 'open',
              field_values: { name: 'Yamada' },
              submitted_at: '2026-06-04 00:00:00',
            },
          ],
          total: 1,
          limit: 100,
          offset: 0,
          status_counts: { open: 1 },
        }),
      ),
    );

    renderList();

    // row sender (masked value as returned) and form name (resolved) render
    expect(await screen.findByText('Yamada')).toBeInTheDocument();
    expect(screen.getByText('Contact us')).toBeInTheDocument();
    // compact received time
    expect(screen.getByText('06-04 00:00')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    mockForms();
    server.use(
      http.get(URL, () => HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })),
    );

    renderList();

    expect(await screen.findByText('まだ送信はありません')).toBeInTheDocument();
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

  // Canonical Pagination (prev/next + range) shows for any non-empty list — including a
  // single page — and only vanishes when the list is empty (total === 0). Next is enabled
  // only while more pages remain.
  it('shows the pager with next enabled when more than one page (21 items)', async () => {
    mockForms();
    mockSubmissions(21);

    renderList();

    expect(await screen.findByText('Sender 1')).toBeInTheDocument();
    expect(screen.getByText('1〜20件を表示（全21件）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '次へ' })).not.toBeDisabled();
    // No numbered page buttons or page-jump input in the canonical control.
    expect(screen.queryByRole('spinbutton', { name: 'ページ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });

  it('shows the pager with both controls disabled at exactly one page (20 items)', async () => {
    mockForms();
    mockSubmissions(20);

    renderList();

    expect(await screen.findByText('Sender 1')).toBeInTheDocument();
    expect(screen.getByText('1〜20件を表示（全20件）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();
  });

  it('advances to the next page and updates the range when next is clicked', async () => {
    mockForms();
    mockTags();
    mockSubmissions(21);

    renderList();

    const user = userEvent.setup();
    expect(await screen.findByText('Sender 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '次へ' }));

    // keepPreviousData holds page 1 on screen until page 2 resolves, so wait on the positive
    // signal — the 21st row (offset 20) — with a generous timeout for slow CI. By the time it
    // renders, page 1 has been replaced in the same commit, so the negatives are synchronous.
    expect(await screen.findByText('Sender 21', undefined, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText('Sender 1')).not.toBeInTheDocument();
    expect(screen.getByText('21〜21件を表示（全21件）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();
  });
});
