import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrevisaoChegada_20260302120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "envios"
                ADD COLUMN IF NOT EXISTS "previsao_chegada" date NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "envios" DROP COLUMN IF EXISTS "previsao_chegada"
        `);
    }
}
