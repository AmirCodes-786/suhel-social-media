import express from 'express';
import {
  getConversations,
  createConversation,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Conversations list & create
router
  .route(['/conversations', '/conversations/'])
  .get(authenticate, getConversations)
  .post(authenticate, createConversation);

// Messages list & send
router
  .route([
    '/conversations/:conversation_id/messages',
    '/conversations/:conversation_id/messages/',
  ])
  .get(authenticate, getMessages)
  .post(authenticate, upload.single('media'), sendMessage);

// Mark conversation messages read
router.post(
  ['/conversations/:conversation_id/read', '/conversations/:conversation_id/read/'],
  authenticate,
  markConversationRead
);

// Conversation detail & delete
router
  .route(['/conversations/:pk', '/conversations/:pk/'])
  .get(authenticate, getConversationDetail)
  .delete(authenticate, deleteConversation);

export default router;
