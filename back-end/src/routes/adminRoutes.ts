import express from 'express';
import adminController from '../controllers/adminController.ts';
import { requireAdmin } from '../middleware/adminAuth.ts';
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
router.post('/users/upload-csv', requireAdmin, upload.single('csv'), ac.uploadCSV.bind(ac));
router.get('/users/status', requireAdmin, ac.getUserStatus.bind(ac));
router.put('/users/:userId/roles', requireAdmin, ac.updateUserRoles.bind(ac));

// Guide routes
router.get('/guides', requireAdmin, ac.getGuides.bind(ac));
router.post('/guides', requireAdmin, ac.createGuide.bind(ac));
router.patch('/guides/:guideNumber', requireAdmin, ac.updateGuide.bind(ac));
router.delete('/guides/:guideNumber', requireAdmin, ac.deleteGuide.bind(ac));
router.post('/guides/:guideNumber/exercises', requireAdmin, ac.createExercise.bind(ac));
router.patch('/guides/:guideNumber/exercises/:exerciseNumber', requireAdmin, ac.updateExercise.bind(ac));
router.delete('/guides/:guideNumber/exercises/:exerciseNumber', requireAdmin, ac.deleteExercise.bind(ac));

export default router;
