import express from 'express';
import {
  getConversations,
  getUnreadMessageCount,
  createConversation,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  clearChat,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Total unread count for fast badges
router.get(['/unread-count', '/unread-count/'], authenticate, getUnreadMessageCount);

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

// Clear all messages in a conversation
router.delete(
  ['/conversations/:conversation_id/clear', '/conversations/:conversation_id/clear/'],
  authenticate,
  clearChat
);

// Delete a single message
router.delete(
  ['/messages/:message_id', '/messages/:message_id/'],
  authenticate,
  deleteMessage
);

// Conversation detail & delete
router
  .route(['/conversations/:pk', '/conversations/:pk/'])
  .get(authenticate, getConversationDetail)
  .delete(authenticate, deleteConversation);

export default router;
