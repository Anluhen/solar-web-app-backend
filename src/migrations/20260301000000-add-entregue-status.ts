import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntregueStatus_20260301000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing status check constraint (name is a TypeORM-generated hash)
        await queryRunner.query(`
            DO $$
            DECLARE
                cname TEXT;
            BEGIN
                SELECT conname INTO cname
                FROM pg_constraint
                WHERE conrelid = 'envios'::regclass
                  AND contype = 'c'
                  AND pg_get_constraintdef(oid) ILIKE '%CANCELADO%';
                IF cname IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE "envios" DROP CONSTRAINT ' || quote_ident(cname);
                END IF;
            END $$;
        `);

        // Add new constraint that includes ENTREGUE
        await queryRunner.query(
            `ALTER TABLE "envios" ADD CONSTRAINT "CHK_envio_status" CHECK ("status" IN ('RASCUNHO','SEPARACAO','ENVIADO','ENTREGUE','CANCELADO'))`,
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "envios" DROP CONSTRAINT IF EXISTS "CHK_envio_status"`,
        );
        await queryRunner.query(
            `ALTER TABLE "envios" ADD CONSTRAINT "CHK_envio_status" CHECK ("status" IN ('RASCUNHO','SEPARACAO','ENVIADO','CANCELADO'))`,
        );
    }
}
