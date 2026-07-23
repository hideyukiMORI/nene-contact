import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { GuideTourProvider, GuideTourLink } from '@/features/guide-tour';

function renderTour(): void {
  renderWithProviders(
    <GuideTourProvider>
      <GuideTourLink />
    </GuideTourProvider>,
  );
}

describe('GuideTour', () => {
  it('opens from the launcher, steps forward, and finishes', async () => {
    const user = userEvent.setup();
    renderTour();

    // Closed by default — no dialog on screen.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Launch from the sidebar footer button.
    await user.click(screen.getByRole('button', { name: '使い方に迷ったら ガイドツアー →' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ようこそ' })).toBeInTheDocument();
    // No Back button on the first step.
    expect(screen.queryByRole('button', { name: '戻る' })).not.toBeInTheDocument();

    // Advance to the next step.
    await user.click(screen.getByRole('button', { name: '次へ' }));
    expect(screen.getByText('2 / 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();

    // Go back to the start.
    await user.click(screen.getByRole('button', { name: '戻る' }));
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
  });

  it('closes when skipped', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: '使い方に迷ったら ガイドツアー →' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'スキップ' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
