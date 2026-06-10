import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { FormBuilder } from '@/features/build-contact-form';

const URL = 'http://localhost/admin/contact-forms';

describe('FormBuilder', () => {
  it('builds a form and posts it, then signals creation', async () => {
    interface PostedForm {
      name?: string;
      fields?: { field_type: string; name: string }[];
    }
    const captured: { value: PostedForm | null } = { value: null };
    server.use(
      http.post(URL, async ({ request }) => {
        captured.value = (await request.json()) as PostedForm;
        return HttpResponse.json(
          {
            id: 1,
            name: 'Sales',
            public_form_key: 'k',
            default_locale: 'ja',
            locales: ['ja'],
            fields: [],
          },
          { status: 201 },
        );
      }),
    );
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    await user.type(screen.getByLabelText('フォーム名'), 'Sales');
    await user.click(screen.getByRole('button', { name: 'メール' }));
    await user.type(screen.getByLabelText('フィールド名'), 'email');
    await user.type(screen.getByLabelText('ラベル（ja）'), 'メール');
    await user.click(screen.getByRole('button', { name: '保存して公開' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce();
    });
    expect(captured.value?.name).toBe('Sales');
    expect(captured.value?.fields).toEqual([
      expect.objectContaining({ field_type: 'email', name: 'email' }),
    ]);
  });

  it('blocks creation without a name or fields', async () => {
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: '保存して公開' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('フォーム名と1つ以上のフィールド');
    expect(onCreated).not.toHaveBeenCalled();
  });
});
