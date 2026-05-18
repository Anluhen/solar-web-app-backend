import { MigrationInterface, QueryRunner } from "typeorm";

export class DropIsCpc_20260509000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Migrate is_cpc into is_cpc47 where is_cpc47 is not yet set
        await queryRunner.query(`
            UPDATE "projetos"
            SET "is_cpc47" = "is_cpc"
            WHERE "is_cpc47" IS NULL AND "is_cpc" IS NOT NULL
        `);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "is_cpc"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "is_cpc" BOOLEAN`);
    }
}
