import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecaoToEnvios20260528000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "envios" ADD COLUMN IF NOT EXISTS "secao" text NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "envios" DROP COLUMN IF EXISTS "secao"`,
        );
    }
}
