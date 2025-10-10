import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowSeparacaoStatus20251002120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "envios" DROP CONSTRAINT IF EXISTS "envios_status_check"');

    await queryRunner.query(`DO $$
      DECLARE constraint_record record;
      BEGIN
        FOR constraint_record IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'envios'::regclass
            AND contype = 'c'
            AND position('status' in pg_get_constraintdef(oid)) > 0
        LOOP
          EXECUTE format('ALTER TABLE "envios" DROP CONSTRAINT %I', constraint_record.conname);
        END LOOP;
      END;
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "envios"
      ADD CONSTRAINT "envios_status_check"
      CHECK ("status" IN ('RASCUNHO','SEPARACAO','ENVIADO','CANCELADO'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "envios" DROP CONSTRAINT IF EXISTS "envios_status_check";
    `);

    await queryRunner.query(`
      ALTER TABLE "envios"
      ADD CONSTRAINT "envios_status_check"
      CHECK ("status" IN ('RASCUNHO','ENVIADO','CANCELADO'));
    `);
  }
}
