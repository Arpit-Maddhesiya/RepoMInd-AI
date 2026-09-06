import 'dotenv/config';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { startIndexingWorker } from './services/ingestion/queue.js';

const start = async () => {
  await connectDB();
  startIndexingWorker();
  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`🚀 RepoMind AI server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();
