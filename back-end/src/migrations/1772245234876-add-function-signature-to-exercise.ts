import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddFunctionSignatureToExercise1772245234876 implements MigrationInterface {
    name = 'AddFunctionSignatureToExercise1772245234876'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercises" ADD "function_signature" text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "function_signature"`);
    }

}
