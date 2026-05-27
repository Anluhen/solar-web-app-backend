import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoedaTotalLiq20260526000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "moeda_total_liq" text DEFAULT 'BRL'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "projetos" DROP COLUMN IF EXISTS "moeda_total_liq"`,
        );
    }
}
