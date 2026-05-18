import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableProjetosColumns20260509130000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projetos"
                ALTER COLUMN "nome"       DROP NOT NULL,
                ALTER COLUMN "cliente"    DROP NOT NULL,
                ALTER COLUMN "produto"    DROP NOT NULL,
                ALTER COLUMN "pm"         DROP NOT NULL,
                ALTER COLUMN "pep_prefix" DROP NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "projetos"
                ALTER COLUMN "nome"       SET NOT NULL,
                ALTER COLUMN "cliente"    SET NOT NULL,
                ALTER COLUMN "produto"    SET NOT NULL,
                ALTER COLUMN "pm"         SET NOT NULL,
                ALTER COLUMN "pep_prefix" SET NOT NULL;
        `);
    }
}
