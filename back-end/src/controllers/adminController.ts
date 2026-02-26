import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import csvUserService from '../services/csvUserService.ts';
import userService from '../services/userService.ts';
import userDAO from '../persistence/user.dao.ts';
import AppDataSource from '../database/data-source.ts';
import { UserRoles } from '../entities/user-roles.entity.ts';
import { Roles } from '../entities/roles.enum.ts';
import { Guide } from '../entities/guide.entity.ts';
import { Exercise } from '../entities/exercise.entity.ts';

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function rejectBadGuideNumber(res: Response): void {
  res.status(400).json(formatErrorResponse('Guide number must be a positive integer', 400));
}

function rejectBadExerciseNumber(res: Response): void {
  res.status(400).json(formatErrorResponse('Exercise number must be a positive integer', 400));
}

export class AdminController {
  /**
   * Maneja la carga y procesamiento de un archivo CSV para habilitar/deshabilitar usuarios
   */
  async uploadCSV(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json(formatErrorResponse('No file uploaded', 400));
        return;
      }

      if (!file.mimetype || !file.mimetype.includes('csv') && !file.originalname?.endsWith('.csv')) {
        res.status(400).json(formatErrorResponse('File must be a CSV file', 400));
        return;
      }

      const csvContent = file.buffer.toString('utf-8');

      if (!csvContent || csvContent.trim().length === 0) {
        res.status(400).json(formatErrorResponse('CSV file is empty', 400));
        return;
      }

      const result = await csvUserService.syncUsersFromCSV(csvContent);

      const response = {
        enabled: result.enabledCount,
        disabled: result.disabledCount,
        created: result.createdCount,
        totalProcessed: result.totalProcessed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      };

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

      res.status(200).json(formatSuccessResponse({
        total: allUsers.length,
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

  /**
   * Devuelve todas las guías con todos sus ejercicios (sin filtros)
   */
  async getGuides(req: Request, res: Response): Promise<void> {
    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const guides = await guideRepository.find({
        relations: ['exercises'],
        order: { guideNumber: 'ASC' },
      });

      const result = guides.map((g) => ({
        guideNumber: g.guideNumber,
        enabled: g.enabled,
        deadline: g.deadline,
        exercises: (g.exercises ?? [])
          .sort((a, b) => a.exerciseNumber - b.exerciseNumber)
          .map((e) => ({
            guideNumber: e.guideNumber,
            exerciseNumber: e.exerciseNumber,
            enabled: e.enabled,
          })),
      }));

      res.status(200).json(formatSuccessResponse(result, 'Guides retrieved successfully'));
    } catch (error) {
      console.error('Error getting guides:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Crea una nueva guía
   */
  async createGuide(req: Request, res: Response): Promise<void> {
    const { guideNumber, enabled, deadline } = req.body ?? {};

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }

    let parsedDeadline: Date | null = null;
    if (deadline !== undefined && deadline !== null) {
      const deadlineDate = new Date(deadline);
      if (Number.isNaN(deadlineDate.valueOf())) {
        res.status(400).json(formatErrorResponse('Deadline must be a valid date', 400));
        return;
      }
      parsedDeadline = deadlineDate;
    }

    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const existing = await guideRepository.findOne({ where: { guideNumber: parsedGuideNumber } });

      if (existing) {
        res.status(409).json(formatErrorResponse('Guide already exists', 409));
        return;
      }

      const guide = guideRepository.create({
        guideNumber: parsedGuideNumber,
        enabled: typeof enabled === 'boolean' ? enabled : false,
        deadline: parsedDeadline,
      });

      const savedGuide = await guideRepository.save(guide);

      res.status(201).json(formatSuccessResponse({
        guideNumber: savedGuide.guideNumber,
        enabled: savedGuide.enabled,
        deadline: savedGuide.deadline,
      }, 'Guide created successfully'));
    } catch (error) {
      console.error('Error creating guide:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Actualiza el estado habilitado y/o deadline de una guía
   */
  async updateGuide(req: Request, res: Response): Promise<void> {
    const { guideNumber } = req.params;
    const { enabled, deadline } = req.body ?? {};

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }

    if (enabled === undefined && deadline === undefined) {
      res.status(400).json(formatErrorResponse('At least one of enabled or deadline must be provided', 400));
      return;
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      res.status(400).json(formatErrorResponse('Enabled must be a boolean value', 400));
      return;
    }

    let parsedDeadline: Date | null | undefined;
    if (deadline === null) {
      parsedDeadline = null;
    } else if (deadline !== undefined) {
      const deadlineDate = new Date(deadline);
      if (Number.isNaN(deadlineDate.valueOf())) {
        res.status(400).json(formatErrorResponse('Deadline must be a valid date', 400));
        return;
      }
      parsedDeadline = deadlineDate;
    }

    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const guide = await guideRepository.findOne({ where: { guideNumber: parsedGuideNumber } });

      if (!guide) {
        res.status(404).json(formatErrorResponse('Guide not found', 404));
        return;
      }

      if (enabled !== undefined) guide.enabled = enabled;
      if (parsedDeadline !== undefined) guide.deadline = parsedDeadline;

      const savedGuide = await guideRepository.save(guide);

      res.status(200).json(formatSuccessResponse({
        guideNumber: savedGuide.guideNumber,
        enabled: savedGuide.enabled,
        deadline: savedGuide.deadline,
      }, 'Guide updated successfully'));
    } catch (error) {
      console.error('Error updating guide:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Elimina una guía por guideNumber (ejercicios se borran en cascada)
   */
  async deleteGuide(req: Request, res: Response): Promise<void> {
    const { guideNumber } = req.params;

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }

    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const guide = await guideRepository.findOne({ where: { guideNumber: parsedGuideNumber } });

      if (!guide) {
        res.status(404).json(formatErrorResponse('Guide not found', 404));
        return;
      }

      await guideRepository.remove(guide);
      res.status(200).json(formatSuccessResponse(null, 'Guide deleted successfully'));
    } catch (error) {
      console.error('Error deleting guide:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Crea un nuevo ejercicio en una guía existente
   */
  async createExercise(req: Request, res: Response): Promise<void> {
    const { guideNumber } = req.params;
    const { exerciseNumber, enabled } = req.body ?? {};

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    const parsedExerciseNumber = parsePositiveInt(exerciseNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }
    if (parsedExerciseNumber === null) { rejectBadExerciseNumber(res); return; }

    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const guide = await guideRepository.findOne({ where: { guideNumber: parsedGuideNumber } });

      if (!guide) {
        res.status(404).json(formatErrorResponse('Guide not found', 404));
        return;
      }

      const exerciseRepository = AppDataSource.getRepository(Exercise);
      const existing = await exerciseRepository.findOne({
        where: { guideNumber: parsedGuideNumber, exerciseNumber: parsedExerciseNumber },
      });

      if (existing) {
        res.status(409).json(formatErrorResponse('Exercise already exists', 409));
        return;
      }

      const exercise = exerciseRepository.create({
        guideNumber: parsedGuideNumber,
        exerciseNumber: parsedExerciseNumber,
        enabled: typeof enabled === 'boolean' ? enabled : false,
      });

      const savedExercise = await exerciseRepository.save(exercise);

      res.status(201).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
      }, 'Exercise created successfully'));
    } catch (error) {
      console.error('Error creating exercise:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Actualiza el estado habilitado de un ejercicio específico
   */
  async updateExercise(req: Request, res: Response): Promise<void> {
    const { guideNumber, exerciseNumber } = req.params;
    const { enabled } = req.body ?? {};

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    const parsedExerciseNumber = parsePositiveInt(exerciseNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }
    if (parsedExerciseNumber === null) { rejectBadExerciseNumber(res); return; }

    if (typeof enabled !== 'boolean') {
      res.status(400).json(formatErrorResponse('Enabled must be provided as a boolean', 400));
      return;
    }

    try {
      const exerciseRepository = AppDataSource.getRepository(Exercise);
      const exercise = await exerciseRepository.findOne({
        where: { guideNumber: parsedGuideNumber, exerciseNumber: parsedExerciseNumber },
      });

      if (!exercise) {
        res.status(404).json(formatErrorResponse('Exercise not found', 404));
        return;
      }

      exercise.enabled = enabled;
      const savedExercise = await exerciseRepository.save(exercise);

      res.status(200).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
      }, 'Exercise updated successfully'));
    } catch (error) {
      console.error('Error updating exercise:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Elimina un ejercicio específico por (guideNumber, exerciseNumber)
   */
  async deleteExercise(req: Request, res: Response): Promise<void> {
    const { guideNumber, exerciseNumber } = req.params;

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    const parsedExerciseNumber = parsePositiveInt(exerciseNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }
    if (parsedExerciseNumber === null) { rejectBadExerciseNumber(res); return; }

    try {
      const exerciseRepository = AppDataSource.getRepository(Exercise);
      const exercise = await exerciseRepository.findOne({
        where: { guideNumber: parsedGuideNumber, exerciseNumber: parsedExerciseNumber },
      });

      if (!exercise) {
        res.status(404).json(formatErrorResponse('Exercise not found', 404));
        return;
      }

      await exerciseRepository.remove(exercise);
      res.status(200).json(formatSuccessResponse(null, 'Exercise deleted successfully'));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }
}

export default new AdminController();
