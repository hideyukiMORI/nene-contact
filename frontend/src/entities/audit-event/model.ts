export interface AuditEvent {
  id: number;
  actorUserId: number | null;
  organizationId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface AuditEventList {
  items: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditEventListParams {
  limit: number;
  offset: number;
}
