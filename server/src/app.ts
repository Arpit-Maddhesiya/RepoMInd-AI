import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env, isTest } from './config/env.js';
import { logger } from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import aiRoutes from './routes/ai.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL.split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
if (!isTest) app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global API rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    },
  }),
);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RepoMind AI API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler as unknown as express.ErrorRequestHandler);
