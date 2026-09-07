import app from './app.js';
import config from './config/index.js';
import { connectDB, disconnectDB } from './config/db.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`[VibeHub] Server running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`[VibeHub] Health check: http://localhost:${config.port}/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[VibeHub] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('[VibeHub] HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown after 10s if hanging
      setTimeout(() => {
        console.error('[VibeHub] Forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[VibeHub] Startup failed:', error);
    process.exit(1);
  }
};

startServer();
