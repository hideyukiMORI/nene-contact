import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { SubmissionTagEditor } from '@/features/assign-submission-tags';

const TAGS = 'http://localhost/admin/tags';
const APPLY = 'http://localhost/admin/submissions/9/tags';

describe('SubmissionTagEditor', () => {
  it('shows applied tags and applies another from the add menu', async () => {
    const captured: { tagId: number | null } = { tagId: null };
    server.use(
      http.get(TAGS, () =>
        HttpResponse.json({
          items: [
            { id: 1, label: '見積依頼', color: 'amber', sort_order: 0 },
            { id: 2, label: 'クレーム', color: 'rose', sort_order: 1 },
          ],
        }),
      ),
      http.post(APPLY, async ({ request }) => {
        captured.tagId = ((await request.json()) as { tag_id: number }).tag_id;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <SubmissionTagEditor
        submissionId={9}
        tags={[{ id: 1, label: '見積依頼', color: 'amber' }]}
      />,
    );

    // The applied tag renders with a remove control.
    expect(screen.getByText('見積依頼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '見積依頼 を外す' })).toBeInTheDocument();

    // Open the add menu — the not-yet-applied tag is offered — and apply it.
    await user.click(screen.getByRole('button', { name: 'タグを付ける' }));
    await user.click(await screen.findByText('クレーム'));

    await waitFor(() => {
      expect(captured.tagId).toBe(2);
    });
  });

  it('removes an applied tag', async () => {
    const removed: { id: number | null } = { id: null };
    server.use(
      http.get(TAGS, () => HttpResponse.json({ items: [] })),
      http.delete('http://localhost/admin/submissions/9/tags/1', () => {
        removed.id = 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <SubmissionTagEditor
        submissionId={9}
        tags={[{ id: 1, label: '見積依頼', color: 'amber' }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: '見積依頼 を外す' }));
    await waitFor(() => {
      expect(removed.id).toBe(1);
    });
  });
});
