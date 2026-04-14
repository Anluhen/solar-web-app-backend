import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Consolidated migration for the kaizen module (replaces the 4 individual migrations:
 * 20260325120000-create-kaizen, 20260325130000-alter-kaizen-fields,
 * 20260325140000-kaizen-workflow, 20260327120000-kaizen-status-v2).
 *
 * Intended for QAS/PRD databases that have none of the kaizen migrations yet.
 * DEV already has all 4 individual migrations and should NOT run this one.
 */
export class KaizenConsolidated_20260327130000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "kaizens" (
                "id"                      BIGSERIAL    PRIMARY KEY,
                "nome"                    text         NOT NULL,
                "secao"                   text         NOT NULL,
                "e_autor"                 boolean      NOT NULL DEFAULT true,
                "autor_nome"              text,
                "area_responsavel_mesma"  boolean      NOT NULL DEFAULT true,
                "area_responsavel_secao"  text,
                "area_impactada_mesma"    boolean      NOT NULL DEFAULT true,
                "area_impactada_secao"    text,
                "local_detalhado"         text,
                "classificacao"           text         NOT NULL DEFAULT 'Quick Kaizen',
                "titulo"                  text         NOT NULL,
                "problema"                text         NOT NULL,
                "melhoria"                text         NOT NULL,
                "status"                  text         NOT NULL DEFAULT 'Não cadastrado'
                    CONSTRAINT kaizens_status_check CHECK (status IN ('Não cadastrado', 'Cadastrado')),
                "id_kaizen"               text,
                "created_at"              timestamptz  NOT NULL DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "kaizens"`);
    }
}
