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
      fields?: { field_type: string; name: string; label: Record<string, string> }[];
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

    // The form name is editable both on the canvas title and in the settings card (synced).
    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'Sales');
    // Adding from the palette appends the field, auto-selects it, and seeds a default label.
    await user.click(screen.getByRole('button', { name: 'メール' }));
    const labelInput = screen.getByLabelText('ラベル');
    await user.clear(labelInput);
    await user.type(labelInput, 'メール');
    await user.click(screen.getByRole('button', { name: '保存して公開' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce();
    });
    expect(captured.value?.name).toBe('Sales');
    // The field key is auto-generated (the spec hides it); the type + label are what matter.
    expect(captured.value?.fields).toHaveLength(1);
    expect(captured.value?.fields?.[0]).toEqual(
      expect.objectContaining({ field_type: 'email', label: { ja: 'メール' } }),
    );
    expect(captured.value?.fields?.[0]?.name).toMatch(/^field_/);
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
