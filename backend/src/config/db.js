import mongoose from 'mongoose';
import config from './index.js';

let isConnected = false;

/**
 * Returns a safe diagnostic object about the current MongoDB connection.
 * Used by /health and startup logs. Never exposes the connection URI.
 */
export const getDbState = () => {
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return {
    readyState: mongoose.connection.readyState,
    status: stateMap[mongoose.connection.readyState] || 'unknown',
    isConnected,
  };
};

export const connectDB = async (customUri) => {
  if (isConnected) {
    return;
  }

  const uri = customUri || config.mongodbUri;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
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

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected to database');
      isConnected = true;
    });
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    if (config.isProduction) {
      process.exit(1);
    }
    // In development, allow the server to start without DB for iterative development
    // but log clearly that the database is unavailable.
    console.warn('[MongoDB] Server starting WITHOUT database connection (development mode).');
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected successfully');
};

export default connectDB;
