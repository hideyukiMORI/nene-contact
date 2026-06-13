import { env } from '@/shared/config/env';
import { AppError, toAppError } from '@/shared/api/errors';

// Single transport (frontend-standards §F): typed verbs, in-memory bearer (fail-closed),
// problem+json → AppError. No domain logic here.

let authToken: string | null = null;

export function setAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken !== null) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const init: RequestInit = { method, headers, credentials: 'omit' };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, init);
  } catch {
    throw new AppError(0, 'network-error', 'Network Error', '');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const parsed: unknown = text === '' ? null : (JSON.parse(text) as unknown);

  if (!response.ok) {
    throw toAppError(response.status, parsed);
  }

  return parsed as T;
}

async function upload<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken !== null) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    // No Content-Type: the browser sets multipart/form-data with the boundary.
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers,
      body: form,
      credentials: 'omit',
    });
  } catch {
    throw new AppError(0, 'network-error', 'Network Error', '');
  }

  const text = await response.text();
  const parsed: unknown = text === '' ? null : (JSON.parse(text) as unknown);
  if (!response.ok) {
    throw toAppError(response.status, parsed);
  }
  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  upload,
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};
