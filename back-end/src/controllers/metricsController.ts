import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import metricsService from '../services/metricsService.ts';

export class MetricsController {
    async getProgressByStudent(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getProgressByStudent();
            res.status(200).json(formatSuccessResponse(data, 'Progress by student retrieved successfully'));
        } catch (error) {
            console.error('Error getting progress by student:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getAvgResolutionTime(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getAvgResolutionTime();
            res.status(200).json(formatSuccessResponse(data, 'Average resolution time retrieved successfully'));
        } catch (error) {
            console.error('Error getting avg resolution time:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getAvgAttemptsByExercise(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getAvgAttemptsByExercise();
            res.status(200).json(formatSuccessResponse(data, 'Average attempts by exercise retrieved successfully'));
        } catch (error) {
            console.error('Error getting avg attempts by exercise:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getActiveStudentsLast7Days(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getActiveStudentsLast7Days();
            res.status(200).json(formatSuccessResponse(data, 'Active students count retrieved successfully'));
        } catch (error) {
            console.error('Error getting active students:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getExercisesWithHighestErrorRate(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getExercisesWithHighestErrorRate();
            res.status(200).json(formatSuccessResponse(data, 'Exercises with highest error rate retrieved successfully'));
        } catch (error) {
            console.error('Error getting exercise error rates:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getStudentsAtRisk(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getStudentsAtRisk();
            res.status(200).json(formatSuccessResponse(data, 'Students at risk retrieved successfully'));
        } catch (error) {
            console.error('Error getting students at risk:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getProgressDistribution(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getProgressDistribution();
            res.status(200).json(formatSuccessResponse(data, 'Progress distribution retrieved successfully'));
        } catch (error) {
            console.error('Error getting progress distribution:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getWeeklyActivityEvolution(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getWeeklyActivityEvolution();
            res.status(200).json(formatSuccessResponse(data, 'Weekly activity evolution retrieved successfully'));
        } catch (error) {
            console.error('Error getting weekly activity evolution:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }

    async getExerciseCompletionMatrix(req: Request, res: Response): Promise<void> {
        try {
            const data = await metricsService.getExerciseCompletionMatrix();
            res.status(200).json(formatSuccessResponse(data, 'Exercise completion matrix retrieved successfully'));
        } catch (error) {
            console.error('Error getting exercise completion matrix:', error);
            res.status(500).json(formatErrorResponse('Internal server error', 500));
        }
    }
}

export default new MetricsController();
