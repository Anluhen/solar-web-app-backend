import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnvioStatusDates_20260302000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "envios"
                ADD COLUMN IF NOT EXISTS "data_enviado" date NULL,
                ADD COLUMN IF NOT EXISTS "data_entregue" date NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "envios"
                DROP COLUMN IF EXISTS "data_enviado",
                DROP COLUMN IF EXISTS "data_entregue"
        `);
    }
}
