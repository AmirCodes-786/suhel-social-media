import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { getDbState } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import { helmetMiddleware, corsMiddleware, apiLimiter } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import storyRoutes from './routes/storyRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the first proxy (e.g. Render's load balancer) for accurate IP rate limiting
app.set('trust proxy', 1);

// Security & Performance Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression({
  threshold: 1024, // Compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

if (!config.isProduction && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for local uploads
app.use('/uploads', express.static(config.uploadDir));

// Health Check endpoint — HTTP 503 when database is unavailable
app.get('/health', (req, res) => {
  const db = getDbState();
  const isHealthy = db.status === 'connected';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: db.status,
  });
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Database Readiness Check Middleware
app.use('/api', (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  const db = getDbState();
  if (db.status !== 'connected') {
    return res.status(503).json({
      detail: 'Service Unavailable: Database connection is currently down. Please try again later.',
      error: 'Database disconnected'
    });
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
