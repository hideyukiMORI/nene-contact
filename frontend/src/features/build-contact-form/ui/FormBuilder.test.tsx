import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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

    // The form name is editable on the toolbar and the canvas title (synced).
    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'Sales');
    // The empty form's first field is added from the canvas; it auto-selects and seeds a label.
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
    const labelInput = screen.getByLabelText('ラベル');
    await user.clear(labelInput);
    await user.type(labelInput, 'お名前');
    await user.click(screen.getByRole('button', { name: '公開' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce();
    });
    expect(captured.value?.name).toBe('Sales');
    // The field key is auto-generated (the spec hides it); the type + label are what matter.
    expect(captured.value?.fields).toHaveLength(1);
    expect(captured.value?.fields?.[0]).toEqual(
      expect.objectContaining({ field_type: 'text', label: { ja: 'お名前' } }),
    );
    expect(captured.value?.fields?.[0]?.name).toMatch(/^field_/);
  });

  it('shows an honest unsaved-changes hint after editing, then a saved timestamp after publishing', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          {
            id: 1,
            name: 'Sales',
            public_form_key: 'k',
            default_locale: 'ja',
            locales: ['ja'],
            fields: [],
          },
          { status: 201 },
        ),
      ),
    );
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    // A pristine builder shows no unsaved hint (nothing has changed from the seed).
    expect(screen.queryByText('未保存の変更があります')).toBeNull();

    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'Sales');
    // Editing makes the draft dirty — the toolbar says so honestly.
    expect(screen.getByText('未保存の変更があります')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
    const labelInput = screen.getByLabelText('ラベル');
    await user.clear(labelInput);
    await user.type(labelInput, 'お名前');
    await user.click(screen.getByRole('button', { name: '公開' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce();
    });
    // After a successful save the hint clears and a saved timestamp appears.
    await waitFor(() => {
      expect(screen.queryByText('未保存の変更があります')).toBeNull();
    });
    expect(screen.getByText(/保存しました/)).toBeInTheDocument();
  });

  it('maps a server per-field 422 onto the offending field card', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Unprocessable Entity',
            detail: 'Validation failed',
            errors: [
              { field: 'fields.0.label', message: 'Label for ja is required.', code: 'invalid' },
            ],
          },
          { status: 422 },
        ),
      ),
    );
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'Sales');
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
    await user.click(screen.getByRole('button', { name: '公開' }));

    // The offending field card surfaces the server's per-field message; creation is not signalled.
    expect(await screen.findByText('Label for ja is required.')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('exposes accessible names on the choice editor + field card (#311)', async () => {
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    // Add a text field — its card label is now a real <button> (nested-interactive resolved).
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
    expect(screen.getByRole('button', { name: 'テキスト項目' })).toBeInTheDocument();

    // Add a 選択 field from the palette — the rich choice editor renders.
    await user.click(screen.getByRole('button', { name: '選択' }));

    // The floating-toolbar destructive / icon buttons expose real accessible names (scope to the
    // toolbar — the inspector also has a like-named "delete field" affordance, which is fine).
    await waitFor(() => {
      expect(document.querySelector('.cf-float')).not.toBeNull();
    });
    const toolbar = within(document.querySelector('.cf-float') as HTMLElement);
    expect(toolbar.getByRole('button', { name: 'このフィールドを削除' })).toBeInTheDocument();
    expect(toolbar.getByRole('button', { name: 'フィールドを複製' })).toBeInTheDocument();

    // An added option's remove button is named.
    await user.type(screen.getByRole('textbox', { name: '選択肢を追加' }), 'A{Enter}');
    expect(screen.getAllByRole('button', { name: '選択肢を削除' }).length).toBeGreaterThan(0);
  });

  it('blocks creation without a name or fields', async () => {
    const onCreated = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: '公開' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('フォーム名と1つ以上のフィールド');
    expect(onCreated).not.toHaveBeenCalled();
  });
});
