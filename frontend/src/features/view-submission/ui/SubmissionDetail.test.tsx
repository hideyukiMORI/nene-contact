import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { SubmissionDetail } from '@/features/view-submission';

const DETAIL = 'http://localhost/admin/submissions/9';
const NOTES = 'http://localhost/admin/submissions/9/notes';

function detailBody(status = 'open') {
  return {
    id: 9,
    contact_form_id: 3,
    status,
    field_values: { email: 'visitor@example.com' },
    submitted_at: '2026-06-04 00:00:00',
  };
}

describe('SubmissionDetail', () => {
  it('renders field values and the current status', async () => {
    server.use(
      http.get(DETAIL, () => HttpResponse.json(detailBody())),
      http.get(NOTES, () => HttpResponse.json({ items: [] })),
    );

    renderWithProviders(<SubmissionDetail submissionId={9} />);

    expect(await screen.findByText('visitor@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('状態')).toHaveValue('open');
  });

  it('updates status via PATCH', async () => {
    let patched: string | null = null;
    server.use(
      http.get(DETAIL, () => HttpResponse.json(detailBody())),
      http.get(NOTES, () => HttpResponse.json({ items: [] })),
      http.patch(DETAIL, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patched = body.status;
        return HttpResponse.json(detailBody(body.status));
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<SubmissionDetail submissionId={9} />);
    await screen.findByText('visitor@example.com');

    await user.selectOptions(screen.getByLabelText('状態'), 'resolved');

    await waitFor(() => {
      expect(patched).toBe('resolved');
    });
  });

  it('adds a note', async () => {
    const notes: { id: number; submission_id: number; body: string; created_at: string }[] = [];
    server.use(
      http.get(DETAIL, () => HttpResponse.json(detailBody())),
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

    renderWithProviders(<SubmissionDetail submissionId={9} />);
    await screen.findByText('visitor@example.com');

    await user.type(screen.getByLabelText('メモを追加'), 'called the customer');
    await user.click(screen.getByRole('button', { name: 'メモを追加' }));

    expect(await screen.findByText('called the customer')).toBeInTheDocument();
  });
});
