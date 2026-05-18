import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillEnviosZvgpFromProjetos20260512000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Envios store the full PEP as a single string (e.g. "P-123456-011").
        // Projetos store it split as pep_prefix + optional pep_suffix.
        // Join on the reconstructed full PEP to copy zvgp from projetos → envios
        // where the envio's zvgp is either NULL or empty.
        await queryRunner.query(`
            UPDATE "envios" e
            SET "zvgp" = p."zvgp"
            FROM "projetos" p
            WHERE p."zvgp" IS NOT NULL
              AND p."zvgp" <> ''
              AND (e."zvgp" IS NULL OR e."zvgp" = '')
              AND e."pep" = CASE
                    WHEN p."pep_suffix" IS NOT NULL AND p."pep_suffix" <> ''
                    THEN p."pep_prefix" || '-' || p."pep_suffix"
                    ELSE p."pep_prefix"
                  END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cannot safely restore previous zvgp values — this is a best-effort backfill.
        // down() is a no-op.
    }
}
