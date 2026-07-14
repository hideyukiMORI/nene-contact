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
