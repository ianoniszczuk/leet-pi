import express from 'express';
import userController from '../controllers/userController.ts';
import { authenticateAuth } from '../middleware/auth.ts';

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.get('/profile', authenticateAuth, userController.getProfile.bind(userController));
router.get('/me', authenticateAuth, userController.getCurrentUser.bind(userController));

// Rutas administrativas (requieren autenticación)
router.get('/', authenticateAuth, userController.getAllUsers.bind(userController));
router.get('/:id', authenticateAuth, userController.getUserById.bind(userController));
router.delete('/:id', authenticateAuth, userController.deleteUser.bind(userController));

export default router;
