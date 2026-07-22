import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/shared/ui/Pagination';

const base = {
  total: 50,
  canPrev: false,
  canNext: true,
  onPrev: vi.fn(),
  onNext: vi.fn(),
  showingLabel: '1〜20件を表示（全50件）',
  previousLabel: '前へ',
  nextLabel: '次へ',
};

describe('Pagination', () => {
  it('renders nothing when total is 0', () => {
    render(<Pagination {...base} total={0} canNext={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders previous/next buttons and the range when total > 0', () => {
    render(<Pagination {...base} />);
    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
    expect(screen.getByText('1〜20件を表示（全50件）')).toBeInTheDocument();
  });

  it('disables previous when canPrev is false', () => {
    render(<Pagination {...base} canPrev={false} />);
    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled();
  });

  it('enables previous when canPrev is true', () => {
    render(<Pagination {...base} canPrev />);
    expect(screen.getByRole('button', { name: '前へ' })).not.toBeDisabled();
  });

  it('disables next when canNext is false', () => {
    render(<Pagination {...base} canNext={false} />);
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();
  });

  it('calls onNext when next is clicked', async () => {
    const onNext = vi.fn();
    render(<Pagination {...base} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('calls onPrev when previous is clicked', async () => {
    const onPrev = vi.fn();
    render(<Pagination {...base} canPrev onPrev={onPrev} />);
    await userEvent.click(screen.getByRole('button', { name: '前へ' }));
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it('does not fire onPrev while disabled', async () => {
    const onPrev = vi.fn();
    render(<Pagination {...base} canPrev={false} onPrev={onPrev} />);
    await userEvent.click(screen.getByRole('button', { name: '前へ' }));
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('renders the supplied range label verbatim', () => {
    render(<Pagination {...base} showingLabel="41〜45件を表示（全45件）" />);
    expect(screen.getByText('41〜45件を表示（全45件）')).toBeInTheDocument();
  });
});
