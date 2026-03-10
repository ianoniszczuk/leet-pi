import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingEmailScheduleToGuide1772553600003 implements MigrationInterface {
    name = 'AddPendingEmailScheduleToGuide1772553600003';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "guides"
            ADD COLUMN "pending_email_schedule_id" uuid NULL
            REFERENCES "email_schedules"("id") ON DELETE SET NULL
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "pending_email_schedule_id"`);
    }
}
