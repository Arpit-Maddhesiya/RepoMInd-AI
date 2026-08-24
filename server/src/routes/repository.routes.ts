import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  importRepository,
  listRepositories,
  getRepository,
  getRepositoryStatus,
  reindexRepository,
  deleteRepository,
  listFiles,
  getFileContent,
  getFileTree,
  getRepositoryStats,
} from '../controllers/repository.controller.js';

const router = Router();
router.use(protect);

router.post('/', importRepository);
router.get('/', listRepositories);
router.get('/:id/stats', getRepositoryStats);
router.get('/:id/status', getRepositoryStatus);
router.get('/:id/files', listFiles);
router.get('/:id/tree', getFileTree);
router.get('/:id/files/:path(*)', getFileContent);
router.get('/:id', getRepository);
router.post('/:id/index', reindexRepository);
router.delete('/:id', deleteRepository);

export default router;
