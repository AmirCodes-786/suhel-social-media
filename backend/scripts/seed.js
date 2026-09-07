import mongoose from 'mongoose';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import Profile from '../src/models/Profile.js';
import Follow from '../src/models/Follow.js';
import Post from '../src/models/Post.js';
import Like from '../src/models/Like.js';
import Comment from '../src/models/Comment.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import Story from '../src/models/Story.js';

const seed = async () => {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri);

  try {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Follow.deleteMany({}),
      Post.deleteMany({}),
      Like.deleteMany({}),
      Comment.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Story.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const user1 = await User.create({
      username: 'alice',
      email: 'alice@vibehub.com',
      password: 'Password123!',
      first_name: 'Alice',
      last_name: 'Johnson',
    });
    await Profile.create({
      user: user1._id,
      bio: 'Photography enthusiast & tech lover ✨',
      location: 'San Francisco, CA',
      website: 'https://alice.dev',
      profile_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    });

    const user2 = await User.create({
      username: 'bob',
      email: 'bob@vibehub.com',
      password: 'Password123!',
      first_name: 'Bob',
      last_name: 'Smith',
    });
    await Profile.create({
      user: user2._id,
      bio: 'Building the future of web apps 🚀',
      location: 'New York, NY',
      website: 'https://bob.io',
      profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    });

    // Follow relation
    await Follow.create({ follower: user1._id, following: user2._id });

    // Create demo posts
    const post1 = await Post.create({
      author: user2._id,
      content: 'Welcome to VibeHub on the new Node.js & MongoDB backend! 🚀⚡',
      media_type: 'text',
    });

    const post2 = await Post.create({
      author: user1._id,
      content: 'Beautiful sunset in California! 🌅',
      media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      media_type: 'image',
    });

    // Likes & comments
    await Like.create({ user: user1._id, post: post1._id });
    const rootComment = await Comment.create({
      post: post1._id,
      author: user1._id,
      content: 'Awesome migration to MERN!',
    });
    await Comment.create({
      post: post1._id,
      author: user2._id,
      content: 'Thanks Alice! Fast and reliable.',
      parent: rootComment._id,
    });

    // Conversation & Message
    const conv = await Conversation.create({
      participants: [user1._id, user2._id],
    });
    await Message.create({
      conversation: conv._id,
      sender: user1._id,
      content: 'Hey Bob, how is the new Express API running?',
    });

    // Story
    await Story.create({
      author: user1._id,
      media: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      media_type: 'image',
    });

    console.log('[Seed] Database seeded successfully!');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
