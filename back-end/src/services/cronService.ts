import cron from 'node-cron';
import { LessThanOrEqual } from 'typeorm';
import AppDataSource from '../database/data-source.ts';
import { EmailSchedule, EmailType } from '../entities/email-schedule.entity.ts';
import emailService from './emailService.ts';
import logger from '../middleware/logger.ts';

class CronService {
  start(): void {
    // Corre todos los días a las 6am
    cron.schedule('0 6 * * *', async () => {
      logger.info('CronService: running daily email schedule check');
      try {
        const emailScheduleRepo = AppDataSource.getRepository(EmailSchedule);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pending = await emailScheduleRepo.find({
          where: { date: LessThanOrEqual(today) as any, isSent: false },
        });

        logger.info(`CronService: found ${pending.length} pending email schedule(s)`);

        for (const schedule of pending) {
          if (schedule.email === EmailType.GUIDE_DEADLINE_ALERT) {
            await emailService.sendGuideDeadlineAlert(schedule.id);
          }
        }
      } catch (err) {
        logger.error('CronService: error during scheduled run:', err);
      }
    });

    logger.info('CronService: daily email cron registered (0 6 * * *)');
  }
}

export default new CronService();
