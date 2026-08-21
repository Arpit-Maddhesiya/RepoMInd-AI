import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, ErrorCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken(user.id);

  created(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401, ErrorCodes.UNAUTHORIZED);
  }

  const token = signToken(user.id);
  ok(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, name, email } = req.user!;
  ok(res, { user: { id, name, email } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWT — the client discards the token.
  ok(res, { message: 'Logged out successfully' });
});
