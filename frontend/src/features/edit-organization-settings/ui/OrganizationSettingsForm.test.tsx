import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { OrganizationSettingsForm } from '@/features/edit-organization-settings';

const URL = 'http://localhost/admin/settings/organization';

describe('OrganizationSettingsForm', () => {
  it('loads the current settings and saves display name + signature', async () => {
    const patched: { body: unknown } = { body: null };
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          id: 1,
          name: 'AYANE',
          sender_display_name: null,
          email_signature: null,
        }),
      ),
      http.patch(URL, async ({ request }) => {
        patched.body = await request.json();
        return HttpResponse.json({
          id: 1,
          name: 'AYANE',
          sender_display_name: 'AYANE Support',
          email_signature: 'AYANE',
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrganizationSettingsForm />);

    await user.type(await screen.findByLabelText('メール送信元の表示名'), 'AYANE Support');
    await user.type(screen.getByLabelText('メールの署名'), 'AYANE');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(patched.body).toEqual({
        sender_display_name: 'AYANE Support',
        email_signature: 'AYANE',
      });
    });
    expect(await screen.findByText('保存しました。')).toBeInTheDocument();
  });

  it('sends null for both fields when cleared', async () => {
    const patched: { body: unknown } = { body: null };
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          id: 1,
          name: 'AYANE',
          sender_display_name: 'Old',
          email_signature: 'Sig',
        }),
      ),
      http.patch(URL, async ({ request }) => {
        patched.body = await request.json();
        return HttpResponse.json({
          id: 1,
          name: 'AYANE',
          sender_display_name: null,
          email_signature: null,
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrganizationSettingsForm />);

    const input = await screen.findByLabelText('メール送信元の表示名');
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('Old');
    });
    await user.clear(input);
    await user.clear(screen.getByLabelText('メールの署名'));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(patched.body).toEqual({ sender_display_name: null, email_signature: null });
    });
  });
});
