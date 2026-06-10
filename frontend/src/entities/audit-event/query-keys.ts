import type { AuditEventListParams } from '@/entities/audit-event/model';

export const auditEventKeys = {
  all: ['audit-events'] as const,
  list: (params: AuditEventListParams) => [...auditEventKeys.all, 'list', params] as const,
};
