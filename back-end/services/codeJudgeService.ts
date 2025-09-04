import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/config.ts'

class CodeJudgeService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: config.codeJudge.url,
      timeout: config.codeJudge.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async submitSolution(exerciseNumber: number, code: string) {
    try {
      const submissionId = uuidv4();

      const payload = {
        submissionId,
        exerciseNumber,
        code,
        language: 'c',
        timestamp: new Date().toISOString(),
      };

      console.log(`Submitting solution for exercise ${exerciseNumber} with ID: ${submissionId}`);

      const response = await this.client.post('/evaluate', payload);

      return {
        success: true,
        submissionId,
        results: response.data,
      };
    } catch (error: any) {
      console.error('Error submitting solution to code judge:', error.message);

      if (error.code === 'ECONNREFUSED') {
        throw new Error('Code judge service is unavailable');
      }

      if (error.response) {
        throw new Error(`Code judge error: ${error.response.data.message || 'Unknown error'}`);
      }

      throw new Error('Failed to communicate with code judge service');
    }
  }

  async getSubmissionStatus(submissionId: number) {
    try {
      const response = await this.client.get(`/status/${submissionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting submission status:', error.message);
      throw new Error('Failed to get submission status');
    }
  }
}

export default new CodeJudgeService();
