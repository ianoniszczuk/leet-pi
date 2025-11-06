import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import csvUserService from '../services/csvUserService.ts';
import userService from '../services/userService.ts';
import userDAO from '../persistence/user.dao.ts';

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
}

export default new AdminController();

