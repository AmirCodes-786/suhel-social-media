import express from 'express';
import {
  getCurrentUser,
  updateCurrentUser,
  getUserProfile,
  followUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getCreatorSuggestions,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Current user profile
router
  .route(['/me', '/me/'])
  .get(authenticate, getCurrentUser)
  .put(
    authenticate,
    upload.fields([
      { name: 'profile_picture', maxCount: 1 },
      { name: 'cover_picture', maxCount: 1 },
    ]),
    updateCurrentUser
  )
  .patch(
    authenticate,
    upload.fields([
      { name: 'profile_picture', maxCount: 1 },
      { name: 'cover_picture', maxCount: 1 },
    ]),
    updateCurrentUser
  );

// User search
router.get(['/search', '/search/'], authenticate, searchUsers);

// Creator suggestions
router.get(['/suggestions', '/suggestions/'], authenticate, getCreatorSuggestions);

// User profile by username
router.get(['/:username', '/:username/'], authenticate, getUserProfile);

// Follow / unfollow
router.post(['/:username/follow', '/:username/follow/'], authenticate, followUser);

// Followers & Following lists
router.get(['/:username/followers', '/:username/followers/'], authenticate, getFollowers);
router.get(['/:username/following', '/:username/following/'], authenticate, getFollowing);

export default router;
