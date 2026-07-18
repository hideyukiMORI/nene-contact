import { describe, expect, it } from 'vitest';
import { toAuditEvent, toAuditEventList } from '@/entities/audit-event/mapper';
import type { AuditEventDto } from '@/entities/audit-event/api-types';

describe('audit-event mappers', () => {
  it('maps a full DTO to the model (snake_case → camelCase, snapshots preserved)', () => {
    const model = toAuditEvent({
      id: 42,
      actor_user_id: 9,
      organization_id: 7,
      action: 'submission.status_updated',
      entity_type: 'submission',
      entity_id: 100,
      before: { status: 'open' },
      after: { status: 'resolved' },
      created_at: '2026-07-18T05:00:00Z',
    });

    expect(model).toEqual({
      id: 42,
      actorUserId: 9,
      organizationId: 7,
      action: 'submission.status_updated',
      entityType: 'submission',
      entityId: 100,
      before: { status: 'open' },
      after: { status: 'resolved' },
      createdAt: '2026-07-18T05:00:00Z',
    });
  });

  it('defaults every missing field (empty DTO)', () => {
    expect(toAuditEvent({})).toEqual({
      id: 0,
      actorUserId: null,
      organizationId: null,
      action: '',
      entityType: '',
      entityId: null,
      before: null,
      after: null,
      createdAt: null,
    });
  });

  it('keeps an object snapshot but maps a null snapshot to null (a create/delete audit)', () => {
    const created = toAuditEvent({
      action: 'organization.created',
      before: null,
      after: { name: 'Acme' },
    });
    expect(created.before).toBeNull();
    expect(created.after).toEqual({ name: 'Acme' });

    const deleted = toAuditEvent({
      action: 'submission.deleted',
      before: { status: 'open' },
      after: null,
    });
    expect(deleted.before).toEqual({ status: 'open' });
    expect(deleted.after).toBeNull();
  });

  it('coerces a non-object snapshot to null (defensive guard against malformed data)', () => {
    // The API types snapshots as object|null, but the mapper guards at runtime — a primitive
    // that slipped through must not reach the model as a non-record value.
    const dto = { action: 'x', before: 'not-an-object', after: 5 } as unknown as AuditEventDto;
    const model = toAuditEvent(dto);
    expect(model.before).toBeNull();
    expect(model.after).toBeNull();
  });

  it('maps a list DTO, mapping each item and carrying pagination', () => {
    const list = toAuditEventList({
      items: [
        { id: 1, action: 'user.created' },
        { id: 2, action: 'user.password_changed', actor_user_id: null },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    });

    expect(list.total).toBe(2);
    expect(list.limit).toBe(20);
    expect(list.offset).toBe(0);
    expect(list.items).toHaveLength(2);
    expect(list.items[0]?.action).toBe('user.created');
    // An admin reset carries a null actor (see terminology: user.password_changed recipe).
    expect(list.items[1]?.actorUserId).toBeNull();
  });

  it('defaults an empty list DTO (no items, zeroed pagination)', () => {
    expect(toAuditEventList({})).toEqual({ items: [], total: 0, limit: 0, offset: 0 });
  });
});
