import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DeadlineNullable1740441600000 implements MigrationInterface {
  name = 'DeadlineNullable1740441600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guides" ALTER COLUMN "deadline" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guides" ALTER COLUMN "deadline" SET DEFAULT NULL`);
    await queryRunner.query(`UPDATE "guides" SET "deadline" = NULL WHERE "deadline" < NOW()`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "guides" SET "deadline" = NOW() WHERE "deadline" IS NULL`);
    await queryRunner.query(`ALTER TABLE "guides" ALTER COLUMN "deadline" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guides" ALTER COLUMN "deadline" SET DEFAULT NOW()`);
  }
}
