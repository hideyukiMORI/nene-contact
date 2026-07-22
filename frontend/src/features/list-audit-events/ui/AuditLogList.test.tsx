import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import type { AuditEvent } from '@/entities/audit-event';
import { AuditLogList, type AuditLogListProps } from '@/features/list-audit-events/ui/AuditLogList';

function event(id: number): AuditEvent {
  return {
    id,
    actorUserId: 3,
    organizationId: 1,
    action: 'contact_form.updated',
    entityType: 'contact_form',
    entityId: id,
    before: null,
    after: null,
    createdAt: '2026-07-22 00:00:00',
  };
}

function baseProps(overrides: Partial<AuditLogListProps> = {}): AuditLogListProps {
  return {
    events: [event(1)],
    total: 25,
    matched: 25,
    page: 0,
    pageCount: 2,
    isLoading: false,
    error: false,
    q: '',
    period: 'all',
    from: '',
    to: '',
    selectedId: null,
    onSelect: vi.fn(),
    onSearch: vi.fn(),
    onPeriod: vi.fn(),
    onFrom: vi.fn(),
    onTo: vi.fn(),
    onPage: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
}

describe('AuditLogList pagination', () => {
  it('shows the range and enables next on the first of several pages', () => {
    renderWithProviders(<AuditLogList {...baseProps()} />);
    expect(screen.getByText('1〜20件を表示（全25件）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '次へ' })).not.toBeDisabled();
  });

  it('advances the page range and disables next on the last page', () => {
    renderWithProviders(<AuditLogList {...baseProps({ page: 1 })} />);
    expect(screen.getByText('21〜25件を表示（全25件）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();
  });

  it('calls onPage(next) when next is clicked', async () => {
    const onPage = vi.fn();
    renderWithProviders(<AuditLogList {...baseProps({ onPage })} />);
    await userEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(onPage).toHaveBeenCalledWith(1);
  });

  it('hides the pager when nothing matches the filter', () => {
    renderWithProviders(<AuditLogList {...baseProps({ events: [], matched: 0, pageCount: 1 })} />);
    expect(screen.queryByRole('button', { name: '前へ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '次へ' })).not.toBeInTheDocument();
  });
});
