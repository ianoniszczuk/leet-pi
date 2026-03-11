import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailSchedules1772553600002 implements MigrationInterface {
    name = 'AddEmailSchedules1772553600002';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "email_schedules" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" varchar NOT NULL,
                "date" date NOT NULL,
                "is_sent" boolean NOT NULL DEFAULT false
            )
        `);
        await queryRunner.query(`
            INSERT INTO "app_settings" ("key", "value") VALUES
              ('guideAlertEnabled', 'false'),
              ('guideAlertPeriodBeforeSend', '3')
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "app_settings" WHERE "key" IN ('guideAlertEnabled', 'guideAlertPeriodBeforeSend')`);
        await queryRunner.query(`DROP TABLE "email_schedules"`);
    }
}
