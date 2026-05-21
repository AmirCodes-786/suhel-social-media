import { supabase } from './supabaseClient'

// Helper: Upload file to Supabase storage bucket 'vibehub'
export const uploadFile = async (folder, file) => {
  if (!file) return null
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload file
    const { error } = await supabase.storage
      .from('vibehub')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data } = supabase.storage
      .from('vibehub')
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error(`Error uploading to ${folder}:`, error)
    throw error
  }
}

// ----------------------------------------------------
// Posts Service
// ----------------------------------------------------

export const postsService = {
  // Fetch main feed posts
  getFeed: async (currentUserId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author_detail:profiles(*),
          likes(user_id),
          comments(id),
          saved_posts(user_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(post => postsService.formatPost(post, currentUserId))
    } catch (err) {
      console.error('Error fetching feed:', err)
      return []
    }
  },

  // Fetch posts by a specific user (by username)
  getUserPosts: async (username, currentUserId) => {
    try {
      // Find the user first
      const { data: userRow, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (userError || !userRow) return []

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author_detail:profiles(*),
          likes(user_id),
          comments(id),
          saved_posts(user_id)
        `)
        .eq('author_id', userRow.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(post => postsService.formatPost(post, currentUserId))
    } catch (err) {
      console.error('Error fetching user posts:', err)
      return []
    }
  },

  // Create post
  createPost: async (authorId, content, mediaFile, mediaType) => {
    try {
      let mediaUrl = null
      if (mediaFile) {
        mediaUrl = await uploadFile('posts', mediaFile)
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: authorId,
          content: content || '',
          media: mediaUrl,
          media_type: mediaType || 'text'
        })
        .select(`
          *,
          author_detail:profiles(*),
          likes(user_id),
          comments(id),
          saved_posts(user_id)
        `)
        .single()

      if (error) throw error
      return postsService.formatPost(data, authorId)
    } catch (err) {
      console.error('Error creating post:', err)
      throw err
    }
  },

  // Delete post
  deletePost: async (postId) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    if (error) throw error
    return true
  },

  // Like / Unlike post
  toggleLike: async (postId, userId) => {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id)
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId })
          
        // Create notification
        const { data: post } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', postId)
          .single()

        if (post && post.author_id !== userId) {
          await notificationsService.createNotification(
            post.author_id,
            userId,
            'like',
            postId
          )
        }
      }

      // Return count and new liked state
      const { data: likes } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', postId)

      const isLikedNow = (likes || []).some(l => l.user_id === userId)
      return { is_liked: isLikedNow, likes_count: (likes || []).length }
    } catch (err) {
      console.error('Error toggling like:', err)
      throw err
    }
  },

  // Save / Unsave post
  toggleSave: async (postId, userId) => {
    try {
      const { data: existingSave } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      let isSavedNow = false
      if (existingSave) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('id', existingSave.id)
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: userId })
        isSavedNow = true
      }

      return { is_saved: isSavedNow }
    } catch (err) {
      console.error('Error toggling save:', err)
      throw err
    }
  },

  // Helper to format post structure
  formatPost: (post, currentUserId) => {
    const authorDetail = {
      id: post.author_detail?.id,
      username: post.author_detail?.username || 'user',
      first_name: post.author_detail?.first_name || '',
      last_name: post.author_detail?.last_name || '',
      profile: {
        profile_picture: post.author_detail?.profile_picture || null,
        bio: post.author_detail?.bio || ''
      }
    }

    const isLiked = post.likes ? post.likes.some(l => l.user_id === currentUserId) : false
    const isSaved = post.saved_posts ? post.saved_posts.some(s => s.user_id === currentUserId) : false

    return {
      id: post.id,
      author: post.author_id,
      author_detail: authorDetail,
      content: post.content || '',
      media: post.media || null,
      media_type: post.media_type || 'text',
      created_at: post.created_at,
      likes_count: post.likes ? post.likes.length : 0,
      comments_count: post.comments ? post.comments.length : 0,
      is_liked: isLiked,
      is_saved: isSaved
    }
  }
}

// ----------------------------------------------------
// Comments Service
// ----------------------------------------------------

export const commentsService = {
  // Fetch comments for a post
  getComments: async (postId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author_detail:profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data || []).map(comment => commentsService.formatComment(comment))
    } catch (err) {
      console.error('Error fetching comments:', err)
      return []
    }
  },

  // Add a comment
  addComment: async (postId, authorId, content, parentId = null) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: authorId,
          content,
          parent_id: parentId
        })
        .select(`
          *,
          author_detail:profiles(*)
        `)
        .single()

      if (error) throw error

      // Create notification
      const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single()

      if (post && post.author_id !== authorId) {
        await notificationsService.createNotification(
          post.author_id,
          authorId,
          'comment',
          postId,
          data.id
        )
      }

      return commentsService.formatComment(data)
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    }
  },

  formatComment: (comment) => {
    return {
      id: comment.id,
      post: comment.post_id,
      author: comment.author_id,
      author_detail: {
        id: comment.author_detail?.id,
        username: comment.author_detail?.username || 'user',
        profile: {
          profile_picture: comment.author_detail?.profile_picture || null
        }
      },
      content: comment.content,
      parent: comment.parent_id,
      created_at: comment.created_at
    }
  }
}

// ----------------------------------------------------
// Profiles / Users Service
// ----------------------------------------------------

export const profilesService = {
  // Get single profile by username
  getProfile: async (username, currentUserId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error

      // Fetch follow relationship state
      const { data: isFollowingRow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
        .maybeSingle()

      // Fetch profile counts
      const [followers, following, posts] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profile.id)
      ])

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        profile: {
          bio: profile.bio || '',
          profile_picture: profile.profile_picture || null,
          cover_picture: profile.cover_picture || null,
          website: profile.website || '',
          location: profile.location || ''
        },
        followers_count: followers.count || 0,
        following_count: following.count || 0,
        posts_count: posts.count || 0,
        is_following: !!isFollowingRow
      }
    } catch (err) {
      console.error('Error getting profile:', err)
      return null
    }
  },

  // Update profile details and files
  updateProfile: async (userId, profileData, avatarFile, coverFile) => {
    try {
      let avatarUrl = profileData.profile_picture
      let coverUrl = profileData.cover_picture

      if (avatarFile) {
        avatarUrl = await uploadFile('profiles', avatarFile)
      }
      if (coverFile) {
        coverUrl = await uploadFile('profiles', coverFile)
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          bio: profileData.bio || '',
          website: profileData.website || '',
          location: profileData.location || '',
          profile_picture: avatarUrl,
          cover_picture: coverUrl
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      let cleanedQuery = query.trim()
      if (cleanedQuery.startsWith('@')) {
        cleanedQuery = cleanedQuery.substring(1)
      }

      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      const isUuid = uuidRegex.test(cleanedQuery)

      let builder = supabase.from('profiles').select('*')
      if (isUuid) {
        builder = builder.or(`id.eq.${cleanedQuery},username.ilike.%${cleanedQuery}%,first_name.ilike.%${cleanedQuery}%,last_name.ilike.%${cleanedQuery}%`)
      } else {
        builder = builder.or(`username.ilike.%${cleanedQuery}%,first_name.ilike.%${cleanedQuery}%,last_name.ilike.%${cleanedQuery}%`)
      }

      const { data, error } = await builder.limit(20)

      if (error) throw error

      return (data || []).map(p => ({
        id: p.id,
        username: p.username,
        first_name: p.first_name,
        last_name: p.last_name,
        profile: {
          profile_picture: p.profile_picture || null,
          bio: p.bio || ''
        }
      }))
    } catch (err) {
      console.error('Error searching users:', err)
      return []
    }
  },

  // Get suggested creators
  getSuggestions: async (currentUserId) => {
    try {
      // 1. Get users we already follow
      const { data: followingList } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)

      const excludedIds = [currentUserId, ...(followingList || []).map(f => f.following_id)]

      // 2. Query creators we do not follow
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludedIds.join(',')})`)
        .limit(10)

      if (error) throw error

      return (data || []).map(p => ({
        id: p.id,
        username: p.username,
        first_name: p.first_name,
        last_name: p.last_name,
        profile: {
          profile_picture: p.profile_picture || null,
          bio: p.bio || ''
        }
      }))
    } catch (err) {
      console.error('Error getting suggestions:', err)
      return []
    }
  }
}

// ----------------------------------------------------
// Follows Service
// ----------------------------------------------------

export const followsService = {
  // Follow/Unfollow toggle
  toggleFollow: async (followerId, followingId) => {
    try {
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('id', existingFollow.id)
        return { is_following: false }
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId })

        // Notify
        await notificationsService.createNotification(
          followingId,
          followerId,
          'follow'
        )
        return { is_following: true }
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      throw err
    }
  },

  // Get followers
  getFollowers: async (username) => {
    try {
      const { data: userRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (!userRow) return []

      const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userRow.id)

      if (error) throw error

      return (data || []).map(f => ({
        id: f.follower?.id,
        username: f.follower?.username,
        first_name: f.follower?.first_name,
        last_name: f.follower?.last_name,
        profile: {
          profile_picture: f.follower?.profile_picture || null,
          bio: f.follower?.bio || ''
        }
      }))
    } catch (err) {
      console.error('Error fetching followers:', err)
      return []
    }
  },

  // Get following list
  getFollowing: async (username) => {
    try {
      const { data: userRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (!userRow) return []

      const { data, error } = await supabase
        .from('follows')
        .select('following:profiles!follows_following_id_fkey(*)')
        .eq('follower_id', userRow.id)

      if (error) throw error

      return (data || []).map(f => ({
        id: f.following?.id,
        username: f.following?.username,
        first_name: f.following?.first_name,
        last_name: f.following?.last_name,
        profile: {
          profile_picture: f.following?.profile_picture || null,
          bio: f.following?.bio || ''
        }
      }))
    } catch (err) {
      console.error('Error fetching following:', err)
      return []
    }
  }
}

// ----------------------------------------------------
// Stories Service
// ----------------------------------------------------

export const storiesService = {
  // Get active stories
  getStories: async (currentUserId) => {
    try {
      // Find following IDs
      const { data: followingRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)

      const ids = [currentUserId, ...(followingRows || []).map(f => f.following_id)]

      // Get active stories
      const nowStr = new Date().toISOString()
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author_detail:profiles(*),
          story_views(viewer_id),
          story_likes(user_id),
          story_comments(*, author_detail:profiles(*))
        `)
        .in('author_id', ids)
        .gt('expires_at', nowStr)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group stories by author
      const groups = {}
      for (const story of (data || [])) {
        const authorId = story.author_id
        if (!groups[authorId]) {
          groups[authorId] = {
            user: {
              id: story.author_detail?.id,
              username: story.author_detail?.username || 'user',
              profile: {
                profile_picture: story.author_detail?.profile_picture || null
              }
            },
            stories: []
          }
        }

        const isViewed = story.story_views ? story.story_views.some(v => v.viewer_id === currentUserId) : false
        const isLiked = story.story_likes ? story.story_likes.some(l => l.user_id === currentUserId) : false

        groups[authorId].stories.push({
          id: story.id,
          media: story.media,
          media_type: story.media_type,
          created_at: story.created_at,
          expires_at: story.expires_at,
          is_viewed: isViewed,
          is_liked: isLiked,
          likes: (story.story_likes || []).map(l => l.user_id),
          viewers: (story.story_views || []).map(v => v.viewer_id),
          comments: (story.story_comments || []).map(c => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            author_detail: {
              id: c.author_detail?.id,
              username: c.author_detail?.username || 'user',
              profile: {
                profile_picture: c.author_detail?.profile_picture || null
              }
            }
          }))
        })
      }

      return Object.values(groups)
    } catch (err) {
      console.error('Error fetching stories:', err)
      return []
    }
  },

  // Create story
  createStory: async (authorId, mediaFile) => {
    try {
      if (!mediaFile) throw new Error('Story media file required')
      const mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      const mediaUrl = await uploadFile('stories', mediaFile)

      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: authorId,
          media: mediaUrl,
          media_type: mediaType
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating story:', err)
      throw err
    }
  },

  // Mark story as viewed
  viewStory: async (storyId, viewerId) => {
    try {
      await supabase
        .from('story_views')
        .insert({ story_id: storyId, viewer_id: viewerId })
        .select()
        .single()
      return true
    } catch (err) {
      // Ignore conflict
      return false
    }
  },

  // Like story
  toggleLikeStory: async (storyId, userId) => {
    try {
      const { data: existingLike } = await supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        await supabase
          .from('story_likes')
          .delete()
          .eq('id', existingLike.id)
        return { is_liked: false }
      } else {
        await supabase
          .from('story_likes')
          .insert({ story_id: storyId, user_id: userId })
        return { is_liked: true }
      }
    } catch (err) {
      console.error('Error liking story:', err)
      throw err
    }
  },

  // Comment on story
  commentStory: async (storyId, authorId, content) => {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .insert({ story_id: storyId, author_id: authorId, content })
        .select(`
          *,
          author_detail:profiles(*)
        `)
        .single()

      if (error) throw error
      return {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        author_detail: {
          id: data.author_detail?.id,
          username: data.author_detail?.username || 'user',
          profile: {
            profile_picture: data.author_detail?.profile_picture || null
          }
        }
      }
    } catch (err) {
      console.error('Error commenting story:', err)
      throw err
    }
  },

  // Get viewers of a story
  getViewers: async (storyId) => {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          viewer:profiles(*)
        `)
        .eq('story_id', storyId)

      if (error) throw error

      return (data || []).map(v => ({
        id: v.viewer?.id,
        username: v.viewer?.username,
        first_name: v.viewer?.first_name,
        last_name: v.viewer?.last_name,
        profile: {
          profile_picture: v.viewer?.profile_picture || null,
          bio: v.viewer?.bio || ''
        }
      }))
    } catch (err) {
      console.error('Error fetching story viewers:', err)
      return []
    }
  },

  // Delete story
  deleteStory: async (storyId) => {
      try {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', storyId)
        if (error) throw error
        return true
      } catch (err) {
        console.error('Error deleting story:', err)
        throw err
    }
  }
}

// ----------------------------------------------------
// Messages / Chat Service
// ----------------------------------------------------

export const chatService = {
  // Get active conversations list
  getConversations: async (currentUserId) => {
    try {
      // Get all conversation participant IDs first where currentUserId is involved
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      if (!participations || participations.length === 0) return []

      const convIds = participations.map(p => p.conversation_id)

      // Query conversations
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user:profiles(*)),
          messages(id, content, created_at, is_read, sender_id)
        `)
        .in('id', convIds)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return (data || []).map(conv => {
        // Find other partner
        const otherParticipant = conv.participants?.find(p => p.user?.id !== currentUserId)?.user

        // Compute unread messages count
        const unreadCount = conv.messages ? conv.messages.filter(m => !m.is_read && m.sender_id !== currentUserId).length : 0

        // Get last message info
        const sortedMsgs = conv.messages ? [...conv.messages].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : []
        const lastMsg = sortedMsgs[0] || null

        return {
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          unread_count: unreadCount,
          last_message: lastMsg ? {
            content: lastMsg.content,
            created_at: lastMsg.created_at
          } : null,
          partner: otherParticipant ? {
            id: otherParticipant.id,
            username: otherParticipant.username,
            profile: {
              profile_picture: otherParticipant.profile_picture || null
            }
          } : null
        }
      })
    } catch (err) {
      console.error('Error fetching conversations:', err)
      return []
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_detail:profiles(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data || []).map(m => ({
        id: m.id,
        conversation: m.conversation_id,
        sender: m.sender_id,
        sender_detail: {
          id: m.sender_detail?.id,
          username: m.sender_detail?.username || 'user',
          profile: {
            profile_picture: m.sender_detail?.profile_picture || null
          }
        },
        content: m.content || '',
        media: m.media || null,
        media_type: m.media_type || 'text',
        is_read: m.is_read,
        created_at: m.created_at
      }))
    } catch (err) {
      console.error('Error fetching messages:', err)
      return []
    }
  },

  // Send message
  sendMessage: async (conversationId, senderId, content, mediaFile) => {
    try {
      let mediaUrl = null
      let mediaType = 'text'

      if (mediaFile) {
        mediaUrl = await uploadFile('chat', mediaFile)
        mediaType = 'image'
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content || '',
          media: mediaUrl,
          media_type: mediaType
        })
        .select(`
          *,
          sender_detail:profiles(*)
        `)
        .single()

      if (error) throw error

      // Trigger notification for message
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)

      const recipient = (participants || []).find(p => p.user_id !== senderId)
      if (recipient) {
        await notificationsService.createNotification(
          recipient.user_id,
          senderId,
          'message'
        )
      }

      return {
        id: data.id,
        conversation: data.conversation_id,
        sender: data.sender_id,
        sender_detail: {
          id: data.sender_detail?.id,
          username: data.sender_detail?.username || 'user',
          profile: {
            profile_picture: data.sender_detail?.profile_picture || null
          }
        },
        content: data.content || '',
        media: data.media || null,
        media_type: data.media_type || 'text',
        is_read: data.is_read,
        created_at: data.created_at
      }
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  },

  // Get or Create conversation
  getOrCreateConversation: async (currentUserId, partnerId) => {
    try {
      // 1. Check if conversation already exists between both users
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      if (myConvs && myConvs.length > 0) {
        const myConvIds = myConvs.map(p => p.conversation_id)
        const { data: sharedConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', myConvIds)
          .eq('user_id', partnerId)

        if (sharedConvs && sharedConvs.length > 0) {
          // Conversation exists! Return it
          return sharedConvs[0].conversation_id
        }
      }

      // 2. Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single()

      if (createError) throw createError

      // 3. Add participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: currentUserId },
          { conversation_id: newConv.id, user_id: partnerId }
        ])

      return newConv.id
    } catch (err) {
      console.error('Error creating conversation:', err)
      throw err
    }
  },

  // Delete single message
  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting message:', err)
      throw err
    }
  },

  // Clear all messages in a conversation
  clearChat: async (conversationId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error clearing chat:', err)
      throw err
    }
  }
}

// ----------------------------------------------------
// Notifications Service
// ----------------------------------------------------

export const notificationsService = {
  getNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender_detail:profiles!notifications_sender_id_fkey(*),
          post_detail:posts(content)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(n => ({
        id: n.id,
        recipient: n.recipient_id,
        sender: n.sender_id,
        sender_detail: {
          id: n.sender_detail?.id,
          username: n.sender_detail?.username || 'user',
          profile: {
            profile_picture: n.sender_detail?.profile_picture || null
          }
        },
        type: n.type,
        post: n.post_id,
        post_content_preview: n.post_detail?.content || null,
        comment: n.comment_id,
        is_read: n.is_read,
        created_at: n.created_at
      }))
    } catch (err) {
      console.error('Error fetching notifications:', err)
      return []
    }
  },

  createNotification: async (recipientId, senderId, type, postId = null, commentId = null) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: senderId,
          type,
          post_id: postId,
          comment_id: commentId
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.warn('Error creating notification:', err)
      return null
    }
  },

  markAsRead: async (notifId) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)
    return true
  },

  markAllRead: async (userId) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
    return true
  },

  markAllAsRead: async (userId) => {
    return await notificationsService.markAllRead(userId)
  }
}
