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

/** Server-side filter shared by the audit list and its CSV export. */
export interface AuditEventFilterParams {
  q?: string;
  from?: string;
  to?: string;
}

export interface AuditEventListParams extends AuditEventFilterParams {
  limit: number;
  offset: number;
}
