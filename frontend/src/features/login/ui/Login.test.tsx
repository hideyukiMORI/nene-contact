import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { Login } from '@/features/login';

const LOGIN_URL = 'http://localhost/admin/auth/login';

describe('Login', () => {
  it('signs in and reports the session on success', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({
          token: 'jwt-xyz',
          role: 'admin',
          email: 'admin@example.com',
          org_id: 7,
        }),
      ),
    );
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Login onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText('メールアドレス'), 'admin@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'jwt-xyz', role: 'admin', orgId: 7 }),
      );
    });
  });

  it('shows an invalid-credentials error on 401', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json(
          { type: 'invalid-credentials', title: 'Unauthorized', status: 401, detail: 'nope' },
          { status: 401 },
        ),
      ),
    );
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Login onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText('メールアドレス'), 'admin@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('正しくありません');
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('validates required fields without calling the API', async () => {
    const onAuthenticated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Login onAuthenticated={onAuthenticated} />);

    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(await screen.findByText('メールアドレスを入力してください。')).toBeInTheDocument();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
