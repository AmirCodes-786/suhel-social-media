import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import SavedPost from '../models/SavedPost.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { formatPost, formatComment } from '../utils/formatters.js';
import { createNotification, deleteNotification } from '../services/notificationService.js';
import { uploadMedia } from '../services/storageService.js';

// Helper to enrich posts with likes_count, comments_count, is_liked, is_saved
const enrichPosts = async (posts, currentUserId) => {
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p._id);

  const [likesCounts, commentsCounts, userLikes, userSaves] = await Promise.all([
    Like.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]),
    currentUserId
      ? Like.find({ user: currentUserId, post: { $in: postIds } }).select('post')
      : [],
    currentUserId
      ? SavedPost.find({ user: currentUserId, post: { $in: postIds } }).select('post')
      : [],
  ]);

  const likesMap = new Map(likesCounts.map((l) => [l._id.toString(), l.count]));
  const commentsMap = new Map(commentsCounts.map((c) => [c._id.toString(), c.count]));
  const likedSet = new Set(userLikes.map((l) => l.post.toString()));
  const savedSet = new Set(userSaves.map((s) => s.post.toString()));

  return posts.map((post) => {
    const id = post._id.toString();
    return formatPost(post, currentUserId, {
      likes_count: likesMap.get(id) || 0,
      comments_count: commentsMap.get(id) || 0,
      is_liked: likedSet.has(id),
      is_saved: savedSet.has(id),
    });
  });
};

export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const enriched = await enrichPosts(posts, req.userId);
    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    let { content, media_type, media } = req.body;
    media_type = media_type || 'text';

    if (req.file) {
      media = await uploadMedia(req.file, 'posts/media');
      if (req.file.mimetype.startsWith('image/')) {
        media_type = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        media_type = 'video';
      }
    }

    const post = await Post.create({
      author: req.userId,
      content: content || '',
      media: media || null,
      media_type,
    });

    await post.populate({ path: 'author', populate: { path: 'profile' } });
    const formatted = formatPost(post, req.userId, {
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_saved: false,
    });

    return res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getFollowingFeed = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const followedIds = follows.map((f) => f.following);
    const authorIds = [...followedIds, currentUserId];

    const posts = await Post.find({ author: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const enriched = await enrichPosts(posts, currentUserId);
    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getTrendingFeed = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const enriched = await enrichPosts(posts, req.userId);

    // Order by score: likes + comments, then -createdAt
    enriched.sort((a, b) => {
      const scoreA = a.likes_count + a.comments_count;
      const scoreB = b.likes_count + b.comments_count;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts = async (req, res, next) => {
  try {
    const saved = await SavedPost.find({ user: req.userId }).select('post');
    const postIds = saved.map((s) => s.post);

    const posts = await Post.find({ _id: { $in: postIds } })
      .sort({ createdAt: -1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const enriched = await enrichPosts(posts, req.userId);
    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const enriched = await enrichPosts(posts, req.userId);
    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getPostDetail = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate({
      path: 'author',
      populate: { path: 'profile' },
    });

    if (!post) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const enrichedList = await enrichPosts([post], req.userId);
    return res.json(enrichedList[0]);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ detail: 'You are not the author of this post.' });
    }

    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.media !== undefined) post.media = req.body.media;
    if (req.body.media_type !== undefined) post.media_type = req.body.media_type;

    await post.save();
    await post.populate({ path: 'author', populate: { path: 'profile' } });

    const enrichedList = await enrichPosts([post], req.userId);
    return res.json(enrichedList[0]);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ detail: 'You are not the author of this post.' });
    }

    await Promise.all([
      Post.deleteOne({ _id: post._id }),
      Like.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id }),
      SavedPost.deleteMany({ post: post._id }),
    ]);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.pk || req.params.id);

    if (!post) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const existingLike = await Like.findOne({
      user: req.userId,
      post: post._id,
    });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await deleteNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'like',
        post: post._id,
      });

      const likesCount = await Like.countDocuments({ post: post._id });
      return res.json({ is_liked: false, likes_count: likesCount });
    }

    await Like.create({
      user: req.userId,
      post: post._id,
    });

    if (post.author.toString() !== req.userId) {
      await createNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'like',
        post: post._id,
      });
    }

    const likesCount = await Like.countDocuments({ post: post._id });
    return res.json({ is_liked: true, likes_count: likesCount });
  } catch (error) {
    next(error);
  }
};

export const savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.pk || req.params.id);

    if (!post) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const existingSave = await SavedPost.findOne({
      user: req.userId,
      post: post._id,
    });

    if (existingSave) {
      await SavedPost.deleteOne({ _id: existingSave._id });
      return res.json({ is_saved: false });
    }

    await SavedPost.create({
      user: req.userId,
      post: post._id,
    });

    return res.json({ is_saved: true });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const postId = req.params.post_id || req.params.postId;

    // Fetch root comments (parent is null)
    const rootComments = await Comment.find({ post: postId, parent: null })
      .sort({ createdAt: 1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    // Fetch replies for each root comment
    const commentIds = rootComments.map((c) => c._id);
    const replies = await Comment.find({ parent: { $in: commentIds } })
      .sort({ createdAt: 1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    const replyMap = new Map();
    for (const reply of replies) {
      const pId = reply.parent.toString();
      if (!replyMap.has(pId)) replyMap.set(pId, []);
      replyMap.get(pId).push(reply);
    }

    const formatted = rootComments.map((rc) => {
      const rcReplies = replyMap.get(rc._id.toString()) || [];
      return formatComment(rc, req.userId, rcReplies);
    });

    return res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const postId = req.params.post_id || req.params.postId;
    const { content, parent } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ detail: 'Post not found.' });
    }

    let parentComment = null;
    if (parent) {
      parentComment = await Comment.findById(parent);
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.userId,
      content: content.trim(),
      parent: parentComment ? parentComment._id : null,
    });

    await comment.populate({ path: 'author', populate: { path: 'profile' } });

    // Trigger notification
    if (parentComment && parentComment.author.toString() !== req.userId) {
      await createNotification({
        recipient: parentComment.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });
    } else if (!parentComment && post.author.toString() !== req.userId) {
      await createNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });
    }

    const formatted = formatComment(comment, req.userId, []);
    return res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

export default {
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
};
