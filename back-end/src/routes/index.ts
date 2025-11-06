import express from 'express'
import submissionRoutes from './submissionRoutes.ts'
import userRoutes from './userRoutes.ts'
import authRoutes from './authRoutes.ts'
import adminRoutes from './adminRoutes.ts'

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/submissions', submissionRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
    },
  });
});

export default router;
