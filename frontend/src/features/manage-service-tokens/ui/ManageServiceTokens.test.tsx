import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ManageServiceTokens } from '@/features/manage-service-tokens';

const TOKENS = 'http://localhost/admin/service-tokens';

const activeToken = {
  id: 1,
  subject: 'service:records',
  label: 'records prod',
  scopes: ['ingest:submissions'],
  created_by: 7,
  created_at: '2026-07-18 00:00:00',
  expires_at: '2027-07-18 00:00:00',
  revoked_at: null,
  status: 'active',
};

describe('ManageServiceTokens', () => {
  it('lists tokens and issues one, showing the plaintext once', async () => {
    interface PostedToken {
      label: string;
      scopes: string[];
    }
    const captured: { value: PostedToken | null } = { value: null };
    server.use(
      http.get(TOKENS, () => HttpResponse.json({ items: [activeToken] })),
      http.post(TOKENS, async ({ request }) => {
        captured.value = (await request.json()) as PostedToken;
        return HttpResponse.json(
          { ...activeToken, id: 2, label: captured.value.label, token: 'plain.jwt.value' },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageServiceTokens />);

    expect(await screen.findByText('records prod')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'トークンを発行' }));
    await user.type(screen.getByLabelText('ラベル'), 'records staging');
    // The modal's own issue button (second match) submits.
    const issueButtons = screen.getAllByRole('button', { name: 'トークンを発行' });
    await user.click(issueButtons[issueButtons.length - 1] as HTMLElement);

    await waitFor(() => {
      expect(captured.value?.label).toBe('records staging');
    });
    expect(captured.value?.scopes).toEqual(['ingest:submissions']);
    // Plaintext token is shown exactly once, after issuance.
    expect(await screen.findByText('plain.jwt.value')).toBeInTheDocument();
  });

  it('revokes a token after confirmation', async () => {
    const captured: { revokedId: string | null } = { revokedId: null };
    server.use(
      http.get(TOKENS, () => HttpResponse.json({ items: [activeToken] })),
      http.delete(`${TOKENS}/:id`, ({ params }) => {
        captured.revokedId = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageServiceTokens />);

    await user.click(await screen.findByRole('button', { name: '失効' }));
    // Confirm in the modal (second "失効" button is the confirm action).
    const revokeButtons = screen.getAllByRole('button', { name: '失効' });
    await user.click(revokeButtons[revokeButtons.length - 1] as HTMLElement);

    await waitFor(() => {
      expect(captured.revokedId).toBe('1');
    });
  });
});
