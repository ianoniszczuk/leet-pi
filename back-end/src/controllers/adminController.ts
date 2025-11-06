import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import csvUserService from '../services/csvUserService.ts';
import userService from '../services/userService.ts';
import userDAO from '../persistence/user.dao.ts';
import AppDataSource from '../database/data-source.ts';
import { UserRoles } from '../entities/user-roles.entity.ts';
import { Roles } from '../entities/roles.enum.ts';

export class AdminController {
  /**
   * Maneja la carga y procesamiento de un archivo CSV para habilitar/deshabilitar usuarios
   */
  async uploadCSV(req: Request, res: Response): Promise<void> {
    try {
      // Verificar que se haya subido un archivo
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json(formatErrorResponse('No file uploaded', 400));
        return;
      }

      // Verificar que sea un archivo CSV
      if (!file.mimetype || !file.mimetype.includes('csv') && !file.originalname?.endsWith('.csv')) {
        res.status(400).json(formatErrorResponse('File must be a CSV file', 400));
        return;
      }

      // Leer el contenido del archivo
      const csvContent = file.buffer.toString('utf-8');

      if (!csvContent || csvContent.trim().length === 0) {
        res.status(400).json(formatErrorResponse('CSV file is empty', 400));
        return;
      }

      // Procesar el CSV
      const result = await csvUserService.syncUsersFromCSV(csvContent);

      // Preparar respuesta
      const response = {
        enabled: result.enabledCount,
        disabled: result.disabledCount,
        created: result.createdCount,
        totalProcessed: result.totalProcessed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      };

      // Si hay errores pero también hay procesamiento exitoso, retornar 207 (Multi-Status)
      // Si solo hay errores, retornar 400
      if (result.errors.length > 0 && result.totalProcessed === 0) {
        res.status(400).json(formatErrorResponse('Error processing CSV', 400, response));
        return;
      }

      const statusCode = result.errors.length > 0 ? 207 : 200;
      res.status(statusCode).json(formatSuccessResponse(response, 'CSV processed successfully'));
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Obtiene estadísticas de usuarios habilitados/deshabilitados
   */
  async getUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const allUsers = await userDAO.findAll();
      
      const enabledCount = allUsers.filter(u => u.enabled).length;
      const disabledCount = allUsers.filter(u => !u.enabled).length;
      const totalUsers = allUsers.length;

      res.status(200).json(formatSuccessResponse({
        total: totalUsers,
        enabled: enabledCount,
        disabled: disabledCount,
      }, 'User status retrieved successfully'));
    } catch (error: any) {
      console.error('Error getting user status:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Actualiza los roles asociados a un usuario
   */
  async updateUserRoles(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { roles } = req.body ?? {};

    if (!userId) {
      res.status(400).json(formatErrorResponse('User ID is required', 400));
      return;
    }

    if (!Array.isArray(roles)) {
      res.status(400).json(formatErrorResponse('Roles must be provided as an array', 400));
      return;
    }

    if (!roles.every((role: unknown) => typeof role === 'string')) {
      res.status(400).json(formatErrorResponse('Roles must be strings', 400));
      return;
    }

    const roleList = roles as string[];
    const validRoles = new Set(Object.values(Roles));
    const invalidRoles = roleList.filter((role) => !validRoles.has(role));

    if (invalidRoles.length > 0) {
      res.status(400).json(formatErrorResponse(`Invalid roles: ${invalidRoles.join(', ')}`, 400));
      return;
    }

    const requesterSub = typeof req.user === 'object' && req.user ? (req.user as { sub?: string }).sub : undefined;

    if (!requesterSub) {
      res.status(401).json(formatErrorResponse('Requester not authenticated', 401));
      return;
    }

    try {
      const [user, requester] = await Promise.all([
        userService.findById(userId),
        userService.findBySub(requesterSub),
      ]);

      if (!user) {
        res.status(404).json(formatErrorResponse('User not found', 404));
        return;
      }

      if (!requester) {
        res.status(401).json(formatErrorResponse('Requester not found', 401));
        return;
      }

      if (requester.id === userId) {
        res.status(403).json(formatErrorResponse('You cannot modify your own roles', 403));
        return;
      }

      const targetIsAdmin = (user.userRoles ?? []).some((role) => role.roleId === Roles.ADMIN);

      if (targetIsAdmin) {
        res.status(403).json(formatErrorResponse('You cannot modify roles of another admin', 403));
        return;
      }

      const userRolesRepository = AppDataSource.getRepository(UserRoles);

      await userRolesRepository.delete({ userId });

      const uniqueRoles = Array.from(new Set(roleList));

      if (uniqueRoles.length > 0) {
        const userRoleEntities = uniqueRoles.map((roleId) =>
          userRolesRepository.create({ userId, roleId })
        );
        await userRolesRepository.save(userRoleEntities);
      }

      const updatedUser = await userService.findById(userId);
      const updatedRoles = (updatedUser?.userRoles ?? []).map((userRole) => userRole.roleId);

      res.status(200).json(formatSuccessResponse({
        userId,
        roles: updatedRoles,
      }, 'User roles updated successfully'));
    } catch (error) {
      console.error('Error updating user roles:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }
}

export default new AdminController();
