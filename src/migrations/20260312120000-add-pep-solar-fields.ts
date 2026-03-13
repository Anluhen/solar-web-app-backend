import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPepSolarFields_20260312120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projeto_peps"
                ADD COLUMN IF NOT EXISTS "data_preparacao" date        NULL,
                ADD COLUMN IF NOT EXISTS "ml"              numeric     NULL,
                ADD COLUMN IF NOT EXISTS "is_cpc"          boolean     NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projeto_peps"
                DROP COLUMN IF EXISTS "data_preparacao",
                DROP COLUMN IF EXISTS "ml",
                DROP COLUMN IF EXISTS "is_cpc"
        `);
    }
}
