import {
  createNene2Transport,
  isNene2ClientError,
  isValidationProblemDetails,
  type Nene2ClientError,
  type TokenStore,
} from '@hideyukimori/nene2-client';
import { env } from '@/shared/config/env';
import { AppError } from '@/shared/api/errors';

// Single transport (frontend-standards §F): typed verbs, in-memory bearer (fail-closed),
// problem+json → AppError. No domain logic here.
//
// The X-Authorization mirror (#366/#367) and Problem Details parsing that used to be
// hand-rolled here now come from the fleet-standard `@hideyukimori/nene2-client`
// transport (frontend-standards draft §2 A-1/A-2; nene-payout #155 reference).
//
// Token storage stays **in-memory** (not `createSessionTokenStore` / sessionStorage):
// this repo's binding `docs/development/frontend-standards.md` requires an ADR to move
// off in-memory storage (XSS blast radius). Adopting the fleet AU-1 default
// (`createSessionTokenStore({ key: 'nene_contact_token' })`) would be a real behavior
// change (token now survives a page reload) and needs that ADR first — out of scope for
// this migration, which is implementation unification only. See PR description.
let token: string | null = null;

const tokenStore: TokenStore = {
  getToken: () => token,
  clearToken: () => {
    token = null;
  },
};

export function setAuthToken(next: string): void {
  token = next;
}

export function clearAuthToken(): void {
  tokenStore.clearToken();
}

const transport = createNene2Transport({
  baseUrl: env.apiBaseUrl,
  tokenStore,
  credentials: 'omit',
  // Look up `fetch` at call time, not bind it once at module load: tests patch
  // `globalThis.fetch` via msw's `server.listen()`, which can run after this module
  // is first imported (nene-payout #155 precedent).
  fetch: (input, init) => globalThis.fetch(input, init),
  // Contact does not auto sign-out on 401 today (the admin session lives in
  // app/auth-context React state, decoupled from this token store; only signOut()
  // clears it). The transport's default (`clearTokenOnStatuses: [401]`) would add
  // that behavior, so it is disabled here to keep this PR behavior-preserving.
  clearTokenOnStatuses: [],
});

/** Maps the package's `Nene2ClientError` to this product's `AppError` (unchanged shape). */
function toAppError(error: Nene2ClientError): AppError {
  const problem = error.problem;
  if (problem === undefined) {
    const isNetworkError = error.status === 0;
    return new AppError(
      error.status,
      isNetworkError ? 'network-error' : 'about:blank',
      isNetworkError ? 'Network Error' : 'Error',
      '',
    );
  }

  const validationErrors = isValidationProblemDetails(problem)
    ? problem.errors.map((e) => ({ field: e.field, message: e.message, code: e.code }))
    : [];

  return new AppError(
    error.status,
    problem.type,
    problem.title,
    problem.detail ?? '',
    validationErrors,
  );
}

async function unwrap<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (isNene2ClientError(error)) {
      throw toAppError(error);
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => unwrap(transport.get<T>(path)),
  upload: <T>(path: string, form: FormData): Promise<T> => unwrap(transport.upload<T>(path, form)),
  post: <T>(path: string, body?: unknown): Promise<T> => unwrap(transport.post<T>(path, body)),
  put: <T>(path: string, body?: unknown): Promise<T> => unwrap(transport.put<T>(path, body)),
  patch: <T>(path: string, body?: unknown): Promise<T> => unwrap(transport.patch<T>(path, body)),
  delete: <T>(path: string): Promise<T> => unwrap(transport.delete<T>(path)),
  // Binary download (e.g. CSV export); `filename` is parsed from Content-Disposition.
  getBlob: (path: string): Promise<{ blob: Blob; filename: string | null }> =>
    unwrap(transport.getBlob(path)),
};
