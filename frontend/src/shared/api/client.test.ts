import { afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/msw/server';
import { apiClient, clearAuthToken, setAuthToken } from './client';
import { AppError } from './errors';

const TOKEN = 'test.jwt.token';

async function captureError(run: () => Promise<unknown>): Promise<AppError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected the call to reject');
}

describe('apiClient (nene2-client transport adapter)', () => {
  afterEach(() => {
    clearAuthToken();
  });

  it('mirrors the bearer token onto both Authorization and X-Authorization on GET', async () => {
    setAuthToken(TOKEN);
    let authorization: string | null = null;
    let xAuthorization: string | null = null;

    server.use(
      http.get('http://localhost/admin/contact-forms', ({ request }) => {
        authorization = request.headers.get('Authorization');
        xAuthorization = request.headers.get('X-Authorization');
        return HttpResponse.json({ items: [] });
      }),
    );

    await apiClient.get('/admin/contact-forms');

    expect(authorization).toBe(`Bearer ${TOKEN}`);
    expect(xAuthorization).toBe(`Bearer ${TOKEN}`);
  });

  it('mirrors both headers on POST/PATCH/upload/delete as well', async () => {
    setAuthToken(TOKEN);
    const seen: Record<string, { auth: string | null; xAuth: string | null }> = {};

    server.use(
      http.post('http://localhost/admin/contact-forms', ({ request }) => {
        seen.post = {
          auth: request.headers.get('Authorization'),
          xAuth: request.headers.get('X-Authorization'),
        };
        return HttpResponse.json({ id: 1 });
      }),
      http.patch('http://localhost/admin/submissions/1', ({ request }) => {
        seen.patch = {
          auth: request.headers.get('Authorization'),
          xAuth: request.headers.get('X-Authorization'),
        };
        return HttpResponse.json({ id: 1 });
      }),
      http.post('http://localhost/admin/media', ({ request }) => {
        seen.upload = {
          auth: request.headers.get('Authorization'),
          xAuth: request.headers.get('X-Authorization'),
        };
        return HttpResponse.json({ id: 'm1' });
      }),
      http.delete('http://localhost/admin/contact-forms/1', ({ request }) => {
        seen.delete = {
          auth: request.headers.get('Authorization'),
          xAuth: request.headers.get('X-Authorization'),
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await apiClient.post('/admin/contact-forms', { name: 'x' });
    await apiClient.patch('/admin/submissions/1', { status: 'resolved' });
    await apiClient.upload('/admin/media', new FormData());
    await apiClient.delete('/admin/contact-forms/1');

    for (const method of ['post', 'patch', 'upload', 'delete']) {
      expect(seen[method]?.auth, `${method} Authorization`).toBe(`Bearer ${TOKEN}`);
      expect(seen[method]?.xAuth, `${method} X-Authorization`).toBe(`Bearer ${TOKEN}`);
    }
  });

  it('sends no auth headers when signed out', async () => {
    let authorization: string | null = null;

    server.use(
      http.get('http://localhost/admin/contact-forms', ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ items: [] });
      }),
    );

    await apiClient.get('/admin/contact-forms');

    expect(authorization).toBeNull();
  });

  it('maps a Problem Details error response to AppError (unchanged public shape)', async () => {
    setAuthToken(TOKEN);
    server.use(
      http.get('http://localhost/admin/contact-forms', () =>
        HttpResponse.json(
          {
            type: 'https://nene-contact.dev/problems/internal-server-error',
            title: 'Server Error',
            status: 500,
            detail: 'boom',
          },
          { status: 500 },
        ),
      ),
    );

    await expect(apiClient.get('/admin/contact-forms')).rejects.toMatchObject({
      status: 500,
      title: 'Server Error',
      type: 'https://nene-contact.dev/problems/internal-server-error',
      detail: 'boom',
    });
    await expect(apiClient.get('/admin/contact-forms')).rejects.toBeInstanceOf(AppError);
  });

  it('maps validation Problem Details (422) to AppError.validationErrors', async () => {
    setAuthToken(TOKEN);
    server.use(
      http.post('http://localhost/admin/contact-forms', () =>
        HttpResponse.json(
          {
            type: 'https://nene-contact.dev/problems/validation-failed',
            title: 'Validation Failed',
            status: 422,
            errors: [{ field: 'name', message: 'required', code: 'required' }],
          },
          { status: 422 },
        ),
      ),
    );

    const error = await captureError(() => apiClient.post('/admin/contact-forms', {}));

    expect(error).toBeInstanceOf(AppError);
    expect(error.isValidation).toBe(true);
    expect(error.validationErrors).toEqual([
      { field: 'name', message: 'required', code: 'required' },
    ]);
  });

  it('maps a network failure to a status-0 network-error AppError', async () => {
    setAuthToken(TOKEN);
    server.use(http.get('http://localhost/admin/contact-forms', () => HttpResponse.error()));

    const error = await captureError(() => apiClient.get('/admin/contact-forms'));

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(0);
    expect(error.type).toBe('network-error');
  });

  it('does not auto-clear the token on 401 (contact has no auto sign-out today)', async () => {
    setAuthToken(TOKEN);
    server.use(
      http.get('http://localhost/admin/contact-forms', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Unauthorized', status: 401 },
          { status: 401 },
        ),
      ),
      http.get('http://localhost/admin/users', ({ request }) =>
        HttpResponse.json({ authorization: request.headers.get('Authorization') }),
      ),
    );

    await expect(apiClient.get('/admin/contact-forms')).rejects.toBeInstanceOf(AppError);

    // The token must still be attached on the next request — no auto sign-out.
    const result = await apiClient.get<{ authorization: string | null }>('/admin/users');
    expect(result.authorization).toBe(`Bearer ${TOKEN}`);
  });
});
