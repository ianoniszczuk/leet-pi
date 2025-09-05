import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config from '@/config/config.ts'
import routes from '@/routes/index.ts'
import logger from '@/middleware/logger.ts'
import { errorHandler } from '@/middleware/errorHandler.ts'

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Logging middleware
app.use(logger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.server.nodeEnv} mode`);
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/api/submissions`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
