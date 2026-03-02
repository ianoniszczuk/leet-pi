import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddHasTestFileToExercise1772245234877 implements MigrationInterface {
    name = 'AddHasTestFileToExercise1772245234877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercises" ADD "has_test_file" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "has_test_file"`);
    }
}
