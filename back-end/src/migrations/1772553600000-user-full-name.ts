import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserFullName1772553600000 implements MigrationInterface {
    name = 'UserFullName1772553600000';

    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add nullable full_name column
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying(200)`);

        // 2. Populate from existing first_name / last_name
        await queryRunner.query(`
            UPDATE users
            SET full_name = NULLIF(TRIM(CONCAT_WS(' ',
                NULLIF(TRIM(first_name), ''),
                NULLIF(TRIM(last_name), '')
            )), '')
        `);

        // 3. Drop old columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Re-add first_name / last_name as nullable
        await queryRunner.query(`ALTER TABLE "users" ADD "first_name" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_name" character varying(100)`);

        // 2. Split full_name back
        await queryRunner.query(`
            UPDATE users
            SET
                first_name = SPLIT_PART(COALESCE(full_name, ''), ' ', 1),
                last_name  = NULLIF(TRIM(SUBSTR(COALESCE(full_name, ''), STRPOS(COALESCE(full_name, ''), ' ') + 1)), '')
        `);

        // 3. Drop full_name
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
    }
}
