import { NextFunction, Request, Response } from 'express';
import { ErrorCodes } from '../utils/AppError.js';
import { isProd } from '../config/env.js';
import { logger } from '../utils/logger.js';

type ErrorWithMeta = Error & {
  statusCode?: number;
  errorCode?: string;
  code?: number;
  name?: string;
  errors?: Record<string, { message: string }>;
  path?: string;
  keyValue?: Record<string, unknown>;
};

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorCode: ErrorCodes.NOT_FOUND,
  });
}

export function errorHandler(
  err: ErrorWithMeta,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode ?? ErrorCodes.INTERNAL;

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = ErrorCodes.VALIDATION;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errorCode = ErrorCodes.VALIDATION;
  } else if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0] ?? 'value';
    message = `${field} already exists`;
    errorCode = ErrorCodes.CONFLICT;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    errorCode = ErrorCodes.UNAUTHORIZED;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    const zod = err as unknown as { issues?: { path: (string | number)[]; message: string }[] };
    message = (zod.issues ?? [])
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    errorCode = ErrorCodes.VALIDATION;
  } else if (err.name === 'PayloadTooLargeError') {
    statusCode = 413;
    message = 'Request payload too large';
    errorCode = ErrorCodes.PAYLOAD_TOO_LARGE;
  }

  if (statusCode >= 500) {
    logger.error(err.stack ?? err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
