import express from 'express'
import submissionController from '@/controllers/submissionController.ts'
import { validateSubmission } from '@/middleware/validation.ts'

const router = express.Router();

/**
 * @route POST /api/submissions
 * @desc Submit a new solution for evaluation
 * @access Public
 */
router.post('/', validateSubmission, submissionController.submitSolution);

/**
 * @route GET /api/submissions/:submissionId/status
 * @desc Get the status of a submission
 * @access Public
 */
router.get('/:submissionId/status', submissionController.getSubmissionStatus);

export default router;
