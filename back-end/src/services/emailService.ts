import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.ts';
import AppDataSource from '../database/data-source.ts';
import { EmailSchedule } from '../entities/email-schedule.entity.ts';
import { Guide } from '../entities/guide.entity.ts';
import { Exercise } from '../entities/exercise.entity.ts';
import { User } from '../entities/user.entity.ts';
import { Try } from '../entities/try.view.ts';
import logger from '../middleware/logger.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEADLINE_ALERT_TEMPLATE = readFileSync(
  join(__dirname, '../templates/guide-deadline-alert.html'),
  'utf-8',
);

class EmailService {
  private transporter = nodemailer.createTransport({
    host: config.mailer.host,
    port: config.mailer.port,
    secure: config.mailer.secure,
    ...(config.mailer.user ? { auth: { user: config.mailer.user, pass: config.mailer.pass } } : {}),
  });

  async sendGuideDeadlineAlert(emailScheduleId: string): Promise<void> {
    const guideRepo = AppDataSource.getRepository(Guide);
    const emailScheduleRepo = AppDataSource.getRepository(EmailSchedule);
    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const userRepo = AppDataSource.getRepository(User);
    const tryRepo = AppDataSource.getRepository(Try);

    const guide = await guideRepo.findOne({ where: { pendingEmailScheduleId: emailScheduleId } });
    if (!guide) {
      logger.warn(`EmailService: no guide found for emailScheduleId ${emailScheduleId}`);
      return;
    }

    const enabledExercises = await exerciseRepo.find({
      where: { guideNumber: guide.guideNumber, enabled: true },
      order: { exerciseNumber: 'ASC' },
    });

    if (enabledExercises.length === 0) {
      logger.info(`EmailService: guide ${guide.guideNumber} has no enabled exercises, skipping alert`);
      await this.markScheduleSent(emailScheduleRepo, guide, guideRepo, emailScheduleId);
      return;
    }

    const enabledUsers = await userRepo.find({ where: { enabled: true, receiveAlerts: true } });

    const deadlineStr = guide.deadline
      ? new Date(guide.deadline).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const sendPromises: Promise<void>[] = [];

    for (const user of enabledUsers) {
      const tries = await tryRepo.find({ where: { userId: user.id, guideNumber: guide.guideNumber } });
      const solvedSet = new Set(tries.filter(t => t.success).map(t => t.exerciseNumber));

      const pendingExercises = enabledExercises.filter(e => !solvedSet.has(e.exerciseNumber));

      if (pendingExercises.length === 0) continue;

      sendPromises.push(
        this.sendAlertMailToUser(user, guide, pendingExercises, deadlineStr)
          .then(() => { logger.info(`EmailService: email sent to ${user.email} for guide ${guide.guideNumber}`) })
          .catch((err: Error) => { logger.error(`EmailService: failed to send email to ${user.email}:`, err.message) }),
      );
    }

    const results = await Promise.allSettled(sendPromises);
    const anySuccess = results.some(r => r.status === 'fulfilled');

    if (anySuccess || sendPromises.length === 0) {
      await this.markScheduleSent(emailScheduleRepo, guide, guideRepo, emailScheduleId);
    }
  }

  sendAlertMailToUser(
    user: Pick<User, 'email' | 'fullName'>,
    guide: Guide,
    pendingExercises: Exercise[],
    deadlineStr: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const exerciseRows = pendingExercises.map(e => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="background-color:#ffffff;border:1px solid #93c5fd;border-radius:6px;padding:10px 16px;">
            <span style="font-size:14px;color:#1e40af;font-weight:600;">Ejercicio ${e.exerciseNumber}</span>
            ${e.functionSignature ? `<span style="font-size:13px;color:#2563eb;margin-left:10px;font-family:monospace;">${e.functionSignature}</span>` : ''}
          </td>
        </tr>
      </table>`).join('');

    const html = DEADLINE_ALERT_TEMPLATE
      .replaceAll('{{greeting}}', user.fullName ? ` ${user.fullName}` : '')
      .replaceAll('{{guideNumber}}', String(guide.guideNumber))
      .replaceAll('{{deadlineStr}}', deadlineStr)
      .replaceAll('{{exerciseRows}}', exerciseRows)
      .replaceAll('{{appUrl}}', config.appUrl ?? '#');

    const textFallback = [
      `Hola${user.fullName ? ' ' + user.fullName : ''},`,
      '',
      `La Guía ${guide.guideNumber} vence el ${deadlineStr} y tenés los siguientes ejercicios pendientes:`,
      '',
      ...pendingExercises.map(e => `  - Ejercicio ${e.exerciseNumber}${e.functionSignature ? ` (${e.functionSignature})` : ''}`),
      '',
      '¡Mucho ánimo!',
    ].join('\n');

    return this.transporter.sendMail({
      from: config.mailer.from,
      to: user.email,
      subject: `Vencimiento próximo: Guía ${guide.guideNumber}`,
      text: textFallback,
      html,
    });
  }

  private async markScheduleSent(
    emailScheduleRepo: ReturnType<typeof AppDataSource.getRepository<EmailSchedule>>,
    guide: Guide,
    guideRepo: ReturnType<typeof AppDataSource.getRepository<Guide>>,
    emailScheduleId: string,
  ): Promise<void> {
    guide.pendingEmailScheduleId = null;
    await guideRepo.save(guide);
    await emailScheduleRepo.update(emailScheduleId, { isSent: true });
    logger.info(`EmailService: marked emailScheduleId ${emailScheduleId} as sent for guide ${guide.guideNumber}`);
  }
}

export default new EmailService();
