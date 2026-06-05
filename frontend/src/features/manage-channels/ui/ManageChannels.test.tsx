import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ManageChannels } from '@/features/manage-channels';

const LIST = 'http://localhost/admin/notification-channels';

describe('ManageChannels', () => {
  it('lists channels and adds one (config write-only)', async () => {
    interface PostedChannel {
      channel_type: string;
      config: Record<string, string>;
    }
    const captured: { value: PostedChannel | null } = { value: null };
    const channels: {
      id: number;
      contact_form_id: number;
      channel_type: string;
      is_enabled: boolean;
    }[] = [];
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: channels })),
      http.post(LIST, async ({ request }) => {
        captured.value = (await request.json()) as PostedChannel;
        const created = {
          id: 1,
          contact_form_id: 3,
          channel_type: captured.value.channel_type,
          is_enabled: true,
        };
        channels.push(created);
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageChannels contactFormId={3} />);

    // Empty state first.
    const emptyText = 'まだありません。下から1つ追加しましょう（まずはメールがおすすめ）。';
    expect(await screen.findByText(emptyText)).toBeInTheDocument();

    // Type is chosen via the segmented control, not a <select>.
    await user.click(screen.getByRole('button', { name: 'Webhook' }));
    await user.type(screen.getByLabelText('URL'), 'https://hooks.example/x');
    await user.type(screen.getByLabelText('署名シークレット'), 'whsec');
    await user.click(screen.getByRole('button', { name: 'この通知先を追加' }));

    await waitFor(() => {
      expect(captured.value?.channel_type).toBe('webhook');
    });
    expect(captured.value?.config).toEqual({ url: 'https://hooks.example/x', secret: 'whsec' });
    // The list refreshes (invalidation) and the empty state disappears.
    await waitFor(() => {
      expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
    });
  });
});
