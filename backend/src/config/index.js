import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// ── Production safety gates ──────────────────────────────────────────
// In production, critical secrets MUST come from environment variables.
// Falling back to localhost MongoDB or a hardcoded JWT secret in prod
// would silently serve empty data or be trivially exploitable.
if (isProduction) {
  if (!process.env.MONGODB_URI) {
    console.error('[VibeHub] FATAL: MONGODB_URI is not set. Cannot start in production without a database.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('[VibeHub] FATAL: JWT_SECRET is not set. Cannot start in production without a JWT secret.');
    process.exit(1);
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibehub',
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? undefined : 'vibehub-dev-only-jwt-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  supabase: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  },
  uploadDir: path.resolve(__dirname, '../../uploads'),
};

export default config;
