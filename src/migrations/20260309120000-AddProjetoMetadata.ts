import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjetoMetadata_20260309120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make analista nullable (it's being removed from the form)
        await queryRunner.query(
            `ALTER TABLE "projetos" ALTER COLUMN "analista" DROP NOT NULL`,
        );

        // Add new columns to projetos
        await queryRunner.query(`
            ALTER TABLE "projetos"
                ADD COLUMN IF NOT EXISTS "secao"               text        NULL,
                ADD COLUMN IF NOT EXISTS "cliente"             text        NULL,
                ADD COLUMN IF NOT EXISTS "produto"             text        NULL,
                ADD COLUMN IF NOT EXISTS "zvgp_projeto"        text        NULL,
                ADD COLUMN IF NOT EXISTS "zrgp"                text        NULL,
                ADD COLUMN IF NOT EXISTS "data_preparacao"     date        NULL,
                ADD COLUMN IF NOT EXISTS "pep_faturavel"       text        NULL,
                ADD COLUMN IF NOT EXISTS "cns_ano"             text        NULL,
                ADD COLUMN IF NOT EXISTS "gerador_projeto"     text        NULL,
                ADD COLUMN IF NOT EXISTS "ordem_venda"         text        NULL,
                ADD COLUMN IF NOT EXISTS "data_primeiro_envio" date        NULL,
                ADD COLUMN IF NOT EXISTS "ordem_pedido_compra" text        NULL,
                ADD COLUMN IF NOT EXISTS "valor_total_liq"     numeric     NULL,
                ADD COLUMN IF NOT EXISTS "ml"                  numeric     NULL,
                ADD COLUMN IF NOT EXISTS "is_cpc"              boolean     NULL,
                ADD COLUMN IF NOT EXISTS "is_cpc47"            boolean     NULL,
                ADD COLUMN IF NOT EXISTS "claim"               text        NULL,
                ADD COLUMN IF NOT EXISTS "data_claim"          date        NULL,
                ADD COLUMN IF NOT EXISTS "observacoes_chefe"   text        NULL,
                ADD COLUMN IF NOT EXISTS "data_criacao_pep"    date        NULL,
                ADD COLUMN IF NOT EXISTS "idioma"              text        NULL,
                ADD COLUMN IF NOT EXISTS "empresa"             text        NULL,
                ADD COLUMN IF NOT EXISTS "contatos_cliente"    text        NULL,
                ADD COLUMN IF NOT EXISTS "contatos_weg"        text        NULL
        `);

        // Add zrgp to projeto_peps
        await queryRunner.query(`
            ALTER TABLE "projeto_peps"
                ADD COLUMN IF NOT EXISTS "zrgp" text NULL
        `);

        // Make zvgp and gerador nullable on projeto_peps
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" ALTER COLUMN "zvgp" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" ALTER COLUMN "gerador" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" ALTER COLUMN "gerador" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" ALTER COLUMN "zvgp" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "projeto_peps" DROP COLUMN IF EXISTS "zrgp"`,
        );

        await queryRunner.query(`
            ALTER TABLE "projetos"
                DROP COLUMN IF EXISTS "secao",
                DROP COLUMN IF EXISTS "cliente",
                DROP COLUMN IF EXISTS "produto",
                DROP COLUMN IF EXISTS "zvgp_projeto",
                DROP COLUMN IF EXISTS "zrgp",
                DROP COLUMN IF EXISTS "data_preparacao",
                DROP COLUMN IF EXISTS "pep_faturavel",
                DROP COLUMN IF EXISTS "cns_ano",
                DROP COLUMN IF EXISTS "gerador_projeto",
                DROP COLUMN IF EXISTS "ordem_venda",
                DROP COLUMN IF EXISTS "data_primeiro_envio",
                DROP COLUMN IF EXISTS "ordem_pedido_compra",
                DROP COLUMN IF EXISTS "valor_total_liq",
                DROP COLUMN IF EXISTS "ml",
                DROP COLUMN IF EXISTS "is_cpc",
                DROP COLUMN IF EXISTS "is_cpc47",
                DROP COLUMN IF EXISTS "claim",
                DROP COLUMN IF EXISTS "data_claim",
                DROP COLUMN IF EXISTS "observacoes_chefe",
                DROP COLUMN IF EXISTS "data_criacao_pep",
                DROP COLUMN IF EXISTS "idioma",
                DROP COLUMN IF EXISTS "empresa",
                DROP COLUMN IF EXISTS "contatos_cliente",
                DROP COLUMN IF EXISTS "contatos_weg"
        `);

        await queryRunner.query(
            `ALTER TABLE "projetos" ALTER COLUMN "analista" SET NOT NULL`,
        );
    }
}
