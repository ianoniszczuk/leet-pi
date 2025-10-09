import type { Request, Response, NextFunction } from 'express';
import codeJudgeService from '../services/codeJudgeService.ts';
import userService from '../services/userService.ts';
import AppDataSource from '../database/data-source.ts';
import { Submission } from '../entities/submission.entity.ts';
import { Exercise } from '../entities/exercise.entity.ts';
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

      // Verificar que el ejercicio existe y está habilitado
      const exerciseRepository = AppDataSource.getRepository(Exercise);
      const exercise = await exerciseRepository.findOne({
        where: {
          exerciseNumber,
          guideNumber,
          enabled: true,
        },
      });

      if (!exercise) {
        res.status(404).json(formatErrorResponse('Exercise not found or not enabled', 404));
        return;
      }

      // Submit to code judge
      const result = await codeJudgeService.submitSolution(exerciseNumber, code);

      // Process and format the response
      const response = this.formatEvaluationResponse(result);

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

  formatEvaluationResponse(result: any) { // @TOOD: corregir tipo
    const { submissionId, results } = result;

    // Extract key information from code judge response
    const {
      status,
      score,
      totalTests,
      passedTests,
      failedTests,
      compilationError,
      testResults,
      executionTime,
      memoryUsage,
    } = results;

    // Determine overall status
    let overallStatus = 'pending';
    let message = 'Evaluation in progress';

    if (compilationError) {
      overallStatus = 'compilation_error';
      message = 'Code failed to compile';
    } else if (status === 'completed') {
      if (passedTests === totalTests) {
        overallStatus = 'approved';
        message = 'All tests passed successfully';
      } else {
        overallStatus = 'failed';
        message = `Failed ${failedTests} out of ${totalTests} tests`;
      }
    }

    return {
      submissionId,
      overallStatus,
      message,
      score: score || 0,
      totalTests: totalTests || 0,
      passedTests: passedTests || 0,
      failedTests: failedTests || 0,
      compilationError: compilationError || null,
      testResults: testResults || [],
      executionTime: executionTime || null,
      memoryUsage: memoryUsage || null,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new SubmissionController();
