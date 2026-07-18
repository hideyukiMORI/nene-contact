import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../tests/msw/server';
import { useMediaQuery, useUploadMediaMutation } from '@/entities/media';

const MEDIA = 'http://localhost/admin/media';

function makeWrapper(): ({ children }: { children: ReactNode }) => ReactNode {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('media entity hooks', () => {
  it('maps the media list to the model, defaulting missing dimensions/name to null', async () => {
    server.use(
      http.get(MEDIA, () =>
        HttpResponse.json([
          { id: 1, url: '/m/1.png', width: 800, height: 600, original_name: 'a.png' },
          // width/height/original_name absent → must default to null
          { id: 2, url: '/m/2.png' },
        ]),
      ),
    );

    const { result } = renderHook(() => useMediaQuery(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      { id: 1, url: '/m/1.png', width: 800, height: 600, originalName: 'a.png' },
      { id: 2, url: '/m/2.png', width: null, height: null, originalName: null },
    ]);
  });

  it('uploads a file and maps the returned asset', async () => {
    server.use(
      http.post(MEDIA, () =>
        HttpResponse.json(
          { id: 3, url: '/m/3.png', width: 100, height: 100, original_name: 'up.png' },
          { status: 201 },
        ),
      ),
    );

    const { result } = renderHook(() => useUploadMediaMutation(), { wrapper: makeWrapper() });

    let asset: unknown;
    await act(async () => {
      asset = await result.current.mutateAsync(new File(['x'], 'up.png', { type: 'image/png' }));
    });

    expect(asset).toEqual({
      id: 3,
      url: '/m/3.png',
      width: 100,
      height: 100,
      originalName: 'up.png',
    });
  });
});
