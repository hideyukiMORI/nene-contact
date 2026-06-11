import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../tests/render/renderWithProviders';
import type { AuditEvent } from '@/entities/audit-event';
import { AuditLogDetail } from '@/features/list-audit-events/ui/AuditLogDetail';

function event(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 410,
    actorUserId: 3,
    organizationId: 1,
    action: 'contact_form.updated',
    entityType: 'contact_form',
    entityId: 5,
    before: { name: '問い合わせ（旧）', status: 'inactive' },
    after: { name: 'お問い合わせフォーム', status: 'active' },
    createdAt: '2026-06-10 11:16:50',
    ...overrides,
  };
}

describe('AuditLogDetail', () => {
  it('renders an updated event as a before → after diff in the shared skeleton', () => {
    renderWithProviders(<AuditLogDetail event={event()} />);

    // Header shows the humanized action; the raw action stays in the rail (mono) for precision.
    expect(screen.getByText('問い合わせフォームを更新')).toBeInTheDocument();
    expect(screen.getByText('contact_form.updated')).toBeInTheDocument();
    expect(screen.getByText('更新')).toBeInTheDocument();
    expect(screen.getByText('変更内容')).toBeInTheDocument();

    // A changed row shows both the old and new value.
    expect(screen.getByText('問い合わせ（旧）')).toBeInTheDocument();
    expect(screen.getByText('お問い合わせフォーム')).toBeInTheDocument();

    // Read-only event-info rail (dl.meta) + immutability note.
    expect(screen.getByText('ユーザー #3')).toBeInTheDocument();
    expect(screen.getByText('#410')).toBeInTheDocument();
    expect(screen.getAllByText('contact_form #5').length).toBeGreaterThan(0);
    expect(
      screen.getByText('監査ログは改ざん防止のため変更・削除できません（追記のみ・ADR 0013）。'),
    ).toBeInTheDocument();
  });

  it('shows the no-diff message for a read event', () => {
    renderWithProviders(
      <AuditLogDetail
        event={event({
          action: 'submission.viewed',
          before: null,
          after: null,
          entityType: 'submission',
        })}
      />,
    );

    expect(screen.getByText('閲覧')).toBeInTheDocument();
    expect(screen.getByText('この操作は内容を変更していません（閲覧記録）。')).toBeInTheDocument();
  });
});
