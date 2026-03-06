import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjetoItemGrupo_20260303000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
                ADD COLUMN IF NOT EXISTS "grupo" text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projeto_items" DROP COLUMN IF EXISTS "grupo"
        `);
    }
}
