import type { NextFunction, Request, Response } from 'express';
import codeJudgeService from '../services/codeJudgeService.ts'

class SubmissionController {
  async submitSolution(req: Request, res: Response, next: NextFunction) {
    try {
      const { exerciseNumber, code } = req.body;

      console.log(`Received submission for exercise ${exerciseNumber}`);

      // Submit to code judge
      const result = await codeJudgeService.submitSolution(exerciseNumber, code);

      // Process and format the response
      const response = this.formatEvaluationResponse(result);

      res.status(200).json({
        success: true,
        message: 'Solution submitted successfully',
        data: response,
      });

    } catch (error) {
      next(error);
    }
  }

  async getSubmissionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      const status = await codeJudgeService.getSubmissionStatus(parseInt(submissionId || "")); // @TODO: revisar

      res.status(200).json({
        success: true,
        data: status,
      });

    } catch (error) {
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
