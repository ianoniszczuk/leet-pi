import type { Request, Response } from 'express';
import userService from '../services/userService.js';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.js';

export class UserController {
  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      // Sincronizar usuario con Auth0
      const user = await userService.syncFromAuth0(req.user);

      res.status(200).json(formatSuccessResponse({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        sub: user.sub,
      }, 'User profile retrieved successfully'));
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Obtiene información básica del usuario autenticado
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      // Buscar usuario existente
      let user = await userService.findBySub(req.user.sub);
      
      if (!user) {
        // Si no existe, crear desde Auth0
        user = await userService.syncFromAuth0(req.user);
      }

      res.status(200).json(formatSuccessResponse({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }, 'Current user retrieved successfully'));
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Obtiene todos los usuarios (solo para administradores)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.findAll();
      
      const usersData = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        submissionCount: user.submissions?.length || 0,
      }));

      res.status(200).json(formatSuccessResponse(usersData, 'Users retrieved successfully'));
    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Obtiene un usuario específico por ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await userService.findById(id);
      
      if (!user) {
        res.status(404).json(formatErrorResponse('User not found', 404));
        return;
      }

      res.status(200).json(formatSuccessResponse({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        submissionCount: user.submissions?.length || 0,
      }, 'User retrieved successfully'));
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Elimina un usuario (solo para administradores)
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await userService.deleteById(id);
      
      if (!deleted) {
        res.status(404).json(formatErrorResponse('User not found', 404));
        return;
      }

      res.status(200).json(formatSuccessResponse(null, 'User deleted successfully'));
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }
}

export default new UserController();
