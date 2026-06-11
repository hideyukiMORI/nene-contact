import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { SubmissionDetail } from '@/features/view-submission';

function renderDetail(): void {
  renderWithProviders(
    <MemoryRouter>
      <SubmissionDetail submissionId={9} />
    </MemoryRouter>,
  );
}

const DETAIL = 'http://localhost/admin/submissions/9';
const NOTES = 'http://localhost/admin/submissions/9/notes';
const ATTACH = 'http://localhost/admin/submissions/9/attachments';
const TECH = 'http://localhost/admin/submissions/9/technical-meta';
const FORM = 'http://localhost/admin/contact-forms/3';

function detailBody(status = 'open') {
  return {
    id: 9,
    contact_form_id: 3,
    status,
    source: 'form',
    source_url: 'https://shop.example.com/contact',
    locale: 'ja',
    field_values: { email: 'visitor@example.com' },
    submitted_at: '2026-06-04 00:00:00',
  };
}

function formBody() {
  return {
    id: 3,
    name: 'お問い合わせフォーム',
    public_form_key: 'k',
    default_locale: 'ja',
    locales: ['ja'],
    status: 'active',
    consent_required: false,
    allowed_origins: [],
    consent_label: null,
    retention_days: null,
    fields: [
      { field_type: 'email', name: 'email', label: { ja: 'メールアドレス' }, required: true },
    ],
  };
}

// Default supporting reads so the detail can resolve form labels + attachments.
function baseHandlers() {
  return [
    http.get(DETAIL, () => HttpResponse.json(detailBody())),
    http.get(NOTES, () => HttpResponse.json({ items: [] })),
    http.get(FORM, () => HttpResponse.json(formBody())),
    http.get(ATTACH, () => HttpResponse.json({ items: [] })),
  ];
}

describe('SubmissionDetail', () => {
  it('renders the field value with its form label and the current status', async () => {
    server.use(...baseHandlers());

    renderDetail();

    expect(await screen.findByText('メールアドレス')).toBeInTheDocument();
    // The value renders in the field-driven content (also used as the fallback display name).
    expect(screen.getAllByText('visitor@example.com').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('状態')).toHaveValue('open');
  });

  it('shows reception meta (form name, language, received at) in the rail', async () => {
    server.use(...baseHandlers());

    renderDetail();

    // Wait for the form to resolve (its name fills the rail + header sub).
    expect((await screen.findAllByText('お問い合わせフォーム')).length).toBeGreaterThan(0);
    expect(screen.getByText('日本語 (ja)')).toBeInTheDocument();
    expect(screen.getByText('2026-06-04 00:00:00')).toBeInTheDocument();
  });

  it('discloses IP / User-Agent only when the technical section is opened (audited)', async () => {
    let techCalls = 0;
    server.use(
      ...baseHandlers(),
      http.get(TECH, () => {
        techCalls += 1;
        return HttpResponse.json({ id: 9, ip: '203.0.113.9', user_agent: 'curl/8' });
      }),
    );
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('メールアドレス');

    // Not fetched until the operator opens the collapsible technical section.
    expect(techCalls).toBe(0);
    expect(screen.queryByText('203.0.113.9')).not.toBeInTheDocument();

    await user.click(screen.getByText('技術情報（不正調査用）'));

    expect(await screen.findByText('203.0.113.9')).toBeInTheDocument();
    expect(screen.getByText('curl/8')).toBeInTheDocument();
    expect(techCalls).toBe(1);
    // The referer (source_url) lives in the technical section too.
    expect(screen.getByText('https://shop.example.com/contact')).toBeInTheDocument();
  });

  it('updates status via PATCH', async () => {
    let patched: string | null = null;
    server.use(
      ...baseHandlers(),
      http.patch(DETAIL, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patched = body.status;
        return HttpResponse.json(detailBody(body.status));
      }),
    );
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('メールアドレス');

    await user.selectOptions(screen.getByLabelText('状態'), 'resolved');

    await waitFor(() => {
      expect(patched).toBe('resolved');
    });
  });

  it('adds a note', async () => {
    const notes: { id: number; submission_id: number; body: string; created_at: string }[] = [];
    server.use(
      http.get(DETAIL, () => HttpResponse.json(detailBody())),
      http.get(FORM, () => HttpResponse.json(formBody())),
      http.get(ATTACH, () => HttpResponse.json({ items: [] })),
      http.get(NOTES, () => HttpResponse.json({ items: notes })),
      http.post(NOTES, async ({ request }) => {
        const body = (await request.json()) as { body: string };
        const note = {
          id: 1,
          submission_id: 9,
          body: body.body,
          created_at: '2026-06-04 01:00:00',
        };
        notes.push(note);
        return HttpResponse.json(note, { status: 201 });
      }),
    );
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('メールアドレス');

    await user.type(screen.getByLabelText('メモを追加'), 'called the customer');
    await user.click(screen.getByRole('button', { name: 'メモを追加' }));

    expect(await screen.findByText('called the customer')).toBeInTheDocument();
  });
});
