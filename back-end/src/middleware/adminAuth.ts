import type { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import AppDataSource from '../database/data-source.ts';
import { UserRoles } from '../entities/user-roles.entity.ts';
import { authenticateAuth } from './auth.ts';
import userService from '../services/userService.ts';
import { formatErrorResponse } from '../utils/responseFormatter.ts';

/**
 * Middleware que requiere que el usuario tenga rol de administrador
 * Primero verifica autenticación, luego verifica rol admin en user_roles
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Primero verificar autenticación
  authenticateAuth(req, res, async () => {
    if (!req.user || !req.user.sub) {
      res.status(401).json(formatErrorResponse('User not authenticated', 401));
      return;
    }

    try {
      // Obtener el usuario de la base de datos
      const user = await userService.findBySub(req.user.sub);
      
      if (!user) {
        res.status(401).json(formatErrorResponse('User not found', 401));
        return;
      }

      // Verificar si el usuario tiene rol de admin
      const userRolesRepository = AppDataSource.getRepository(UserRoles);
      const adminRole = await userRolesRepository.findOne({
        where: {
          userId: user.id,
          roleId: 'admin',
        },
      });

      if (!adminRole) {
        res.status(403).json(formatErrorResponse('Admin access required', 403));
        return;
      }

      // Usuario es admin, continuar
      next();
    } catch (error) {
      console.error('Error checking admin role:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  });
};

export default { requireAdmin };

