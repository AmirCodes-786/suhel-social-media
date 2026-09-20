import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Allow if wildcard is configured or origin matches whitelist
    if (config.cors.origin.includes('*') || config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    // In production, reject non-matching origins
    if (config.isProduction) {
      return callback(new Error(`CORS: Origin ${origin} is not allowed.`), false);
    }
    // In development, allow all origins for local testing
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Has-More', 'X-Next-Cursor', 'x-has-more', 'x-next-cursor'],
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    detail: 'Too many requests, please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    detail: 'Too many authentication attempts, please try again later.',
  },
});

export default {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter,
};
