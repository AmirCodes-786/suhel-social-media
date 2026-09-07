import express from 'express';
import {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get(['/unread-count', '/unread-count/'], authenticate, getUnreadCount);
router.post(['/:pk/read', '/:pk/read/'], authenticate, markNotificationRead);

router
  .route(['/', ''])
  .get(authenticate, getNotifications)
  .post(authenticate, markAllAsRead);

export default router;
