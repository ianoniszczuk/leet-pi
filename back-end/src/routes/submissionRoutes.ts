import express from 'express'
import submissionController from '@/controllers/submissionController.ts'
import { validateSubmission } from '@/middleware/validation.ts'
import { authenticateAuth } from '../middleware/auth.ts'

const router = express.Router();

/**
 * @route POST /api/submissions
 * @desc Submit a new solution for evaluation
 * @access Private (requires authentication)
 */
router.post('/', authenticateAuth, validateSubmission, submissionController.submitSolution);

/**
 * @route GET /api/submissions/rankings
 * @desc Get TOP 5 rankings for an exercise (fewest attempts + earliest completion)
 * @access Private (requires authentication)
 */
router.get('/rankings', authenticateAuth, submissionController.getRankings);

/**
 * @route GET /api/submissions/:submissionId/status
 * @desc Get the status of a submission
 * @access Public
 */
router.get('/:submissionId/status', submissionController.getSubmissionStatus);

/**
 * @route GET /api/submissions/my
 * @desc Get all submissions for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/my', authenticateAuth, submissionController.getUserSubmissions);

/**
 * @route GET /api/submissions/:submissionId
 * @desc Get a specific submission by ID for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/:submissionId', authenticateAuth, submissionController.getSubmissionById);

/**
 * @route GET /api/submissions/exercises/available
 * @desc Get all available guides and exercises for submission
 * @access Public
 */
router.get('/exercises/available', submissionController.getAvailableExercises);

export default router;
