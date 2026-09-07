import mongoose from 'mongoose';
import config from './index.js';

let isConnected = false;

export const connectDB = async (customUri) => {
  if (isConnected) {
    return;
  }

  const uri = customUri || config.mongodbUri;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
      isConnected = false;
    });
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    if (config.isProduction) {
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected successfully');
};

export default connectDB;
