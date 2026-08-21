import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type IUser } from '../models/User.model.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Not authorized. Token missing.', 401, ErrorCodes.UNAUTHORIZED));
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists.', 401, ErrorCodes.UNAUTHORIZED));
    }
    req.user = user;
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401, ErrorCodes.UNAUTHORIZED));
  }
};
