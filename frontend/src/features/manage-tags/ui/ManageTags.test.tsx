import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { ManageTags } from '@/features/manage-tags';

const TAGS = 'http://localhost/admin/tags';

const existingTag = { id: 1, label: '見積依頼', color: 'amber', sort_order: 0 };

describe('ManageTags', () => {
  it('shows the compliance warning and lists the org tags', async () => {
    server.use(http.get(TAGS, () => HttpResponse.json({ items: [existingTag] })));

    renderWithProviders(<ManageTags />);

    expect(await screen.findByText('見積依頼')).toBeInTheDocument();
    // The 要配慮個人情報 warning is always present (ADR 0019 / charter §8).
    expect(screen.getByText(/要配慮個人情報/)).toBeInTheDocument();
  });

  it('creates a tag with a label and colour', async () => {
    interface Posted {
      label: string;
      color: string;
    }
    const captured: { value: Posted | null } = { value: null };
    server.use(
      http.get(TAGS, () => HttpResponse.json({ items: [] })),
      http.post(TAGS, async ({ request }) => {
        captured.value = (await request.json()) as Posted;
        return HttpResponse.json(
          { id: 2, label: captured.value.label, color: captured.value.color, sort_order: 0 },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageTags />);

    await user.click(await screen.findByRole('button', { name: 'タグを追加' }));
    await user.type(screen.getByLabelText('ラベル'), 'クレーム');
    await user.click(screen.getByRole('radio', { name: 'rose' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(captured.value).toEqual({ label: 'クレーム', color: 'rose' });
    });
  });

  it('surfaces a duplicate-label conflict (409)', async () => {
    server.use(
      http.get(TAGS, () => HttpResponse.json({ items: [] })),
      http.post(TAGS, () =>
        HttpResponse.json(
          { type: 'e', title: 'Conflict', status: 409, detail: 'dup' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<ManageTags />);

    await user.click(await screen.findByRole('button', { name: 'タグを追加' }));
    await user.type(screen.getByLabelText('ラベル'), '見積依頼');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(await screen.findByText('同じ名前のタグが既にあります。')).toBeInTheDocument();
  });
});
