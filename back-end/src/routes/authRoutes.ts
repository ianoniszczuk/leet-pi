import express from 'express';
import authController from '../controllers/authController.ts';
import { authenticateAuth0 } from '../middleware/auth.ts';

const router = express.Router();

router.post('/login', authenticateAuth0, authController.login.bind(authController));

export default router;
