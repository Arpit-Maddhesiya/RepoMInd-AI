import { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '../utils/AppError.js';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || 'value'}: ${i.message}`)
        .join(', ');
      return next(new AppError(message, 400, ErrorCodes.VALIDATION));
    }
    (req as Request & Record<string, unknown>)[source] = result.data;
    next();
  };
