import type { AuditEventDto, AuditEventListDto } from '@/entities/audit-event/api-types';
import type { AuditEvent, AuditEventList } from '@/entities/audit-event/model';

function toRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && value !== undefined && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

export function toAuditEvent(dto: AuditEventDto): AuditEvent {
  return {
    id: dto.id ?? 0,
    actorUserId: dto.actor_user_id ?? null,
    organizationId: dto.organization_id ?? null,
    action: dto.action ?? '',
    entityType: dto.entity_type ?? '',
    entityId: dto.entity_id ?? null,
    before: toRecord(dto.before),
    after: toRecord(dto.after),
    createdAt: dto.created_at ?? null,
  };
}

export function toAuditEventList(dto: AuditEventListDto): AuditEventList {
  return {
    items: (dto.items ?? []).map(toAuditEvent),
    total: dto.total ?? 0,
    limit: dto.limit ?? 0,
    offset: dto.offset ?? 0,
  };
}
