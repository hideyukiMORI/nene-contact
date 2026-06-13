import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ChangePassword } from '@/features/change-password';

const URL = 'http://localhost/admin/account/password';

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: { current: string; next: string; confirm: string },
): Promise<void> {
  await user.type(screen.getByLabelText('現在のパスワード'), values.current);
  await user.type(screen.getByLabelText('新しいパスワード'), values.next);
  await user.type(screen.getByLabelText('新しいパスワード（確認）'), values.confirm);
}

describe('ChangePassword', () => {
  it('changes the password and shows a success note', async () => {
    server.use(http.post(URL, () => new HttpResponse(null, { status: 204 })));
    const user = userEvent.setup();

    renderWithProviders(<ChangePassword />);
    await fill(user, {
      current: 'old-password',
      next: 'new-password-1',
      confirm: 'new-password-1',
    });
    await user.click(screen.getByRole('button', { name: 'パスワードを変更' }));

    expect(await screen.findByText('パスワードを変更しました。')).toBeInTheDocument();
  });

  it('surfaces an incorrect current password inline (422)', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          {
            type: 'validation-error',
            title: 'Unprocessable Entity',
            status: 422,
            errors: [{ field: 'current_password', message: 'incorrect', code: 'invalid' }],
          },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<ChangePassword />);
    await fill(user, {
      current: 'wrong-password',
      next: 'new-password-1',
      confirm: 'new-password-1',
    });
    await user.click(screen.getByRole('button', { name: 'パスワードを変更' }));

    expect(await screen.findByText('現在のパスワードが正しくありません。')).toBeInTheDocument();
  });

  it('validates the confirmation match on the client without calling the API', async () => {
    let called = false;
    server.use(
      http.post(URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ChangePassword />);
    await fill(user, { current: 'old-password', next: 'new-password-1', confirm: 'different-1' });
    await user.click(screen.getByRole('button', { name: 'パスワードを変更' }));

    expect(await screen.findByText('新しいパスワードが一致しません。')).toBeInTheDocument();
    expect(called).toBe(false);
  });
});
