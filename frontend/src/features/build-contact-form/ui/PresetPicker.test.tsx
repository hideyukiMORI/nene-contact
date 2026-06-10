import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { PresetPicker } from '@/features/build-contact-form/ui/PresetPicker';

describe('PresetPicker', () => {
  it('renders the presets and seeds the chosen one on pick', async () => {
    const onPick = vi.fn();
    renderWithProviders(<PresetPicker onPick={onPick} />);

    // Localized preset names render (ja default catalog).
    expect(screen.getByText('お問い合わせ')).toBeInTheDocument();
    expect(screen.getByText('空から作成')).toBeInTheDocument();

    // Each preset is a single selectable card; pick the お問い合わせ template.
    await userEvent.click(screen.getByRole('button', { name: /^お問い合わせ/ }));

    expect(onPick).toHaveBeenCalledTimes(1);
    const preset = onPick.mock.calls[0]?.[0] as { build: () => { fields: unknown[] } };
    expect(preset.build().fields.length).toBeGreaterThan(0);
  });
});
