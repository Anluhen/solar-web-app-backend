import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPepNome_20260301120000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" ADD COLUMN IF NOT EXISTS "nome" text`,
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" DROP COLUMN IF EXISTS "nome"`,
        );
    }
}
