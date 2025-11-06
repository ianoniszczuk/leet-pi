import express from 'express';
import adminController from '../controllers/adminController.ts';
import { requireAdmin } from '../middleware/adminAuth.ts';
import multer from 'multer';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos CSV
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname?.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Rutas protegidas con autenticación y rol admin
router.post(
  '/users/upload-csv',
  requireAdmin,
  upload.single('csv'),
  adminController.uploadCSV.bind(adminController)
);

router.get(
  '/users/status',
  requireAdmin,
  adminController.getUserStatus.bind(adminController)
);

router.put(
  '/users/:userId/roles',
  requireAdmin,
  adminController.updateUserRoles.bind(adminController)
);

router.patch(
  '/guides/:guideNumber',
  requireAdmin,
  adminController.updateGuide.bind(adminController)
);

router.patch(
  '/guides/:guideNumber/exercises/:exerciseNumber',
  requireAdmin,
  adminController.updateExercise.bind(adminController)
);

export default router;
