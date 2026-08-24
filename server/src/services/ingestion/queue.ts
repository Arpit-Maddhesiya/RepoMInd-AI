import { logger } from '../../utils/logger.js';

/**
 * Simple in-process FIFO queue with a single worker.
 * The pipeline is idempotent per repository (re-index resets state),
 * so re-enqueuing an already-queued id is harmless.
 */
class IndexingQueue {
  private queue: string[] = [];
  private running = false;

  enqueue(repositoryId: string): void {
    if (!this.queue.includes(repositoryId)) {
      this.queue.push(repositoryId);
    }
    void this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const repositoryId = this.queue.shift()!;
      const { runPipeline } = await import('./pipeline.js');
      try {
        await runPipeline(repositoryId);
      } catch (error) {
        logger.error('Indexing pipeline crashed', { repositoryId, error });
      }
    }

    this.running = false;
  }
}

export const indexingQueue = new IndexingQueue();

export function startIndexingWorker(): void {
  logger.info('Indexing worker started');
}
