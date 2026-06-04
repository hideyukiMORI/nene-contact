import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ManageUsers } from '@/features/manage-users';

const USERS = 'http://localhost/admin/users';

describe('ManageUsers', () => {
  it('lists users and creates one', async () => {
    interface PostedUser {
      email: string;
      role: string;
    }
    const captured: { value: PostedUser | null } = { value: null };
    const users = [{ id: 1, email: 'admin@example.com', role: 'admin', status: 'active' }];
    server.use(
      http.get(USERS, () => HttpResponse.json({ items: users })),
      http.post(USERS, async ({ request }) => {
        captured.value = (await request.json()) as PostedUser;
        return HttpResponse.json(
          { id: 2, email: captured.value.email, role: captured.value.role, status: 'active' },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageUsers />);

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();

    await user.type(screen.getByLabelText('メールアドレス'), 'editor@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: 'ユーザーを追加' }));

    await waitFor(() => {
      expect(captured.value?.email).toBe('editor@example.com');
    });
    expect(captured.value?.role).toBe('editor');
  });

  it('updates a user status inline (PATCH)', async () => {
    interface PatchedStatus {
      status?: string;
    }
    const captured: { value: PatchedStatus | null } = { value: null };
    server.use(
      http.get(USERS, () =>
        HttpResponse.json({
          items: [{ id: 2, email: 'op@example.com', role: 'editor', status: 'active' }],
        }),
      ),
      http.patch('http://localhost/admin/users/2', async ({ request }) => {
        captured.value = (await request.json()) as PatchedStatus;
        return HttpResponse.json({
          id: 2,
          email: 'op@example.com',
          role: 'editor',
          status: captured.value.status ?? 'active',
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageUsers />);
    await screen.findByText('op@example.com');

    await user.selectOptions(screen.getByLabelText('状態'), 'disabled');

    await waitFor(() => {
      expect(captured.value?.status).toBe('disabled');
    });
  });
});
