import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { server } from '../../../../tests/msw/server';
import { useFormBuilder } from '@/features/build-contact-form/hooks/use-form-builder';
import { PublishPage } from '@/features/build-contact-form/ui/PublishPage';
import { resolvePublicBase } from '@/features/build-contact-form/lib/public-base';

const CHANNELS_URL = 'http://localhost/admin/notification-channels';

describe('resolvePublicBase', () => {
  it('falls back to the current origin when no public host is configured', () => {
    expect(resolvePublicBase('', 'http://localhost:8902')).toBe('http://localhost:8902');
    expect(resolvePublicBase('   ', 'https://contact.example.com')).toBe('https://contact.example.com');
  });

  it('uses the configured public host and strips a trailing slash', () => {
    expect(resolvePublicBase('https://contact.example.com', 'http://localhost')).toBe(
      'https://contact.example.com',
    );
    expect(resolvePublicBase('https://contact.example.com/', 'http://localhost')).toBe(
      'https://contact.example.com',
    );
  });
});

// Drives PublishPage with a real builder; formId undefined = an unsaved new form.
function Harness({ formId }: { formId: number | undefined }): ReactNode {
  const builder = useFormBuilder(undefined, formId);
  return (
    <MemoryRouter>
      <PublishPage builder={builder} isEditing={formId !== undefined} formId={formId} />
    </MemoryRouter>
  );
}

describe('PublishPage notifications', () => {
  it('prompts to save first when the form is new (no id yet)', () => {
    renderWithProviders(<Harness formId={undefined} />);

    expect(screen.getByText('フォームを保存すると通知先を設定できます。')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '通知先を管理' })).toBeNull();
  });

  it('lists the saved form’s live channels with a manage action', async () => {
    server.use(
      http.get(CHANNELS_URL, () =>
        HttpResponse.json({
          items: [
            { id: 1, contact_form_id: 7, channel_type: 'email', is_enabled: true },
            { id: 2, contact_form_id: 7, channel_type: 'slack', is_enabled: false },
          ],
        }),
      ),
    );

    renderWithProviders(<Harness formId={7} />);

    await waitFor(() => {
      expect(screen.getByText('メール')).toBeInTheDocument();
    });
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '通知先を管理' })).toBeInTheDocument();
    // The "save first" notice is gone once the form has an id.
    expect(screen.queryByText('フォームを保存すると通知先を設定できます。')).toBeNull();
  });

  it('shows an empty state when a saved form has no channels', async () => {
    server.use(http.get(CHANNELS_URL, () => HttpResponse.json({ items: [] })));

    renderWithProviders(<Harness formId={8} />);

    await waitFor(() => {
      expect(screen.getByText('通知先はまだ設定されていません。')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '通知先を管理' })).toBeInTheDocument();
  });
});
