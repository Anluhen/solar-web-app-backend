import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProdutoOptions_20260514000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "produto_options" (
                "id"    BIGSERIAL PRIMARY KEY,
                "secao" TEXT NOT NULL,
                "label" TEXT NOT NULL,
                UNIQUE ("secao", "label")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "produto_options"`);
    }
}
