import type { AuditEventFilterParams } from '@/entities/audit-event/model';

/**
 * Serializes the audit-trail filter (q / from / to) onto a query string. Shared by the list
 * query and the CSV export so the downloaded file always covers the rows on screen.
 */
export function appendAuditFilterParams(
  search: URLSearchParams,
  params: AuditEventFilterParams,
): URLSearchParams {
  if (params.q !== undefined && params.q !== '') search.set('q', params.q);
  if (params.from !== undefined && params.from !== '') search.set('from', params.from);
  if (params.to !== undefined && params.to !== '') search.set('to', params.to);
  return search;
}
