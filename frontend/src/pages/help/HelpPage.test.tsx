import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/render/renderWithProviders';
import { HelpPage } from '@/pages/help';

function renderHelp(): void {
  renderWithProviders(
    <MemoryRouter initialEntries={['/help']}>
      <Routes>
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HelpPage', () => {
  it('renders the guide with a section per navigation area', () => {
    renderHelp();

    expect(
      screen.getByRole('heading', { level: 1, name: 'ヘルプ・使い方ガイド' }),
    ).toBeInTheDocument();
    // headings reuse the nav labels, so each console area is documented
    for (const heading of ['ダッシュボード', 'フォーム', '受信箱', 'ユーザー', '監査ログ']) {
      expect(screen.getByRole('heading', { level: 3, name: heading })).toBeInTheDocument();
    }
    // the compliance note is present
    expect(screen.getByRole('heading', { level: 3, name: 'データの取り扱い' })).toBeInTheDocument();
  });
});
