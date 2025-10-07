import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUfvToEnvios20250925164631 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "envios" ADD COLUMN IF NOT EXISTS "ufv" text');
    await queryRunner.query(`UPDATE "envios" SET "ufv" = 'SEM NOME' WHERE "ufv" IS NULL`);
    await queryRunner.query('ALTER TABLE "envios" ALTER COLUMN "ufv" SET NOT NULL');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "envios_ufv_idx" ON "envios" ("ufv")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "envios_ufv_idx"');
    await queryRunner.query('ALTER TABLE "envios" DROP COLUMN IF EXISTS "ufv"');
  }
}
