import express from 'express';
import {
  getStories,
  createStory,
  markStoryViewed,
  getStoryViewers,
} from '../controllers/storyController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post(['/:pk/view', '/:pk/view/'], authenticate, markStoryViewed);
router.get(['/:pk/viewers', '/:pk/viewers/'], authenticate, getStoryViewers);

router
  .route(['/', ''])
  .get(authenticate, getStories)
  .post(authenticate, upload.single('media'), createStory);

export default router;
