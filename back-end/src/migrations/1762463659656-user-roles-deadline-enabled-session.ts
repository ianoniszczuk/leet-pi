import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRolesDeadlineEnabledSession1762463659656 implements MigrationInterface {
    name = 'UserRolesDeadlineEnabledSession1762463659656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" character varying(50) NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "guides" ADD "deadline" TIMESTAMP NOT NULL DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "deadline"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "enabled"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
    }

}
