import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiveAlertsToUser1772553600004 implements MigrationInterface {
    name = 'AddReceiveAlertsToUser1772553600004';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "receive_alerts" boolean NOT NULL DEFAULT true
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "receive_alerts"`);
    }
}
