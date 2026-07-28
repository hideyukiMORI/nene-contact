import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { server } from '../../../tests/msw/server';
import { useExportAuditEventsMutation } from '@/entities/audit-event/mutations';
import { auditEventKeys } from '@/entities/audit-event/query-keys';

const EXPORT_URL = 'http://localhost/admin/audit-events/export';

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useExportAuditEventsMutation', () => {
  // The object-URL patch below is on a shared global: restore it, or a later test file runs
  // against this file's mocks.
  const realCreate = URL.createObjectURL.bind(URL);
  const realRevoke = URL.revokeObjectURL.bind(URL);
  afterEach(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });

  it('carries the active filter and invalidates the list so the new record shows (#535)', async () => {
    const requested: string[] = [];
    server.use(
      http.get(EXPORT_URL, ({ request }) => {
        requested.push(request.url);
        return HttpResponse.text('id,created_at\n1,2026-07-29 00:00:00\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="audit-events-2026-07-29.csv"',
          },
        });
      }),
    );

    // jsdom has no object-URL plumbing. Patch just those two methods — replacing the whole
    // `URL` global would break `new URL(...)` inside the transport.
    URL.createObjectURL = vi.fn(() => 'blob:stub');
    URL.revokeObjectURL = vi.fn();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExportAuditEventsMutation(), {
      wrapper: wrapper(queryClient),
    });

    result.current.mutate({ q: 'tag', from: '2026-07-01' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The download honors the on-screen filter…
    expect(requested[0]).toContain('q=tag');
    expect(requested[0]).toContain('from=2026-07-01');
    // …and the audit list is refetched, because the server records this export *after*
    // building the file — the list on screen is one row stale until we drop it.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: auditEventKeys.all });
  });
});
