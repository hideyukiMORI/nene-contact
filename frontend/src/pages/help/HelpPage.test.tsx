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

  it('leads with a quickstart and a migration cheat-sheet', () => {
    renderHelp();

    // quickstart: the three install steps, including the paste location
    expect(
      screen.getByRole('heading', { level: 3, name: '最短でサイトに設置する' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/<\/body> の直前に貼り付けて保存/)).toBeInTheDocument();
    // migration cheat-sheet maps a familiar tool onto this product
    expect(
      screen.getByRole('heading', { level: 3, name: '他のツールから乗り換える方へ' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Contact Form 7 の送信先メール')).toBeInTheDocument();
  });
});
