import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1757623551991 implements MigrationInterface {
    name = 'InitialSchema1757623551991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sub" character varying(255) NOT NULL, "email" character varying(50) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, CONSTRAINT "UQ_2ca016813ffcce3392b3eb8ed0c" UNIQUE ("sub"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "guides" ("guide_number" integer NOT NULL, "enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_cf013e76378c51d603d29ca1002" PRIMARY KEY ("guide_number"))`);
        await queryRunner.query(`CREATE TABLE "exercises" ("guide_number" integer NOT NULL, "exercise_number" integer NOT NULL, "enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_446b72af52957b8efb9f3369907" PRIMARY KEY ("guide_number", "exercise_number"))`);
        await queryRunner.query(`CREATE TABLE "submissions" ("user_id" uuid NOT NULL, "guide_number" integer NOT NULL, "exercise_number" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" text NOT NULL, "success" boolean NOT NULL, CONSTRAINT "PK_01c1958c5e45b0476bb6eb1878e" PRIMARY KEY ("user_id", "guide_number", "exercise_number", "created_at"))`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD CONSTRAINT "FK_148509379ee13f0e782e24dd5ab" FOREIGN KEY ("guide_number") REFERENCES "guides"("guide_number") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_fca12c4ddd646dea4572c6815a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_a3f49ab53b3119d5b378b3980c2" FOREIGN KEY ("guide_number", "exercise_number") REFERENCES "exercises"("guide_number","exercise_number") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE VIEW "tries" AS SELECT "s"."user_id" AS "user_id", "s"."guide_number" AS "guide_number", "s"."exercise_number" AS "exercise_number", bool_or("s"."success") AS "success" FROM "submissions" "s" GROUP BY "s"."user_id", "s"."guide_number", "s"."exercise_number"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","tries","SELECT \"s\".\"user_id\" AS \"user_id\", \"s\".\"guide_number\" AS \"guide_number\", \"s\".\"exercise_number\" AS \"exercise_number\", bool_or(\"s\".\"success\") AS \"success\" FROM \"submissions\" \"s\" GROUP BY \"s\".\"user_id\", \"s\".\"guide_number\", \"s\".\"exercise_number\""]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","tries","public"]);
        await queryRunner.query(`DROP VIEW "tries"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_a3f49ab53b3119d5b378b3980c2"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_fca12c4ddd646dea4572c6815a9"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP CONSTRAINT "FK_148509379ee13f0e782e24dd5ab"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
        await queryRunner.query(`DROP TABLE "guides"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
