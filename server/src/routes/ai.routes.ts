import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { runAiTool } from '../controllers/aiTools.controller.js';

const router = Router();
router.use(protect);

router.post('/explain', runAiTool);
router.post('/review', runAiTool);
router.post('/summarize', runAiTool);
router.post('/security', runAiTool);
router.post('/architecture', runAiTool);
router.post('/documentation', runAiTool);

export default router;
