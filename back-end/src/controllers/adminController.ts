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
import { Try } from '../entities/try.view.ts';
import { Submission } from '../entities/submission.entity.ts';
import codeJudgeService from '../services/codeJudgeService.ts';

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
   * Devuelve el listado de usuarios con búsqueda y paginación
   */
  async getUserList(req: Request, res: Response): Promise<void> {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10);

    const rawRole = typeof req.query.role === 'string' ? req.query.role : undefined;
    const role = rawRole && ['admin', 'superadmin', 'alumno'].includes(rawRole) ? rawRole : undefined;

    const rawEnabled = typeof req.query.enabled === 'string' ? req.query.enabled : undefined;
    const enabled = rawEnabled === 'true' ? true : rawEnabled === 'false' ? false : undefined;

    try {
      const { users, total, totalPages } = await userDAO.findWithSearchAndPagination(search, page, limit, role, enabled);
      const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        enabled: u.enabled,
        roles: (u.userRoles ?? []).map((r) => r.roleId),
      }));
      res.status(200).json(formatSuccessResponse({ users: result, total, page, totalPages }, 'Users retrieved successfully'));
    } catch (error) {
      console.error('Error getting user list:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Habilita o deshabilita un usuario con reglas de acceso según el rol del requester
   */
  async updateUserEnabled(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { enabled } = req.body ?? {};

    if (!userId) {
      res.status(400).json(formatErrorResponse('User ID is required', 400));
      return;
    }

    if (typeof enabled !== 'boolean') {
      res.status(400).json(formatErrorResponse('enabled must be a boolean', 400));
      return;
    }

    const requesterSub = typeof req.user === 'object' && req.user
      ? (req.user as { sub?: string }).sub
      : undefined;

    if (!requesterSub) {
      res.status(401).json(formatErrorResponse('Requester not authenticated', 401));
      return;
    }

    try {
      const [target, requester] = await Promise.all([
        userService.findById(userId),
        userService.findBySub(requesterSub),
      ]);

      if (!target) {
        res.status(404).json(formatErrorResponse('User not found', 404));
        return;
      }

      if (!requester) {
        res.status(401).json(formatErrorResponse('Requester not found', 401));
        return;
      }

      if (requester.id === userId) {
        res.status(403).json(formatErrorResponse('You cannot modify your own status', 403));
        return;
      }

      const targetRoles = (target.userRoles ?? []).map((r) => r.roleId);
      const requesterRoles = (requester.userRoles ?? []).map((r) => r.roleId);

      // Nadie puede deshabilitar a un superadmin
      if (targetRoles.includes(Roles.SUPERADMIN)) {
        res.status(403).json(formatErrorResponse('Cannot modify a superadmin', 403));
        return;
      }

      // Solo superadmin puede modificar a un admin
      if (targetRoles.includes(Roles.ADMIN) && !requesterRoles.includes(Roles.SUPERADMIN)) {
        res.status(403).json(formatErrorResponse('Only superadmin can modify an admin', 403));
        return;
      }

      const updated = await userDAO.update(userId, { enabled });

      res.status(200).json(formatSuccessResponse({
        id: updated!.id,
        email: updated!.email,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        enabled: updated!.enabled,
        roles: (updated!.userRoles ?? []).map((r) => r.roleId),
      }, 'User updated successfully'));
    } catch (error) {
      console.error('Error updating user enabled:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Actualiza los roles asociados a un usuario (solo superadmin)
   */
  async updateUserRoles(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { roles } = req.body ?? {};

    if (!userId) {
      res.status(400).json(formatErrorResponse('User ID is required', 400));
      return;
    }

    if (!Array.isArray(roles) || !roles.every((r: unknown) => typeof r === 'string')) {
      res.status(400).json(formatErrorResponse('roles must be an array of strings', 400));
      return;
    }

    const roleList = roles as string[];
    // Solo se permite asignar/quitar el rol 'admin'
    const invalidRoles = roleList.filter((r) => r !== Roles.ADMIN);
    if (invalidRoles.length > 0) {
      res.status(400).json(formatErrorResponse(`Only the 'admin' role can be assigned: invalid roles: ${invalidRoles.join(', ')}`, 400));
      return;
    }

    const requesterSub = typeof req.user === 'object' && req.user
      ? (req.user as { sub?: string }).sub
      : undefined;

    if (!requesterSub) {
      res.status(401).json(formatErrorResponse('Requester not authenticated', 401));
      return;
    }

    try {
      const [target, requester] = await Promise.all([
        userService.findById(userId),
        userService.findBySub(requesterSub),
      ]);

      if (!target) {
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

      const targetRoles = (target.userRoles ?? []).map((r) => r.roleId);

      if (targetRoles.includes(Roles.SUPERADMIN)) {
        res.status(403).json(formatErrorResponse('Cannot modify roles of a superadmin', 403));
        return;
      }

      const userRolesRepository = AppDataSource.getRepository(UserRoles);

      // Reemplazar roles (mantener superadmin si lo tuviera, aunque el check anterior lo impide)
      await userRolesRepository.delete({ userId });

      const uniqueRoles = Array.from(new Set(roleList));
      if (uniqueRoles.length > 0) {
        const entities = uniqueRoles.map((roleId) => userRolesRepository.create({ userId, roleId }));
        await userRolesRepository.save(entities);
      }

      const updatedUser = await userService.findById(userId);
      const updatedRoles = (updatedUser?.userRoles ?? []).map((r) => r.roleId);

      res.status(200).json(formatSuccessResponse({ userId, roles: updatedRoles }, 'User roles updated successfully'));
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
            functionSignature: e.functionSignature ?? null,
            hasTestFile: e.hasTestFile,
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
    const { exerciseNumber, enabled, functionSignature } = req.body ?? {};

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
        functionSignature: typeof functionSignature === 'string' && functionSignature.trim() ? functionSignature.trim() : null,
      });

      const savedExercise = await exerciseRepository.save(exercise);

      res.status(201).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
        functionSignature: savedExercise.functionSignature ?? null,
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
    const { enabled, functionSignature } = req.body ?? {};

    const parsedGuideNumber = parsePositiveInt(guideNumber);
    const parsedExerciseNumber = parsePositiveInt(exerciseNumber);
    if (parsedGuideNumber === null) { rejectBadGuideNumber(res); return; }
    if (parsedExerciseNumber === null) { rejectBadExerciseNumber(res); return; }

    if (enabled === undefined && functionSignature === undefined) {
      res.status(400).json(formatErrorResponse('At least one of enabled or functionSignature must be provided', 400));
      return;
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      res.status(400).json(formatErrorResponse('Enabled must be a boolean value', 400));
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

      if (enabled !== undefined) exercise.enabled = enabled;
      if (functionSignature !== undefined) {
        exercise.functionSignature = typeof functionSignature === 'string' && functionSignature.trim()
          ? functionSignature.trim()
          : null;
      }

      const savedExercise = await exerciseRepository.save(exercise);

      res.status(200).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
        functionSignature: savedExercise.functionSignature ?? null,
      }, 'Exercise updated successfully'));
    } catch (error) {
      console.error('Error updating exercise:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Devuelve el detalle de progreso de un usuario (ejercicios intentados y resueltos por guía)
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json(formatErrorResponse('User ID is required', 400));
      return;
    }

    try {
      const user = await userService.findById(userId);
      if (!user) {
        res.status(404).json(formatErrorResponse('User not found', 404));
        return;
      }

      const guideRepository = AppDataSource.getRepository(Guide);
      const [guides, tries, lastSub] = await Promise.all([
        guideRepository.find({ relations: ['exercises'], order: { guideNumber: 'ASC' } }),
        AppDataSource.getRepository(Try).find({ where: { userId } }),
        AppDataSource.getRepository(Submission)
          .createQueryBuilder('s')
          .select('MAX(s.createdAt)', 'lastSubmissionAt')
          .where('s.userId = :userId', { userId })
          .getRawOne(),
      ]);

      const triesMap = new Map<string, Try>();
      for (const t of tries) {
        triesMap.set(`${t.guideNumber}-${t.exerciseNumber}`, t);
      }

      const result = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        lastSubmissionAt: (lastSub?.lastSubmissionAt as string | null) ?? null,
        guides: guides.map((g) => ({
          guideNumber: g.guideNumber,
          enabled: g.enabled,
          exercises: (g.exercises ?? [])
            .sort((a, b) => a.exerciseNumber - b.exerciseNumber)
            .map((e) => {
              const t = triesMap.get(`${e.guideNumber}-${e.exerciseNumber}`);
              return {
                exerciseNumber: e.exerciseNumber,
                enabled: e.enabled,
                attempted: t !== undefined,
                solved: t?.success ?? false,
              };
            }),
        })),
      };

      res.status(200).json(formatSuccessResponse(result, 'User details retrieved successfully'));
    } catch (error) {
      console.error('Error getting user details:', error);
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

      if (exercise.hasTestFile) {
        try {
          await codeJudgeService.deleteTestFile(parsedGuideNumber, parsedExerciseNumber);
        } catch (judgeErr: any) {
          console.warn(`Could not delete test file for exercise ${parsedGuideNumber}/${parsedExerciseNumber} from code judge:`, judgeErr.message);
        }
      }

      await exerciseRepository.remove(exercise);
      res.status(200).json(formatSuccessResponse(null, 'Exercise deleted successfully'));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Sube el archivo de test harness (.c) al juez para un ejercicio
   */
  async uploadTestFile(req: Request, res: Response): Promise<void> {
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

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json(formatErrorResponse('No file uploaded', 400));
        return;
      }

      if (!file.originalname?.toLowerCase().endsWith('.c')) {
        res.status(400).json(formatErrorResponse('Only .c files are allowed', 400));
        return;
      }

      try {
        await codeJudgeService.uploadTestFile(parsedGuideNumber, parsedExerciseNumber, file.buffer, file.originalname);
      } catch (judgeErr: any) {
        res.status(502).json(formatErrorResponse(`Could not upload test file to code judge: ${judgeErr.message}`, 502));
        return;
      }

      exercise.hasTestFile = true;
      const savedExercise = await exerciseRepository.save(exercise);

      res.status(200).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
        functionSignature: savedExercise.functionSignature ?? null,
        hasTestFile: savedExercise.hasTestFile,
      }, 'Test file uploaded successfully'));
    } catch (error) {
      console.error('Error uploading test file:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Elimina el archivo de test harness del juez para un ejercicio
   */
  async deleteTestFile(req: Request, res: Response): Promise<void> {
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

      try {
        await codeJudgeService.deleteTestFile(parsedGuideNumber, parsedExerciseNumber);
      } catch (judgeErr: any) {
        res.status(502).json(formatErrorResponse(`Could not delete test file from code judge: ${judgeErr.message}`, 502));
        return;
      }

      exercise.hasTestFile = false;
      const savedExercise = await exerciseRepository.save(exercise);

      res.status(200).json(formatSuccessResponse({
        guideNumber: savedExercise.guideNumber,
        exerciseNumber: savedExercise.exerciseNumber,
        enabled: savedExercise.enabled,
        functionSignature: savedExercise.functionSignature ?? null,
        hasTestFile: savedExercise.hasTestFile,
      }, 'Test file deleted successfully'));
    } catch (error) {
      console.error('Error deleting test file:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }

  /**
   * Descarga el archivo de test harness del juez para un ejercicio
   */
  async downloadTestFile(req: Request, res: Response): Promise<void> {
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

      if (!exercise.hasTestFile) {
        res.status(404).json(formatErrorResponse('No hay archivo de test para este ejercicio', 404));
        return;
      }

      let fileBuffer: Buffer;
      try {
        fileBuffer = await codeJudgeService.downloadTestFile(parsedGuideNumber, parsedExerciseNumber);
      } catch (judgeErr: any) {
        res.status(502).json(formatErrorResponse(`Could not download test file from code judge: ${judgeErr.message}`, 502));
        return;
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="exercise-${parsedExerciseNumber}.c"`);
      res.status(200).send(fileBuffer);
    } catch (error) {
      console.error('Error downloading test file:', error);
      res.status(500).json(formatErrorResponse('Internal server error', 500));
    }
  }
}

export default new AdminController();
