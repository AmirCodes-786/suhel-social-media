import Story from '../models/Story.js';
import StoryViewer from '../models/StoryViewer.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { formatStory, formatUser, populateUserCounts } from '../utils/formatters.js';
import { uploadMedia } from '../services/storageService.js';

export const getStories = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const now = new Date();

    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const followedIds = follows.map((f) => f.following);
    const authorIds = [...followedIds, currentUserId];

    const stories = await Story.find({
      author: { $in: authorIds },
      expires_at: { $gt: now },
    })
      .sort({ createdAt: 1 })
      .populate({ path: 'author', populate: { path: 'profile' } });

    // Batch-query viewer counts and user viewed status for all stories at once (Eliminates N+1)
    const storyIds = stories.map((s) => s._id);

    const [viewerCounts, userViewedStories] = await Promise.all([
      StoryViewer.aggregate([
        { $match: { story: { $in: storyIds } } },
        { $group: { _id: '$story', count: { $sum: 1 } } },
      ]),
      currentUserId
        ? StoryViewer.find({ story: { $in: storyIds }, viewer: currentUserId }).select('story')
        : [],
    ]);

    const countMap = new Map(viewerCounts.map((v) => [v._id.toString(), v.count]));
    const viewedSet = new Set(userViewedStories.map((v) => v.story.toString()));

    // Group stories by author
    const groupedMap = new Map();

    for (const story of stories) {
      const authorId = (story.author._id || story.author).toString();

      if (!groupedMap.has(authorId)) {
        groupedMap.set(authorId, {
          user: formatUser(story.author, currentUserId),
          stories: [],
        });
      }

      const sId = story._id.toString();
      const viewersCount = countMap.get(sId) || 0;
      const isViewed = viewedSet.has(sId);

      groupedMap.get(authorId).stories.push(
        formatStory(story, currentUserId, {
          viewers_count: viewersCount,
          is_viewed: isViewed,
        })
      );
    }

    const groupedList = Array.from(groupedMap.values());

    // Stable sort: current user story group first
    groupedList.sort((a, b) => {
      const aIsSelf = a.user?.id === currentUserId;
      const bIsSelf = b.user?.id === currentUserId;
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;
      return 0;
    });

    return res.json(groupedList);
  } catch (error) {
    next(error);
  }
};

export const createStory = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    let { media, media_type } = req.body;
    media_type = media_type || 'image';

    if (req.file) {
      media = await uploadMedia(req.file, 'stories/media');
      if (req.file.mimetype.startsWith('video/')) {
        media_type = 'video';
      } else {
        media_type = 'image';
      }
    }

    if (!media) {
      return res.status(400).json({ error: 'Media file is required.' });
    }

    const story = await Story.create({
      author: currentUserId,
      media,
      media_type,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await story.populate({ path: 'author', populate: { path: 'profile' } });

    return res.status(201).json(
      formatStory(story, currentUserId, {
        viewers_count: 0,
        is_viewed: false,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const markStoryViewed = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const storyId = req.params.pk || req.params.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    // Do not register view for owner
    if (story.author.toString() === currentUserId) {
      return res.json({ success: true, message: 'Owner view not registered' });
    }

    await StoryViewer.findOneAndUpdate(
      { story: story._id, viewer: currentUserId },
      { story: story._id, viewer: currentUserId },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getStoryViewers = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const storyId = req.params.pk || req.params.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    // Only story author can view viewers
    if (story.author.toString() !== currentUserId) {
      return res.status(403).json({
        detail: 'Only the story creator can view the viewer list.',
      });
    }

    const viewers = await StoryViewer.find({ story: story._id }).populate({
      path: 'viewer',
      populate: { path: 'profile' },
    });

    const viewerUsers = await Promise.all(
      viewers.map((v) => populateUserCounts(v.viewer, currentUserId))
    );

    return res.json(viewerUsers.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (req, res, next) => {
  try {
    const currentUserId = (req.userId || req.user?._id || req.user?.id || '').toString();
    const storyId = req.params.pk || req.params.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ detail: 'Story not found.' });
    }

    const storyAuthorId = (story.author?._id || story.author?.id || story.author || '').toString();

    if (storyAuthorId && currentUserId && storyAuthorId !== currentUserId) {
      return res.status(403).json({
        detail: 'You can only delete your own stories.',
      });
    }

    await StoryViewer.deleteMany({ story: story._id });
    await Story.findByIdAndDelete(story._id);

    return res.status(200).json({ success: true, message: 'Story deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getStories,
  createStory,
  markStoryViewed,
  getStoryViewers,
  deleteStory,
};
