import axios from 'axios'
import FormData from 'form-data'
import { v4 as uuidv4 } from 'uuid'
import config from '@/config/config.ts'

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

  async submitSolution(guideNumber: number, exerciseNumber: number, code: string) {
    try {
      const submissionId = uuidv4();

      const payload = {
        submissionId,
        guideNumber,
        exerciseNumber,
        code,
        language: 'c',
        timeout: 5000,
        memoryLimit: 256,
        timestamp: new Date().toISOString(),
      };

      console.log(`Submitting solution for guide ${guideNumber}, exercise ${exerciseNumber} with ID: ${submissionId}`);

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

  async uploadTestFile(guideNumber: number, exerciseNumber: number, buffer: Buffer, filename: string): Promise<void> {
    try {
      const form = new FormData();
      form.append('guideNumber', String(guideNumber));
      form.append('exerciseNumber', String(exerciseNumber));
      form.append('file', buffer, { filename, contentType: 'text/plain' });

      await this.client.post('/tests/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
    } catch (error: any) {
      console.error('Error uploading test file to code judge:', error.message);

      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error('Code judge service is unavailable');
      }

      const detail = error.response?.data?.detail || error.response?.data?.message || 'Unknown error';
      throw new Error(`Failed to upload test file to code judge: ${detail}`);
    }
  }

  async deleteTestFile(guideNumber: number, exerciseNumber: number): Promise<void> {
    try {
      await this.client.delete(`/tests/${guideNumber}/${exerciseNumber}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // File was already gone — treat as success
        return;
      }

      console.error('Error deleting test file from code judge:', error.message);

      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error('Code judge service is unavailable');
      }

      const detail = error.response?.data?.detail || error.response?.data?.message || 'Unknown error';
      throw new Error(`Failed to delete test file from code judge: ${detail}`);
    }
  }

  async downloadTestFile(guideNumber: number, exerciseNumber: number): Promise<Buffer> {
    try {
      const response = await this.client.get(`/tests/${guideNumber}/${exerciseNumber}`, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Error downloading test file from code judge:', error.message);

      if (error.response?.status === 404) {
        throw new Error('Test file not found in code judge');
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error('Code judge service is unavailable');
      }

      const detail = error.response?.data?.detail || error.response?.data?.message || 'Unknown error';
      throw new Error(`Failed to download test file from code judge: ${detail}`);
    }
  }

  // Note: The new judge service is stateless and doesn't support status polling
  // Each evaluation is completed synchronously in the /evaluate endpoint
}

export default new CodeJudgeService();
