import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { HandoffPanel } from '@/features/view-submission/ui/HandoffPanel';

const HANDOFFS = 'http://localhost/admin/submissions/4/handoffs';

describe('HandoffPanel', () => {
  it('shows a succeeded link with its id and a retry button', async () => {
    server.use(
      http.get(HANDOFFS, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              submission_id: 4,
              target: 'deal',
              handoff_status: 'succeeded',
              deal_opportunity_id: 'OPP-9',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<HandoffPanel submissionId={4} attachments={[]} />);

    expect(await screen.findByText('連携済み')).toBeInTheDocument();
    expect(screen.getByText(/OPP-9/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
  });

  it('shows a failed link with its error (HTTP-200-with-failed)', async () => {
    server.use(
      http.get(HANDOFFS, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              submission_id: 4,
              target: 'deal',
              handoff_status: 'failed',
              last_error: 'Deal is not configured',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<HandoffPanel submissionId={4} attachments={[]} />);

    expect(await screen.findByText('失敗')).toBeInTheDocument();
    expect(screen.getByText('Deal is not configured')).toBeInTheDocument();
  });

  it('posts a deal handoff when the send button is clicked', async () => {
    let posted = false;
    server.use(
      http.get(HANDOFFS, () => HttpResponse.json({ items: [] })),
      http.post(`${HANDOFFS}/deal`, () => {
        posted = true;
        return HttpResponse.json({
          id: 1,
          submission_id: 4,
          target: 'deal',
          handoff_status: 'succeeded',
          deal_opportunity_id: 'OPP-1',
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<HandoffPanel submissionId={4} attachments={[]} />);

    await user.click(await screen.findByRole('button', { name: 'Deal に送る' }));
    await waitFor(() => {
      expect(posted).toBe(true);
    });
  });
});
