import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Post from './src/models/Post.js';
import Like from './src/models/Like.js';
import Comment from './src/models/Comment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibehub';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to migrate`);

    for (const post of posts) {
      const likes_count = await Like.countDocuments({ post: post._id });
      const comments_count = await Comment.countDocuments({ post: post._id });

      await Post.updateOne(
        { _id: post._id },
        { $set: { likes_count, comments_count } }
      );
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrate();
