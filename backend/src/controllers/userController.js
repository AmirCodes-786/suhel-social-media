import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Follow from '../models/Follow.js';
import { populateUserCounts, formatUser } from '../utils/formatters.js';
import { createNotification, deleteNotification } from '../services/notificationService.js';
import { uploadMedia } from '../services/storageService.js';

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await populateUserCounts(req.user, req.userId);
    return res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    const { username, first_name, last_name, bio, website, location } = req.body;

    // Check username conflict if changing
    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = cleanUsername;
    }

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    await user.save();

    // Update Profile
    let profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      profile = new Profile({ user: user._id });
    }

    if (bio !== undefined) profile.bio = bio;
    if (website !== undefined) profile.website = website;
    if (location !== undefined) profile.location = location;

    // Handle files if uploaded via multer (e.g. profile_picture, cover_picture)
    if (req.files) {
      if (req.files.profile_picture && req.files.profile_picture[0]) {
        profile.profile_picture = await uploadMedia(req.files.profile_picture[0], 'profiles/pictures');
      }
      if (req.files.cover_picture && req.files.cover_picture[0]) {
        profile.cover_picture = await uploadMedia(req.files.cover_picture[0], 'profiles/covers');
      }
    } else if (req.file) {
      // Single file upload
      if (req.body.type === 'cover' || req.file.fieldname === 'cover_picture') {
        profile.cover_picture = await uploadMedia(req.file, 'profiles/covers');
      } else {
        profile.profile_picture = await uploadMedia(req.file, 'profiles/pictures');
      }
    }

    // Direct string URL updates if supplied in JSON
    if (req.body.profile_picture && typeof req.body.profile_picture === 'string') {
      profile.profile_picture = req.body.profile_picture;
    }
    if (req.body.cover_picture && typeof req.body.cover_picture === 'string') {
      profile.cover_picture = req.body.cover_picture;
    }

    await profile.save();
    user.profile = profile;

    const formattedUser = await populateUserCounts(user, req.userId);
    return res.json(formattedUser);
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() }).populate('profile');

    if (!user) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const formattedUser = await populateUserCounts(user, req.userId);
    return res.json(formattedUser);
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const targetUser = await User.findOne({ username: username.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const currentUserId = req.userId;
    const targetUserId = targetUser._id.toString();

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });

      // Delete corresponding notification
      await deleteNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
      });

      return res.json({
        is_following: false,
        message: `Unfollowed ${username}`,
      });
    }

    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });

    // Trigger notification
    await createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
    });

    return res.json({
      is_following: true,
      message: `Followed ${username}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const follows = await Follow.find({ following: user._id }).populate({
      path: 'follower',
      populate: { path: 'profile' },
    });

    const followerUsers = await Promise.all(
      follows.map((f) => populateUserCounts(f.follower, req.userId))
    );

    return res.json(followerUsers.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const follows = await Follow.find({ follower: user._id }).populate({
      path: 'following',
      populate: { path: 'profile' },
    });

    const followingUsers = await Promise.all(
      follows.map((f) => populateUserCounts(f.following, req.userId))
    );

    return res.json(followingUsers.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
      return res.json([]);
    }

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { first_name: regex }, { last_name: regex }],
    })
      .limit(20)
      .populate('profile');

    const formattedUsers = await Promise.all(
      users.map((u) => populateUserCounts(u, req.userId))
    );

    return res.json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

export const getCreatorSuggestions = async (req, res, next) => {
  try {
    const currentUserId = req.userId;

    // Get list of followed user IDs
    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const followedIds = follows.map((f) => f.following);

    // Exclude self and already followed users
    const excludedIds = [currentUserId, ...followedIds];

    const suggestions = await User.find({
      _id: { $nin: excludedIds },
    })
      .limit(5)
      .populate('profile');

    const formattedSuggestions = await Promise.all(
      suggestions.map((u) => populateUserCounts(u, currentUserId))
    );

    return res.json(formattedSuggestions);
  } catch (error) {
    next(error);
  }
};

export default {
  getCurrentUser,
  updateCurrentUser,
  getUserProfile,
  followUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getCreatorSuggestions,
};
