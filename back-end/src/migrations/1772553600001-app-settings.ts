import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AppSettings1772553600001 implements MigrationInterface {
    name = 'AppSettings1772553600001';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "app_settings" (
                "key" varchar PRIMARY KEY,
                "value" text NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "app_settings" ("key", "value") VALUES ('github_issues_url', NULL)
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "app_settings"`);
    }
}
