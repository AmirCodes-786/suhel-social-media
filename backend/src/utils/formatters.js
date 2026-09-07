import Follow from '../models/Follow.js';
import Post from '../models/Post.js';
import Profile from '../models/Profile.js';

export const formatUser = (user, currentUserId = null, counts = {}) => {
  if (!user) return null;

  const id = (user._id || user.id || '').toString();
  const profile = user.profile || {};

  return {
    id,
    username: user.username || '',
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    profile: {
      bio: profile.bio || '',
      profile_picture: profile.profile_picture || null,
      cover_picture: profile.cover_picture || null,
      website: profile.website || '',
      location: profile.location || '',
      created_at: profile.createdAt || profile.created_at,
      updated_at: profile.updatedAt || profile.updated_at,
    },
    followers_count: counts.followers_count ?? 0,
    following_count: counts.following_count ?? 0,
    posts_count: counts.posts_count ?? 0,
    is_following: Boolean(counts.is_following ?? false),
  };
};

export const populateUserCounts = async (userDoc, currentUserId = null) => {
  if (!userDoc) return null;
  const userId = (userDoc._id || userDoc.id).toString();

  const [followersCount, followingCount, postsCount, isFollowingDoc] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
    Post.countDocuments({ author: userId }),
    currentUserId && currentUserId !== userId
      ? Follow.findOne({ follower: currentUserId, following: userId })
      : null,
  ]);

  let profile = userDoc.profile;
  if (!profile) {
    profile = await Profile.findOne({ user: userId });
  }

  const userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  userObj.profile = profile ? (profile.toObject ? profile.toObject() : profile) : {};

  return formatUser(userObj, currentUserId, {
    followers_count: followersCount,
    following_count: followingCount,
    posts_count: postsCount,
    is_following: Boolean(isFollowingDoc),
  });
};

export const formatPost = (post, currentUserId = null, extra = {}) => {
  if (!post) return null;

  const id = (post._id || post.id).toString();
  const authorObj = post.author && typeof post.author === 'object' ? post.author : null;
  const authorId = authorObj ? (authorObj._id || authorObj.id).toString() : (post.author || '').toString();

  return {
    id,
    author: authorId,
    author_detail: authorObj ? formatUser(authorObj, currentUserId, extra.authorCounts || {}) : null,
    content: post.content || '',
    media: post.media || null,
    media_type: post.media_type || 'text',
    likes_count: extra.likes_count ?? (Array.isArray(post.likes) ? post.likes.length : 0),
    comments_count: extra.comments_count ?? (Array.isArray(post.comments) ? post.comments.length : 0),
    is_liked: Boolean(extra.is_liked ?? false),
    is_saved: Boolean(extra.is_saved ?? false),
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
};

export const formatComment = (comment, currentUserId = null, replies = []) => {
  if (!comment) return null;

  const id = (comment._id || comment.id).toString();
  const authorObj = comment.author && typeof comment.author === 'object' ? comment.author : null;
  const authorId = authorObj ? (authorObj._id || authorObj.id).toString() : (comment.author || '').toString();

  return {
    id,
    post: comment.post ? (comment.post._id || comment.post).toString() : null,
    author: authorId,
    author_detail: authorObj ? formatUser(authorObj, currentUserId) : null,
    content: comment.content || '',
    parent: comment.parent ? (comment.parent._id || comment.parent).toString() : null,
    replies: replies.map((r) => formatComment(r, currentUserId)),
    created_at: comment.createdAt,
  };
};

export const formatMessage = (message, currentUserId = null) => {
  if (!message) return null;

  const id = (message._id || message.id).toString();
  const senderObj = message.sender && typeof message.sender === 'object' ? message.sender : null;
  const senderId = senderObj ? (senderObj._id || senderObj.id).toString() : (message.sender || '').toString();

  return {
    id,
    conversation: message.conversation ? (message.conversation._id || message.conversation).toString() : null,
    sender: senderId,
    sender_detail: senderObj ? formatUser(senderObj, currentUserId) : null,
    content: message.content || '',
    media: message.media || null,
    media_type: message.media_type || 'text',
    is_read: Boolean(message.is_read),
    created_at: message.createdAt,
  };
};

export const formatConversation = (conversation, currentUserId = null, extra = {}) => {
  if (!conversation) return null;

  const id = (conversation._id || conversation.id).toString();
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];

  return {
    id,
    participants: participants.map((p) => (typeof p === 'object' ? (p._id || p.id).toString() : p.toString())),
    participants_detail: participants
      .filter((p) => typeof p === 'object')
      .map((p) => formatUser(p, currentUserId)),
    unread_count: extra.unread_count ?? 0,
    last_message: extra.last_message ? formatMessage(extra.last_message, currentUserId) : null,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
};

export const formatNotification = (notification, currentUserId = null) => {
  if (!notification) return null;

  const id = (notification._id || notification.id).toString();
  const senderObj = notification.sender && typeof notification.sender === 'object' ? notification.sender : null;
  const senderId = senderObj ? (senderObj._id || senderObj.id).toString() : (notification.sender || '').toString();

  let postContentPreview = null;
  if (notification.post && typeof notification.post === 'object' && notification.post.content) {
    const raw = notification.post.content;
    postContentPreview = raw.length > 40 ? `${raw.slice(0, 40)}...` : raw;
  }

  return {
    id,
    recipient: notification.recipient ? (notification.recipient._id || notification.recipient).toString() : null,
    sender: senderId,
    sender_detail: senderObj ? formatUser(senderObj, currentUserId) : null,
    type: notification.type,
    post: notification.post ? (notification.post._id || notification.post).toString() : null,
    comment: notification.comment ? (notification.comment._id || notification.comment).toString() : null,
    post_content_preview: postContentPreview,
    is_read: Boolean(notification.is_read),
    created_at: notification.createdAt,
  };
};

export const formatStory = (story, currentUserId = null, extra = {}) => {
  if (!story) return null;

  const id = (story._id || story.id).toString();
  const authorObj = story.author && typeof story.author === 'object' ? story.author : null;
  const authorId = authorObj ? (authorObj._id || authorObj.id).toString() : (story.author || '').toString();

  return {
    id,
    author: authorId,
    author_detail: authorObj ? formatUser(authorObj, currentUserId) : null,
    media: story.media,
    media_type: story.media_type || 'image',
    viewers_count: extra.viewers_count ?? 0,
    is_viewed: Boolean(extra.is_viewed ?? false),
    created_at: story.createdAt,
    expires_at: story.expires_at,
  };
};
