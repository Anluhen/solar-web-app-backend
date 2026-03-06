import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjetos_20260226120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. projetos
        await queryRunner.query(`
            CREATE TABLE "projetos" (
                "id"              BIGSERIAL    PRIMARY KEY,
                "nome"            text         NOT NULL,
                "pep_prefix"      text         NOT NULL,
                "pm"              text         NOT NULL,
                "analista"        text         NOT NULL,
                "already_started" boolean      NOT NULL DEFAULT false,
                "created_at"      timestamptz  NOT NULL DEFAULT now(),
                "updated_at"      timestamptz  NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "projetos_pep_prefix_idx" ON "projetos" ("pep_prefix")`,
        );

        // 2. projeto_peps
        await queryRunner.query(`
            CREATE TABLE "projeto_peps" (
                "id"          BIGSERIAL   PRIMARY KEY,
                "projeto_id"  bigint      NOT NULL,
                "pep_suffix"  text        NOT NULL,
                "zvgp"        text        NOT NULL,
                "gerador"     text        NOT NULL,
                "created_at"  timestamptz NOT NULL DEFAULT now(),
                "updated_at"  timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "projeto_peps_projeto_fk"
                    FOREIGN KEY ("projeto_id") REFERENCES "projetos" ("id")
                    ON DELETE CASCADE,
                CONSTRAINT "projeto_peps_unique_suffix"
                    UNIQUE ("projeto_id", "pep_suffix")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "projeto_peps_zvgp_idx" ON "projeto_peps" ("zvgp")`,
        );
        await queryRunner.query(
            `CREATE INDEX "projeto_peps_gerador_idx" ON "projeto_peps" ("gerador")`,
        );

        // 3. projeto_items
        await queryRunner.query(`
            CREATE TABLE "projeto_items" (
                "id"                         BIGSERIAL   PRIMARY KEY,
                "projeto_pep_id"             bigint      NOT NULL,
                "sap"                        bigint      NOT NULL,
                "descricao"                  text        NOT NULL,
                "quantidade_necessaria"      integer     NOT NULL,
                "quantidade_entregue_manual" integer,
                "created_at"                 timestamptz NOT NULL DEFAULT now(),
                "updated_at"                 timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "projeto_items_pep_fk"
                    FOREIGN KEY ("projeto_pep_id") REFERENCES "projeto_peps" ("id")
                    ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "projeto_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "projeto_peps"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "projetos"`);
    }
}
