import {
  formatUser,
  formatPost,
  formatComment,
  formatConversation,
  formatMessage,
  formatNotification,
  formatStory,
} from '../src/utils/formatters.js';

describe('Formatters (DRF Serializer Parity)', () => {
  const dummyUser = {
    _id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    profile: {
      bio: 'Developer and traveler',
      profile_picture: 'https://example.com/pic.jpg',
      cover_picture: 'https://example.com/cover.jpg',
      website: 'https://johndoe.com',
      location: 'New York',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    },
  };

  it('formatUser should match UserSerializer schema exactly', () => {
    const formatted = formatUser(dummyUser, null, {
      followers_count: 5,
      following_count: 10,
      posts_count: 15,
      is_following: false,
    });

    expect(formatted).toEqual({
      id: dummyUser._id,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      profile: {
        bio: 'Developer and traveler',
        profile_picture: 'https://example.com/pic.jpg',
        cover_picture: 'https://example.com/cover.jpg',
        website: 'https://johndoe.com',
        location: 'New York',
        created_at: dummyUser.profile.createdAt,
        updated_at: dummyUser.profile.updatedAt,
      },
      followers_count: 5,
      following_count: 10,
      posts_count: 15,
      is_following: false,
    });
  });

  it('formatPost should match PostSerializer schema exactly', () => {
    const dummyPost = {
      _id: 'post-123',
      author: dummyUser,
      content: 'Hello World post!',
      media: 'https://example.com/media.jpg',
      media_type: 'image',
      createdAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date('2026-01-03T00:00:00Z'),
    };

    const formatted = formatPost(dummyPost, 'viewer-id', {
      likes_count: 42,
      comments_count: 7,
      is_liked: true,
      is_saved: false,
    });

    expect(formatted.id).toBe('post-123');
    expect(formatted.content).toBe('Hello World post!');
    expect(formatted.media).toBe('https://example.com/media.jpg');
    expect(formatted.media_type).toBe('image');
    expect(formatted.likes_count).toBe(42);
    expect(formatted.comments_count).toBe(7);
    expect(formatted.is_liked).toBe(true);
    expect(formatted.is_saved).toBe(false);
    expect(formatted.author_detail.username).toBe('testuser');
  });

  it('formatComment should format root comments and nested replies', () => {
    const dummyComment = {
      _id: 'comment-root',
      post: 'post-123',
      author: dummyUser,
      content: 'Root comment here',
      parent: null,
      createdAt: new Date(),
    };

    const dummyReply = {
      _id: 'comment-reply',
      post: 'post-123',
      author: dummyUser,
      content: 'Nested reply here',
      parent: 'comment-root',
      createdAt: new Date(),
    };

    const formatted = formatComment(dummyComment, null, [dummyReply]);

    expect(formatted.id).toBe('comment-root');
    expect(formatted.parent).toBeNull();
    expect(formatted.replies.length).toBe(1);
    expect(formatted.replies[0].id).toBe('comment-reply');
    expect(formatted.replies[0].parent).toBe('comment-root');
    expect(formatted.replies[0].content).toBe('Nested reply here');
  });

  it('formatNotification should format notification and create post preview', () => {
    const dummyNotification = {
      _id: 'notif-1',
      recipient: 'user-recip',
      sender: dummyUser,
      type: 'like',
      post: {
        _id: 'post-1',
        content: 'Short content',
      },
      is_read: false,
      createdAt: new Date(),
    };

    const formatted = formatNotification(dummyNotification, 'user-recip');

    expect(formatted.id).toBe('notif-1');
    expect(formatted.type).toBe('like');
    expect(formatted.sender_detail.username).toBe('testuser');
    expect(formatted.post_content_preview).toBe('Short content');
    expect(formatted.is_read).toBe(false);
  });

  it('formatStory should format story details and views', () => {
    const dummyStory = {
      _id: 'story-1',
      author: dummyUser,
      media: 'https://example.com/story.mp4',
      media_type: 'video',
      createdAt: new Date(),
      expires_at: new Date(Date.now() + 86400000),
    };

    const formatted = formatStory(dummyStory, 'viewer-id', {
      viewers_count: 10,
      is_viewed: true,
    });

    expect(formatted.id).toBe('story-1');
    expect(formatted.media_type).toBe('video');
    expect(formatted.viewers_count).toBe(10);
    expect(formatted.is_viewed).toBe(true);
    expect(formatted.author_detail.username).toBe('testuser');
  });
});
