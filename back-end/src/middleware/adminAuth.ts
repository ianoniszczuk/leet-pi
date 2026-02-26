import type { Request, Response, NextFunction } from 'express';
import { In } from 'typeorm';
import AppDataSource from '../database/data-source.ts';
import { UserRoles } from '../entities/user-roles.entity.ts';
import { authenticateAuth } from './auth.ts';
import userService from '../services/userService.ts';
import { formatErrorResponse } from '../utils/responseFormatter.ts';

/**
 * Helper that runs authentication then checks whether the user has at least
 * one of the allowed roles. Calls next() on success, responds with 401/403 otherwise.
 */
function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    authenticateAuth(req, res, async () => {
      if (!req.user || !req.user.sub) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      try {
        const user = await userService.findBySub(req.user.sub);

        if (!user) {
          res.status(401).json(formatErrorResponse('User not found', 401));
          return;
        }

        const userRolesRepository = AppDataSource.getRepository(UserRoles);
        const matchingRole = await userRolesRepository.findOne({
          where: { userId: user.id, roleId: In(allowedRoles) },
        });

        if (!matchingRole) {
          res.status(403).json(formatErrorResponse('Insufficient permissions', 403));
          return;
        }

        next();
      } catch (error) {
        console.error('Error checking role:', error);
        res.status(500).json(formatErrorResponse('Internal server error', 500));
      }
    });
  };
}

/** Requires admin OR superadmin role. */
export const requireAdmin = requireRoles(['admin', 'superadmin']);

/** Requires superadmin role only. */
export const requireSuperAdmin = requireRoles(['superadmin']);

export default { requireAdmin, requireSuperAdmin };

