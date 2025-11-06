import type { MigrationInterface, QueryRunner } from "typeorm";

export class MakeSubNullable1762464552974 implements MigrationInterface {
    name = 'MakeSubNullable1762464552974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "sub" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "sub" SET NOT NULL`);
    }

}

