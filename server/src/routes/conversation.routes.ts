import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listConversations,
  createNewConversation,
  getConversation,
  getConversationMessages,
  deleteConversation,
  sendMessage,
} from '../controllers/chat.controller.js';

const router = Router();
router.use(protect);

router.get('/repository/:repositoryId', listConversations);
router.post('/repository/:repositoryId', createNewConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendMessage);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);

export default router;
