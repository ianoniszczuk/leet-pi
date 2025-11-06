import type { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEnabledDefaultToFalse1762464439246 implements MigrationInterface {
    name = 'ChangeEnabledDefaultToFalse1762464439246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "enabled" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "enabled" SET DEFAULT true`);
    }

}

