import { MigrationInterface, QueryRunner } from "typeorm";

export class DropOrdemVenda20260509120000 implements MigrationInterface {
    async up(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TABLE projetos DROP COLUMN IF EXISTS "ordem_venda"`);
    }

    async down(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TABLE projetos ADD COLUMN IF NOT EXISTS "ordem_venda" text NULL`);
    }
}
