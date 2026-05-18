import { MigrationInterface, QueryRunner } from "typeorm";

export class FlattenProjetos_20260508000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // ══════════════════════════════════════════════════════════════
        // PHASE 1: ADD new columns to projetos (no data removed yet)
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`
            ALTER TABLE "projetos"
              ADD COLUMN IF NOT EXISTS "pep_suffix" TEXT,
              ADD COLUMN IF NOT EXISTS "zvgp"       TEXT,
              ADD COLUMN IF NOT EXISTS "gerador"    TEXT,
              ADD COLUMN IF NOT EXISTS "nome_pep"   TEXT
        `);
        // Note: zrgp, data_preparacao, ml, is_cpc already exist on projetos

        // ══════════════════════════════════════════════════════════════
        // PHASE 2: MIGRATE all projeto_peps data → projetos
        // All deletes happen AFTER this phase. Phase is purely additive.
        // ══════════════════════════════════════════════════════════════

        // 2a. First pep per project → update the existing projetos row in-place
        await queryRunner.query(`
            UPDATE "projetos" p
            SET
              "pep_suffix"      = pp."pep_suffix",
              "zvgp"            = COALESCE(pp."zvgp", p."zvgp_projeto"),
              "zrgp"            = COALESCE(pp."zrgp", p."zrgp"),
              "gerador"         = COALESCE(pp."gerador", p."gerador_projeto"),
              "nome_pep"        = pp."nome",
              "data_preparacao" = COALESCE(pp."data_preparacao", p."data_preparacao"),
              "ml"              = COALESCE(pp."ml", p."ml"),
              "is_cpc"          = COALESCE(pp."is_cpc", p."is_cpc")
            FROM "projeto_peps" pp
            WHERE pp."projeto_id" = p."id"
              AND pp."id" = (
                SELECT MIN("id") FROM "projeto_peps" WHERE "projeto_id" = p."id"
              )
        `);

        // 2b. Additional peps (Solar multi-PEP) → INSERT new projetos rows
        // ON CONFLICT DO NOTHING makes this idempotent if partially run before
        await queryRunner.query(`
            INSERT INTO "projetos" (
              "secao", "nome", "cliente", "produto", "pep_prefix", "pm", "analista",
              "already_started", "cns_ano", "ordem_venda", "data_primeiro_envio",
              "ordem_pedido_compra", "valor_total_liq", "is_cpc47", "claim",
              "data_claim", "observacoes_admin", "observacoes_chefe", "data_criacao_pep",
              "idioma", "contato_cliente_para", "contato_cliente_cc",
              "contato_weg_para", "contato_weg_cc", "custos_ipex", "workflow_status",
              "anexo_ov", "anexo_outro",
              "pep_suffix", "zvgp", "zrgp", "gerador", "nome_pep",
              "data_preparacao", "ml", "is_cpc",
              "created_at", "updated_at"
            )
            SELECT
              p."secao", p."nome", p."cliente", p."produto", p."pep_prefix", p."pm",
              p."analista", p."already_started", p."cns_ano", p."ordem_venda",
              p."data_primeiro_envio", p."ordem_pedido_compra", p."valor_total_liq",
              p."is_cpc47", p."claim", p."data_claim", p."observacoes_admin",
              p."observacoes_chefe", p."data_criacao_pep", p."idioma",
              p."contato_cliente_para", p."contato_cliente_cc",
              p."contato_weg_para", p."contato_weg_cc", p."custos_ipex",
              p."workflow_status", p."anexo_ov", p."anexo_outro",
              pp."pep_suffix",
              pp."zvgp",
              pp."zrgp",
              pp."gerador",
              pp."nome",
              COALESCE(pp."data_preparacao", p."data_preparacao"),
              COALESCE(pp."ml", p."ml"),
              COALESCE(pp."is_cpc", p."is_cpc"),
              pp."created_at", pp."updated_at"
            FROM "projeto_peps" pp
            JOIN "projetos" p ON pp."projeto_id" = p."id"
            WHERE pp."id" != (
              SELECT MIN("id") FROM "projeto_peps" WHERE "projeto_id" = p."id"
            )
            ON CONFLICT DO NOTHING
        `);

        // ══════════════════════════════════════════════════════════════
        // PHASE 3: Remap projeto_items FK from projeto_pep_id → projeto_id
        // Still has old FK column — only add new one here.
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
              ADD COLUMN IF NOT EXISTS "projeto_id" BIGINT
        `);

        // Map items — only if projeto_peps table still exists
        await queryRunner.query(`
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'projeto_peps' AND table_schema = 'public'
              ) THEN
                UPDATE "projeto_items" pi
                SET "projeto_id" = pp."projeto_id"
                FROM "projeto_peps" pp
                WHERE pi."projeto_pep_id" = pp."id"
                  AND pi."projeto_id" IS NULL;

                UPDATE "projeto_items" pi
                SET "projeto_id" = pnew."id"
                FROM "projeto_peps" pp
                JOIN "projetos" pnew ON (
                  pnew."pep_prefix" = (
                    SELECT "pep_prefix" FROM "projetos" WHERE "id" = pp."projeto_id"
                  )
                  AND pnew."pep_suffix" IS NOT DISTINCT FROM pp."pep_suffix"
                  AND pnew."zvgp"       IS NOT DISTINCT FROM pp."zvgp"
                )
                WHERE pi."projeto_pep_id" = pp."id"
                  AND pi."projeto_id" IS NULL;
              END IF;
            END $$
        `);

        // Safety check: only run if the old FK column still exists
        await queryRunner.query(`
            DO $$
            DECLARE cnt INT;
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'projeto_items' AND column_name = 'projeto_pep_id'
              ) THEN
                SELECT COUNT(*) INTO cnt FROM "projeto_items" WHERE "projeto_id" IS NULL;
                IF cnt > 0 THEN
                  RAISE EXCEPTION
                    'DATA MIGRATION INCOMPLETE: % projeto_items rows still have NULL projeto_id. Aborting migration.',
                    cnt;
                END IF;
              END IF;
            END $$
        `);

        // ══════════════════════════════════════════════════════════════
        // PHASE 4: Enforce new FK, drop old column
        // Runs only if Phase 3 safety check passed.
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'projeto_items' AND column_name = 'projeto_id'
                  AND is_nullable = 'YES'
              ) THEN
                ALTER TABLE "projeto_items" ALTER COLUMN "projeto_id" SET NOT NULL;
              END IF;
            END $$
        `);
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
              DROP CONSTRAINT IF EXISTS "projeto_items_projeto_fk"
        `);
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
              ADD CONSTRAINT "projeto_items_projeto_fk"
                FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
              DROP CONSTRAINT IF EXISTS "projeto_items_pep_fk"
        `);
        await queryRunner.query(`
            ALTER TABLE "projeto_items"
              DROP COLUMN IF EXISTS "projeto_pep_id"
        `);

        // ══════════════════════════════════════════════════════════════
        // PHASE 5: DROP projeto_peps (all data now in projetos)
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`DROP TABLE IF EXISTS "projeto_peps"`);

        // ══════════════════════════════════════════════════════════════
        // PHASE 6: Clean up legacy columns on projetos
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`
            ALTER TABLE "projetos"
              DROP COLUMN IF EXISTS "zvgp_projeto",
              DROP COLUMN IF EXISTS "gerador_projeto",
              DROP COLUMN IF EXISTS "pep_faturavel"
        `);

        // ══════════════════════════════════════════════════════════════
        // PHASE 7: Unique constraint + indexes
        // ══════════════════════════════════════════════════════════════
        await queryRunner.query(`
            ALTER TABLE "projetos"
              DROP CONSTRAINT IF EXISTS "projetos_unique_subproject"
        `);
        await queryRunner.query(`
            ALTER TABLE "projetos"
              ADD CONSTRAINT "projetos_unique_subproject"
                UNIQUE NULLS NOT DISTINCT ("pep_prefix", "pep_suffix", "zvgp")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "projetos_zvgp_idx"    ON "projetos" ("zvgp")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "projetos_gerador_idx" ON "projetos" ("gerador")
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        throw new Error(
            "DOWN migration not supported for FlattenProjetos. Restore from pre-migration database backup.",
        );
    }
}
