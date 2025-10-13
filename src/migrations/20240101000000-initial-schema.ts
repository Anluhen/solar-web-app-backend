import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20240101000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "envios" (
        "id" BIGSERIAL PRIMARY KEY,
        "pep" text NOT NULL,
        "zvgp" text NOT NULL,
        "gerador" text NOT NULL,
        "observacoes" text,
        "status" text NOT NULL DEFAULT 'RASCUNHO',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "separacao" date NOT NULL DEFAULT CURRENT_DATE
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "envios"
      ADD CONSTRAINT "envios_status_check"
      CHECK ("status" IN ('RASCUNHO','ENVIADO','CANCELADO'));
    `);

    await queryRunner.query(
      'CREATE INDEX "envios_gerador_idx" ON "envios" ("gerador")',
    );
    await queryRunner.query('CREATE INDEX "envios_pep_idx" ON "envios" ("pep")');
    await queryRunner.query('CREATE INDEX "envios_zvgp_idx" ON "envios" ("zvgp")');

    await queryRunner.query(`
      CREATE TABLE "materiais" (
        "id" BIGSERIAL PRIMARY KEY,
        "envio_id" bigint NOT NULL,
        "sap" bigint NOT NULL,
        "descricao" text NOT NULL,
        "quantidade" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "materiais_envio_fk"
          FOREIGN KEY ("envio_id") REFERENCES "envios" ("id")
          ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "materiais"');
    await queryRunner.query('DROP TABLE IF EXISTS "envios"');
  }
}
