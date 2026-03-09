import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import AppDataSource from '../database/data-source.ts';
import { AppSetting } from '../entities/appSetting.entity.ts';

export class SettingsController {
  private get repo() {
    return AppDataSource.getRepository(AppSetting);
  }

  async getPublicSettings(req: Request, res: Response): Promise<void> {
    try {
      const setting = await this.repo.findOne({ where: { key: 'github_issues_url' } });
      res.json(formatSuccessResponse({ githubIssuesUrl: setting?.value ?? null }));
    } catch (error) {
      res.status(500).json(formatErrorResponse('Error fetching settings', 500));
    }
  }

  async getAllSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.repo.find();
      res.json(formatSuccessResponse(settings));
    } catch (error) {
      res.status(500).json(formatErrorResponse('Error fetching settings', 500));
    }
  }

  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body as { value: string | null };

      let setting = await this.repo.findOne({ where: { key } });
      if (!setting) {
        res.status(404).json(formatErrorResponse(`Setting '${key}' not found`, 404));
        return;
      }

      setting.value = value ?? null;
      await this.repo.save(setting);
      res.json(formatSuccessResponse(setting));
    } catch (error) {
      res.status(500).json(formatErrorResponse('Error updating setting', 500));
    }
  }
}

export default new SettingsController();
