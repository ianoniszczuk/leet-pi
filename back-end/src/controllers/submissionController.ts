import type { Request, Response, NextFunction } from 'express';
import codeJudgeService from '../services/codeJudgeService.ts';
import userService from '../services/userService.ts';
import AppDataSource from '../database/data-source.ts';
import { Submission } from '../entities/submission.entity.ts';
import { Exercise } from '../entities/exercise.entity.ts';
import { Guide } from '../entities/guide.entity.ts';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';

class SubmissionController {
  async submitSolution(req: Request, res: Response, next: NextFunction) {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      const { exerciseNumber, guideNumber, code } = req.body;

      if (!exerciseNumber || !guideNumber || !code) {
        res.status(400).json(formatErrorResponse('Missing required fields: exerciseNumber, guideNumber, code', 400));
        return;
      }

      console.log(`Received submission for exercise ${exerciseNumber} in guide ${guideNumber} from user ${req.user.sub}`);

      // Sincronizar usuario con Auth0
      const user = await userService.syncFromAuth0(req.user);

      // Verificar que el ejercicio existe, está habilitado y no venció el deadline de su guía
      const exerciseRepository = AppDataSource.getRepository(Exercise);
      const now = new Date();

      const exercise = await exerciseRepository
        .createQueryBuilder('exercise')
        .innerJoinAndSelect('exercise.guide', 'guide')
        .where('exercise.exerciseNumber = :exerciseNumber', { exerciseNumber })
        .andWhere('exercise.guideNumber = :guideNumber', { guideNumber })
        .andWhere('exercise.enabled = :exerciseEnabled', { exerciseEnabled: true })
        .andWhere('guide.enabled = :guideEnabled', { guideEnabled: true })
        .andWhere('(guide.deadline IS NULL OR guide.deadline >= :now)', { now })
        .getOne();

      if (!exercise) {
        res.status(404).json(formatErrorResponse('Exercise not found, not enabled, or past deadline', 404));
        return;
      }

      // Submit to code judge
      const result = await codeJudgeService.submitSolution(guideNumber, exerciseNumber, code);

      // Process and format the response
      const { submissionId, results } = result;

      // Extract key information from new code judge response format
      const {
        status,
        compilation,
        execution,
        score,
        executionTime,
        memoryUsage,
      } = results;

      // Determine overall status
      let overallStatus = 'pending';
      let message = 'Evaluation in progress';

      if (compilation && !compilation.success) {
        overallStatus = 'compilation_error';
        message = 'Code failed to compile';
      } else if (status === 'completed' && execution) {
        if (execution.passedTests === execution.totalTests) {
          overallStatus = 'approved';
          message = 'All tests passed successfully';
        } else {
          overallStatus = 'failed';
          message = `Failed ${execution.failedTests} out of ${execution.totalTests} tests`;
        }
      } else if (status === 'timeout') {
        overallStatus = 'failed';
        message = 'Execution timeout';
      } else if (status === 'error') {
        overallStatus = 'failed';
        message = 'Execution error';
      }

      const response = {
        submissionId,
        overallStatus,
        message,
        score: score || 0,
        totalTests: execution?.totalTests || 0,
        passedTests: execution?.passedTests || 0,
        failedTests: execution?.failedTests || 0,
        compilationError: compilation?.errors || null,
        testResults: execution?.testResults || [],
        executionTime: executionTime || null,
        memoryUsage: memoryUsage || null,
        timestamp: new Date().toISOString(),
      };

      // Guardar submission en la base de datos
      const submissionRepository = AppDataSource.getRepository(Submission);
      const submission = new Submission();
      submission.userId = user.id;
      submission.guideNumber = guideNumber;
      submission.exerciseNumber = exerciseNumber;
      submission.code = code;
      submission.success = response.overallStatus === 'approved';
      submission.createdAt = new Date();

      await submissionRepository.save(submission);

      res.status(200).json(formatSuccessResponse({
        ...response,
        submissionId: submission.createdAt.getTime(), // Usar timestamp como ID único
      }, 'Solution submitted successfully'));

    } catch (error) {
      console.error('Error submitting solution:', error);
      next(error);
    }
  }

  async getSubmissionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      const status = await codeJudgeService.getSubmissionStatus(parseInt(submissionId || "")); // @TODO: revisar

      res.status(200).json(formatSuccessResponse(status, 'Submission status retrieved successfully'));

    } catch (error) {
      next(error);
    }
  }

  async getUserSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      // Sincronizar usuario con Auth0
      const user = await userService.syncFromAuth0(req.user);

      // Obtener submissions del usuario
      const submissionRepository = AppDataSource.getRepository(Submission);
      const submissions = await submissionRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
        relations: ['exercise'],
      });

      const submissionsData = submissions.map(submission => ({
        id: submission.createdAt.getTime(),
        guideNumber: submission.guideNumber,
        exerciseNumber: submission.exerciseNumber,
        code: submission.code,
        success: submission.success,
        createdAt: submission.createdAt,
      }));

      res.status(200).json(formatSuccessResponse(submissionsData, 'User submissions retrieved successfully'));

    } catch (error) {
      console.error('Error getting user submissions:', error);
      next(error);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction) {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json(formatErrorResponse('User not authenticated', 401));
        return;
      }

      const { submissionId } = req.params;
      const timestamp = parseInt(submissionId);

      if (isNaN(timestamp)) {
        res.status(400).json(formatErrorResponse('Invalid submission ID', 400));
        return;
      }

      // Sincronizar usuario con Auth0
      const user = await userService.syncFromAuth0(req.user);

      // Buscar submission específica
      const submissionRepository = AppDataSource.getRepository(Submission);
      const submission = await submissionRepository.findOne({
        where: {
          userId: user.id,
          createdAt: new Date(timestamp),
        },
        relations: ['exercise'],
      });

      if (!submission) {
        res.status(404).json(formatErrorResponse('Submission not found', 404));
        return;
      }

      const submissionData = {
        id: submission.createdAt.getTime(),
        guideNumber: submission.guideNumber,
        exerciseNumber: submission.exerciseNumber,
        code: submission.code,
        success: submission.success,
        createdAt: submission.createdAt,
      };

      res.status(200).json(formatSuccessResponse(submissionData, 'Submission retrieved successfully'));

    } catch (error) {
      console.error('Error getting submission by ID:', error);
      next(error);
    }
  }

  async getAvailableExercises(req: Request, res: Response, next: NextFunction) {
    try {
      const guideRepository = AppDataSource.getRepository(Guide);
      const now = new Date();

      const guides = await guideRepository
        .createQueryBuilder('guide')
        .leftJoinAndSelect(
          'guide.exercises',
          'exercise',
          'exercise.enabled = :exerciseEnabled',
          { exerciseEnabled: true },
        )
        .where('guide.enabled = :guideEnabled', { guideEnabled: true })
        .andWhere('(guide.deadline IS NULL OR guide.deadline >= :now)', { now })
        .orderBy('guide.guideNumber', 'ASC')
        .addOrderBy('exercise.exerciseNumber', 'ASC')
        .getMany();

      const guidesWithExercises = guides.map((guide) => ({
        guideNumber: guide.guideNumber,
        enabled: guide.enabled,
        exercises: (guide.exercises ?? []).map((exercise) => ({
          exerciseNumber: exercise.exerciseNumber,
          enabled: exercise.enabled,
        })),
      }));

      res.status(200).json(formatSuccessResponse(guidesWithExercises, 'Available exercises retrieved successfully'));

    } catch (error) {
      console.error('Error getting available exercises:', error);
      next(error);
    }
  }

  formatEvaluationResponse(result: any) { // @TODO: corregir tipo
    const { submissionId, results } = result;

    // Extract key information from new code judge response format
    const {
      status,
      compilation,
      execution,
      score,
      executionTime,
      memoryUsage,
    } = results;

    // Determine overall status
    let overallStatus = 'pending';
    let message = 'Evaluation in progress';

    if (compilation && !compilation.success) {
      overallStatus = 'compilation_error';
      message = 'Code failed to compile';
    } else if (status === 'completed' && execution) {
      if (execution.passedTests === execution.totalTests) {
        overallStatus = 'approved';
        message = 'All tests passed successfully';
      } else {
        overallStatus = 'failed';
        message = `Failed ${execution.failedTests} out of ${execution.totalTests} tests`;
      }
    } else if (status === 'timeout') {
      overallStatus = 'failed';
      message = 'Execution timeout';
    } else if (status === 'error') {
      overallStatus = 'failed';
      message = 'Execution error';
    }

    return {
      submissionId,
      overallStatus,
      message,
      score: score || 0,
      totalTests: execution?.totalTests || 0,
      passedTests: execution?.passedTests || 0,
      failedTests: execution?.failedTests || 0,
      compilationError: compilation?.errors || null,
      testResults: execution?.testResults || [],
      executionTime: executionTime || null,
      memoryUsage: memoryUsage || null,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new SubmissionController();
