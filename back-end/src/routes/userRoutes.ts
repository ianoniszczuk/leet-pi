import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));
router.get('/me', authenticateToken, userController.getCurrentUser.bind(userController));

// Rutas administrativas (requieren autenticación)
router.get('/', authenticateToken, userController.getAllUsers.bind(userController));
router.get('/:id', authenticateToken, userController.getUserById.bind(userController));
router.delete('/:id', authenticateToken, userController.deleteUser.bind(userController));

export default router;
