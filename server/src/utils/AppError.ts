export class AppError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export const ErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  GITHUB_API: 'GITHUB_API_ERROR',
  REPOSITORY_PROCESSING: 'REPOSITORY_PROCESSING_ERROR',
  AI_PROVIDER: 'AI_PROVIDER_ERROR',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL: 'INTERNAL_ERROR',
} as const;
