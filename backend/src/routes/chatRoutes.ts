import express from 'express';
import { getThread, sendMessage, sendPublicSupportMessage } from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public support message from login page
router.post('/public-message', sendPublicSupportMessage);

router.get('/thread', protect, getThread);
router.post('/message', protect, sendMessage);

export default router;
