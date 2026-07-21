import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ManageChannels } from '@/features/manage-channels';

const LIST = 'http://localhost/admin/notification-channels';
const ITEM = (id: number): string => `${LIST}/${String(id)}`;

interface ChannelRow {
  id: number;
  contact_form_id: number;
  channel_type: string;
  is_enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

function seedChatwork(): ChannelRow {
  return {
    id: 5,
    contact_form_id: 3,
    channel_type: 'chatwork',
    is_enabled: true,
    created_at: '2026-07-21 00:00:00',
    updated_at: '2026-07-21 00:00:00',
  };
}

describe('ManageChannels', () => {
  it('lists channels and adds one (config write-only)', async () => {
    interface PostedChannel {
      channel_type: string;
      config: Record<string, string>;
    }
    const captured: { value: PostedChannel | null } = { value: null };
    const channels: ChannelRow[] = [];
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: channels })),
      http.post(LIST, async ({ request }) => {
        captured.value = (await request.json()) as PostedChannel;
        const created: ChannelRow = {
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

    const emptyText = 'まだありません。下から1つ追加しましょう（まずはメールがおすすめ）。';
    expect(await screen.findByText(emptyText)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Webhook' }));
    await user.type(screen.getByLabelText('URL'), 'https://hooks.example/x');
    await user.type(screen.getByLabelText('署名シークレット'), 'whsec');
    await user.click(screen.getByRole('button', { name: 'この通知先を追加' }));

    await waitFor(() => {
      expect(captured.value?.channel_type).toBe('webhook');
    });
    expect(captured.value?.config).toEqual({ url: 'https://hooks.example/x', secret: 'whsec' });
    await waitFor(() => {
      expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
    });
  });

  it('blocks a bad chatwork room_id client-side (no POST)', async () => {
    const posted = { count: 0 };
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: [] })),
      http.post(LIST, () => {
        posted.count += 1;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ManageChannels contactFormId={3} />);

    await user.click(screen.getByRole('button', { name: 'Chatwork' }));
    await user.type(screen.getByLabelText('API トークン'), 'tok');
    await user.type(screen.getByLabelText('ルームID'), 'ridABC');
    await user.click(screen.getByRole('button', { name: 'この通知先を追加' }));

    expect(
      await screen.findByText('ルームID は数字のみで入力してください（「rid」は不要）。'),
    ).toBeInTheDocument();
    expect(posted.count).toBe(0);
  });

  it('edits a channel: PATCH carries only the changed field + enabled (secret kept)', async () => {
    const patched: { body: unknown } = { body: null };
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: [seedChatwork()] })),
      http.patch(ITEM(5), async ({ request }) => {
        patched.body = await request.json();
        return HttpResponse.json({ ...seedChatwork(), is_enabled: true });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ManageChannels contactFormId={3} />);

    await user.click(await screen.findByRole('button', { name: '編集' }));
    // Change only the room_id; leave the API token blank (keep the stored secret).
    await user.type(screen.getByLabelText('ルームID'), '78725877');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(patched.body).toEqual({ config: { room_id: '78725877' }, is_enabled: true });
    });
  });

  it('deletes a channel after confirmation', async () => {
    const deleted = { count: 0 };
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: [seedChatwork()] })),
      http.delete(ITEM(5), () => {
        deleted.count += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ManageChannels contactFormId={3} />);

    await user.click(await screen.findByRole('button', { name: '削除' }));
    // A confirm step appears; only the explicit confirm fires the DELETE.
    await user.click(screen.getByRole('button', { name: '削除する' }));

    await waitFor(() => {
      expect(deleted.count).toBe(1);
    });
  });

  it('surfaces a failed test send', async () => {
    server.use(
      http.get(LIST, () => HttpResponse.json({ items: [seedChatwork()] })),
      http.post(`${ITEM(5)}/test`, () =>
        HttpResponse.json({ ok: false, error: 'Chatwork dispatch failed with status 401.' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ManageChannels contactFormId={3} />);

    await user.click(await screen.findByRole('button', { name: 'テスト送信' }));

    expect(await screen.findByText(/テスト送信に失敗しました/)).toBeInTheDocument();
    expect(screen.getByText(/status 401/)).toBeInTheDocument();
  });
});
