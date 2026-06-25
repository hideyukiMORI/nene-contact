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
    await user.click(screen.getByRole('button', { name: '公開する' }));

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
    await user.click(screen.getByRole('button', { name: '公開する' }));

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
    await user.click(screen.getByRole('button', { name: '公開する' }));

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

  it('duplicates a field from the card duplicate button (#317)', async () => {
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={vi.fn()} />);

    // One text field to start.
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
    expect(screen.getAllByRole('button', { name: 'テキスト項目' })).toHaveLength(1);

    // Duplicate it — an independent copy is inserted directly below.
    await user.click(screen.getByRole('button', { name: 'フィールドを複製' }));
    expect(screen.getAllByRole('button', { name: 'テキスト項目' }).length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('disables the not-yet-wired settings toggles (#324)', async () => {
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'フォーム設定' }));

    expect(screen.getByRole('switch', { name: 'reCAPTCHA を有効化' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: '重複送信を防止' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: '送信者へ自動返信' })).toBeDisabled();
  });

  it('confirms before publishing a new form (#324)', async () => {
    let posted = 0;
    server.use(
      http.post(URL, () => {
        posted += 1;
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
    const user = userEvent.setup();

    renderWithProviders(<FormBuilder onCreated={vi.fn()} />);

    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'Sales');
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));

    // Clicking 公開 opens a confirmation — nothing is posted yet.
    await user.click(screen.getByRole('button', { name: '公開' }));
    expect(posted).toBe(0);

    // Confirming runs the existing publish flow.
    await user.click(screen.getByRole('button', { name: '公開する' }));
    await waitFor(() => {
      expect(posted).toBe(1);
    });
  });

  it('edits ja/en field labels via the editing-locale toggle, preserving ja (#314)', async () => {
    interface Posted {
      fields?: { label: Record<string, string> }[];
    }
    const captured: { value: Posted | null } = { value: null };
    server.use(
      http.post(URL, async ({ request }) => {
        captured.value = (await request.json()) as Posted;
        return HttpResponse.json(
          {
            id: 1,
            name: 'お問い合わせ',
            public_form_key: 'k',
            default_locale: 'ja',
            locales: ['ja', 'en'],
            fields: [],
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<FormBuilder onCreated={vi.fn()} />);

    const titleInputs = screen.getAllByLabelText('フォーム名');
    await user.type(titleInputs[0] as HTMLElement, 'お問い合わせ');
    await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));

    // EN is off → no editing-language toggle.
    expect(screen.queryByText('編集言語')).toBeNull();

    // Enable EN on the form settings tab, then return to the fields tab.
    await user.click(screen.getByRole('button', { name: 'フォーム設定' }));
    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'フィールド' }));

    // The toggle now shows; switch to English and enter an en label.
    expect(screen.getByText('編集言語')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'English' }));
    const labelInput = screen.getByLabelText('ラベル');
    expect(labelInput).toHaveValue(''); // en is empty (not copied from ja)
    await user.type(labelInput, 'Inquiry');

    await user.click(screen.getByRole('button', { name: '公開' }));
    await user.click(screen.getByRole('button', { name: '公開する' }));

    await waitFor(() => {
      expect(captured.value).not.toBeNull();
    });
    // ja preserved, en added — neither overwrites the other.
    expect(captured.value?.fields?.[0]?.label).toEqual({ ja: 'テキスト項目', en: 'Inquiry' });
  });

  it('opens the inspector as a drawer on narrow screens and closes it (#313)', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    try {
      const user = userEvent.setup();
      renderWithProviders(<FormBuilder onCreated={vi.fn()} />);

      // Selecting a field (adding one selects it) opens the overlay drawer on narrow screens.
      await user.click(screen.getByRole('button', { name: 'フィールドを追加' }));
      expect(document.querySelector('.builder.panel-open')).not.toBeNull();

      // The drawer's close button dismisses it.
      const close = document.querySelector('.bd-pclose');
      expect(close).not.toBeNull();
      await user.click(close as HTMLElement);
      expect(document.querySelector('.builder.panel-open')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
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
