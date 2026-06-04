// RFC 9457 Problem Details → typed AppError (frontend-standards §F). Components receive
// AppError, never a raw Response. PII is never logged.

export interface ValidationFieldError {
  field: string;
  message: string;
  code: string;
}

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly type: string,
    readonly title: string,
    readonly detail: string,
    readonly validationErrors: ValidationFieldError[] = [],
  ) {
    super(detail || title);
    this.name = 'AppError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }
}

interface ProblemShape {
  type?: unknown;
  title?: unknown;
  detail?: unknown;
  errors?: unknown;
}

export function toAppError(status: number, body: unknown): AppError {
  const problem: ProblemShape = typeof body === 'object' && body !== null ? body : {};
  const type = typeof problem.type === 'string' ? problem.type : 'about:blank';
  const title = typeof problem.title === 'string' ? problem.title : 'Error';
  const detail = typeof problem.detail === 'string' ? problem.detail : '';

  const validationErrors: ValidationFieldError[] = Array.isArray(problem.errors)
    ? problem.errors.flatMap((e: unknown) => {
        if (typeof e !== 'object' || e === null) {
          return [];
        }
        const rec = e as Record<string, unknown>;
        return [
          {
            field: typeof rec.field === 'string' ? rec.field : '',
            message: typeof rec.message === 'string' ? rec.message : '',
            code: typeof rec.code === 'string' ? rec.code : '',
          },
        ];
      })
    : [];

  return new AppError(status, type, title, detail, validationErrors);
}
