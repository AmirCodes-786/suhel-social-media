import express from 'express';
import {
  getPosts,
  createPost,
  getFollowingFeed,
  getTrendingFeed,
  getSavedPosts,
  getUserPosts,
  getPostDetail,
  updatePost,
  deletePost,
  likePost,
  savePost,
  getComments,
  createComment,
} from '../controllers/postController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Feeds & Lists
router.get(['/feed', '/feed/'], authenticate, getFollowingFeed);
router.get(['/trending', '/trending/'], authenticate, getTrendingFeed);
router.get(['/saved', '/saved/'], authenticate, getSavedPosts);
router.get(['/user/:username', '/user/:username/'], authenticate, getUserPosts);

// Comments
router
  .route(['/:post_id/comments', '/:post_id/comments/'])
  .get(authenticate, getComments)
  .post(authenticate, createComment);

// Likes & Saves
router.post(['/:pk/like', '/:pk/like/'], authenticate, likePost);
router.post(['/:pk/save', '/:pk/save/'], authenticate, savePost);

// Post List & Create
router
  .route(['/', ''])
  .get(authenticate, getPosts)
  .post(authenticate, upload.single('media'), createPost);

// Post Detail, Update, Delete
router
  .route(['/:id', '/:id/'])
  .get(authenticate, getPostDetail)
  .put(authenticate, upload.single('media'), updatePost)
  .patch(authenticate, upload.single('media'), updatePost)
  .delete(authenticate, deletePost);

export default router;
