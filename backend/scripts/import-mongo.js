import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import Profile from '../src/models/Profile.js';
import Follow from '../src/models/Follow.js';
import Post from '../src/models/Post.js';
import Like from '../src/models/Like.js';
import Comment from '../src/models/Comment.js';
import SavedPost from '../src/models/SavedPost.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import Notification from '../src/models/Notification.js';
import Story from '../src/models/Story.js';
import StoryViewer from '../src/models/StoryViewer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORT_FILE = path.join(__dirname, 'exported_data.json');

const importData = async () => {
  if (!fs.existsSync(EXPORT_FILE)) {
    console.log(`[Import] ${EXPORT_FILE} does not exist. Run export-sqlite.py first.`);
    process.exit(0);
  }

  const raw = fs.readFileSync(EXPORT_FILE, 'utf-8');
  const data = JSON.parse(raw);

  console.log('[Import] Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri);

  try {
    // 1. Import Users
    const users = data.users_user || [];
    for (const u of users) {
      await User.findOneAndUpdate(
        { _id: u.id },
        {
          _id: u.id,
          username: u.username.toLowerCase(),
          email: u.email.toLowerCase(),
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          createdAt: u.date_joined || new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Import] Users imported: ${users.length}`);

    // 2. Import Profiles
    const profiles = data.users_profile || [];
    for (const p of profiles) {
      await Profile.findOneAndUpdate(
        { user: p.user_id },
        {
          user: p.user_id,
          bio: p.bio || '',
          profile_picture: p.profile_picture || null,
          cover_picture: p.cover_picture || null,
          website: p.website || '',
          location: p.location || '',
          createdAt: p.created_at || new Date(),
          updatedAt: p.updated_at || new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Import] Profiles imported: ${profiles.length}`);

    // 3. Import Follows
    const follows = data.users_follow || [];
    for (const f of follows) {
      await Follow.findOneAndUpdate(
        { follower: f.follower_id, following: f.following_id },
        {
          follower: f.follower_id,
          following: f.following_id,
          createdAt: f.created_at || new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Import] Follows imported: ${follows.length}`);

    // Additional imports for posts, likes, comments, etc. can be expanded as data exists
    console.log('[Import] Migration completed successfully.');
  } catch (err) {
    console.error('[Import] Error importing data:', err);
  } finally {
    await mongoose.disconnect();
  }
};

importData();
