import api from './api';

// Helper: Upload file fallback if called directly
export const uploadFile = async (folder, file) => {
  if (!file) return null;
  // File uploads are handled directly via multipart/form-data endpoints in the Express REST backend
  return URL.createObjectURL(file);
};

// ----------------------------------------------------
// Posts Service
// ----------------------------------------------------

export const postsService = {
  // Fetch main feed posts with cursor-based pagination
  getFeed: async (currentUserId, options = {}) => {
    try {
      const params = {};
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.before = options.cursor;

      const response = await api.get('/api/posts/feed/', { params });
      const posts = Array.isArray(response.data) ? response.data : [];
      posts.hasMore = response.headers['x-has-more'] === 'true' || response.headers['x-has-more'] === true;
      posts.nextCursor = response.headers['x-next-cursor'] || null;
      return posts;
    } catch (err) {
      console.error('Error fetching feed from API:', err);
      throw err;
    }
  },

  // Fetch trending posts
  getTrending: async (currentUserId) => {
    try {
      const { data } = await api.get('/api/posts/trending/');
      return data || [];
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      return [];
    }
  },

  // Fetch posts by a specific user (by username)
  getUserPosts: async (username, currentUserId) => {
    try {
      const { data } = await api.get(`/api/posts/user/${username}/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching user posts:', err);
      throw err;
    }
  },

  // Fetch a single post by ID
  getPost: async (postId, currentUserId) => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/`);
      return data || null;
    } catch (err) {
      console.error('Error fetching single post:', err);
      return null;
    }
  },

  // Create post
  createPost: async (authorId, content, mediaFile, mediaType = 'text') => {
    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (mediaType) formData.append('media_type', mediaType);
      if (mediaFile) formData.append('media', mediaFile);

      const { data } = await api.post('/api/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}/`);
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  },

  // Like / Unlike post
  toggleLike: async (postId, userId) => {
    try {
      const { data } = await api.post(`/api/posts/${postId}/like/`);
      return data;
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  },

  // Save / Unsave post
  toggleSave: async (postId, userId) => {
    try {
      const { data } = await api.post(`/api/posts/${postId}/save/`);
      return data;
    } catch (err) {
      console.error('Error toggling save:', err);
      throw err;
    }
  },

  // Get saved posts
  getSavedPosts: async (userId) => {
    try {
      const { data } = await api.get('/api/posts/saved/');
      return data || [];
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      throw err;
    }
  },

  formatPost: (post) => post,
};

// ----------------------------------------------------
// Comments Service
// ----------------------------------------------------

export const commentsService = {
  // Fetch comments for a post
  getComments: async (postId) => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/comments/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching comments:', err);
      return [];
    }
  },

  // Add a comment or reply
  addComment: async (postId, authorId, content, parentId = null) => {
    try {
      const { data } = await api.post(`/api/posts/${postId}/comments/`, {
        content,
        parent: parentId,
      });
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  },

  formatComment: (comment) => comment,
};

// ----------------------------------------------------
// Profiles / Users Service
// ----------------------------------------------------

export const profilesService = {
  // Get single profile by username
  getProfile: async (username, currentUserId) => {
    try {
      const { data } = await api.get(`/api/users/${username}/`);
      return data || null;
    } catch (err) {
      console.error('Error getting profile:', err);
      throw err;
    }
  },

  // Update profile details and files
  updateProfile: async (userId, profileData, avatarFile, coverFile) => {
    try {
      const formData = new FormData();
      if (profileData) {
        Object.keys(profileData).forEach((key) => {
          if (key === 'profile_picture' && avatarFile) return;
          if (key === 'cover_picture' && coverFile) return;
          if (profileData[key] !== undefined && profileData[key] !== null) {
            formData.append(key, profileData[key]);
          }
        });
      }
      if (avatarFile) {
        formData.append('profile_picture', avatarFile);
      }
      if (coverFile) {
        formData.append('cover_picture', coverFile);
      }

      const { data } = await api.put('/api/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      let cleaned = query ? query.trim() : '';
      if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
      const { data } = await api.get(`/api/users/search/?q=${encodeURIComponent(cleaned)}`);
      return data || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  },

  // Get suggested creators
  getSuggestions: async (currentUserId) => {
    try {
      const { data } = await api.get('/api/users/suggestions/');
      return data || [];
    } catch (err) {
      console.error('Error getting suggestions:', err);
      return [];
    }
  },
};

// ----------------------------------------------------
// Follows Service
// ----------------------------------------------------

export const followsService = {
  // Follow/Unfollow toggle — accepts username OR user id
  toggleFollow: async (currentUserIdOrTarget, targetIdOrUndefined) => {
    // Called as toggleFollow(currentUserId, targetId) from Feed/Profile
    // or toggleFollow(targetUsername) from elsewhere
    let target = currentUserIdOrTarget;
    if (targetIdOrUndefined !== undefined) {
      // Feed/Profile call: toggleFollow(currentUserId, targetId) — use targetId
      target = targetIdOrUndefined;
    }
    try {
      const { data } = await api.post(`/api/users/${target}/follow/`);
      return data;
    } catch (err) {
      console.error('Error toggling follow:', err);
      throw err;
    }
  },

  // Get followers
  getFollowers: async (username) => {
    try {
      const { data } = await api.get(`/api/users/${username}/followers/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  },

  // Get following list
  getFollowing: async (username) => {
    try {
      const { data } = await api.get(`/api/users/${username}/following/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  },
};

// ----------------------------------------------------
// Stories Service
// ----------------------------------------------------

export const storiesService = {
  // Get active stories
  getStories: async (currentUserId) => {
    try {
      const { data } = await api.get('/api/stories/');
      return data || [];
    } catch (err) {
      console.error('Error fetching stories:', err);
      throw err;
    }
  },

  // Create story
  createStory: async (authorId, mediaFile) => {
    try {
      if (!mediaFile) throw new Error('Story media file required');
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('media_type', mediaFile.type?.startsWith('video/') ? 'video' : 'image');

      const { data } = await api.post('/api/stories/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      console.error('Error creating story:', err);
      throw err;
    }
  },

  // Mark story as viewed
  viewStory: async (storyId, viewerId) => {
    try {
      await api.post(`/api/stories/${storyId}/view/`);
      return true;
    } catch {
      return false;
    }
  },

  // Get viewers of a story
  getViewers: async (storyId) => {
    try {
      const { data } = await api.get(`/api/stories/${storyId}/viewers/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching story viewers:', err);
      return [];
    }
  },

  // Delete a story
  deleteStory: async (storyId) => {
    try {
      await api.delete(`/api/stories/${storyId}/`);
      return true;
    } catch (err) {
      console.error('Error deleting story:', err);
      throw err;
    }
  },
};

// ----------------------------------------------------
// Messages / Chat Service
// ----------------------------------------------------

export const chatService = {
  // Get active conversations list
  getConversations: async (currentUserId) => {
    try {
      const { data } = await api.get('/api/chat/conversations/');
      return (data || []).map((conv) => {
        const otherParticipant =
          conv.participants_detail?.find((p) => p.id !== currentUserId) ||
          conv.participants_detail?.[0];

        return {
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          unread_count: conv.unread_count || 0,
          last_message: conv.last_message
            ? {
                content: conv.last_message.content,
                created_at: conv.last_message.created_at,
              }
            : null,
          partner: otherParticipant
            ? {
                id: otherParticipant.id,
                username: otherParticipant.username,
                profile: {
                  profile_picture: otherParticipant.profile?.profile_picture || null,
                },
              }
            : null,
        };
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      throw err;
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId) => {
    try {
      const { data } = await api.get(`/api/chat/conversations/${conversationId}/messages/`);
      return data || [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  },

  // Send message
  sendMessage: async (conversationId, senderId, content, mediaFile = null, mediaType = 'text') => {
    try {
      let payload;
      let headers = {};

      if (mediaFile) {
        payload = new FormData();
        if (content) payload.append('content', content);
        payload.append('media_type', mediaType);
        payload.append('media', mediaFile);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { content, media_type: mediaType };
      }

      const { data } = await api.post(
        `/api/chat/conversations/${conversationId}/messages/`,
        payload,
        { headers }
      );
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  },

  // Create new conversation
  createConversation: async (participantIds) => {
    try {
      const { data } = await api.post('/api/chat/conversations/', {
        participants: participantIds,
      });
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  },

  // Mark conversation read
  markConversationRead: async (conversationId, userId) => {
    try {
      const { data } = await api.post(`/api/chat/conversations/${conversationId}/read/`);
      return data;
    } catch (err) {
      console.error('Error marking conversation read:', err);
      throw err;
    }
  },

  // Alias used by Messages page
  markAsRead: async (conversationId, userId) => {
    try {
      const { data } = await api.post(`/api/chat/conversations/${conversationId}/read/`);
      return data;
    } catch (err) {
      console.error('Error marking conversation read:', err);
      throw err;
    }
  },

  // Total unread messages count across all conversations
  getUnreadCount: async () => {
    try {
      const { data } = await api.get('/api/chat/unread-count/');
      return data?.unread_count || 0;
    } catch (err) {
      console.error('Error fetching unread message count:', err);
      return 0;
    }
  },

  // Get or create a 1-on-1 conversation
  getOrCreateConversation: async (currentUserId, otherUserId) => {
    try {
      const { data } = await api.post('/api/chat/conversations/', {
        participants: [currentUserId, otherUserId],
      });
      return data?.id || data;
    } catch (err) {
      console.error('Error getting/creating conversation:', err);
      throw err;
    }
  },

  // Delete a single message
  deleteMessage: async (messageId) => {
    try {
      await api.delete(`/api/chat/messages/${messageId}/`);
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  },

  // Clear all messages in a conversation
  clearChat: async (conversationId) => {
    try {
      const { data } = await api.delete(`/api/chat/conversations/${conversationId}/clear/`);
      return data;
    } catch (err) {
      console.error('Error clearing chat:', err);
      throw err;
    }
  },
};

// ----------------------------------------------------
// Notifications Service
// ----------------------------------------------------

export const notificationsService = {
  getNotifications: async (userId) => {
    try {
      const { data } = await api.get('/api/notifications/');
      return data || [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      throw err;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read/`);
      return true;
    } catch (err) {
      console.error('Error marking notification read:', err);
      return false;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await api.post('/api/notifications/');
      return true;
    } catch (err) {
      console.error('Error marking all notifications read:', err);
      return false;
    }
  },

  getUnreadCount: async (userId) => {
    try {
      const { data } = await api.get('/api/notifications/unread-count/');
      return data?.unread_count || 0;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  },

  createNotification: async () => {
    // Handled automatically server-side in Node backend
    return true;
  },
};

export default {
  uploadFile,
  postsService,
  commentsService,
  profilesService,
  followsService,
  storiesService,
  chatService,
  notificationsService,
};
