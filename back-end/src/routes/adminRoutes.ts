import express from 'express';
import adminController from '../controllers/adminController.ts';
import metricsController from '../controllers/metricsController.ts';
import { requireAdmin, requireSuperAdmin } from '../middleware/adminAuth.ts';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname?.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const ac = adminController;

// User routes
router.get('/users', requireAdmin, ac.getUserList.bind(ac));
router.post('/users/upload-csv', requireAdmin, upload.single('csv'), ac.uploadCSV.bind(ac));
router.get('/users/status', requireAdmin, ac.getUserStatus.bind(ac));
router.get('/users/:userId/details', requireAdmin, ac.getUserDetails.bind(ac));
router.patch('/users/:userId/enabled', requireAdmin, ac.updateUserEnabled.bind(ac));
router.put('/users/:userId/roles', requireSuperAdmin, ac.updateUserRoles.bind(ac));

// Guide routes
router.get('/guides', requireAdmin, ac.getGuides.bind(ac));
router.post('/guides', requireAdmin, ac.createGuide.bind(ac));
router.patch('/guides/:guideNumber', requireAdmin, ac.updateGuide.bind(ac));
router.delete('/guides/:guideNumber', requireAdmin, ac.deleteGuide.bind(ac));
router.post('/guides/:guideNumber/exercises', requireAdmin, ac.createExercise.bind(ac));
router.patch('/guides/:guideNumber/exercises/:exerciseNumber', requireAdmin, ac.updateExercise.bind(ac));
router.delete('/guides/:guideNumber/exercises/:exerciseNumber', requireAdmin, ac.deleteExercise.bind(ac));

// Metrics routes
const mc = metricsController;
router.get('/metrics/progress', requireAdmin, mc.getProgressByStudent.bind(mc));
router.get('/metrics/resolution-time', requireAdmin, mc.getAvgResolutionTime.bind(mc));
router.get('/metrics/attempts', requireAdmin, mc.getAvgAttemptsByExercise.bind(mc));
router.get('/metrics/active-students', requireAdmin, mc.getActiveStudentsLast7Days.bind(mc));
router.get('/metrics/error-rate', requireAdmin, mc.getExercisesWithHighestErrorRate.bind(mc));
router.get('/metrics/at-risk', requireAdmin, mc.getStudentsAtRisk.bind(mc));
router.get('/metrics/progress-distribution', requireAdmin, mc.getProgressDistribution.bind(mc));
router.get('/metrics/weekly-activity', requireAdmin, mc.getWeeklyActivityEvolution.bind(mc));
router.get('/metrics/completion-matrix', requireAdmin, mc.getExerciseCompletionMatrix.bind(mc));

export default router;
