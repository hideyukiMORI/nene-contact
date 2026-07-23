import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import { GuideTourProvider, OnboardingBanner } from '@/features/guide-tour';

function renderBanner(): void {
  renderWithProviders(
    <GuideTourProvider>
      <OnboardingBanner />
    </GuideTourProvider>,
  );
}

describe('OnboardingBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('shows on first run and starting the tour opens it and hides the banner', async () => {
    const user = userEvent.setup();
    renderBanner();

    expect(screen.getByText('はじめての方へ')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ガイドツアーを始める/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('はじめての方へ')).not.toBeInTheDocument();
  });

  it('stays hidden once dismissed', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(screen.queryByText('はじめての方へ')).not.toBeInTheDocument();
    expect(localStorage.getItem('nene-onboarding-dismissed')).toBe('1');
  });
});
