import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectPeople_20260408120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "project_people" (
                "id"       BIGSERIAL PRIMARY KEY,
                "name"     TEXT NOT NULL,
                "email"    TEXT NOT NULL,
                "secao"    TEXT NOT NULL,
                "position" TEXT NOT NULL
            )
        `);

        await queryRunner.query(`
            INSERT INTO "project_people" ("name", "email", "secao", "position")
            SELECT * FROM (VALUES
            ('Alessandra Tepasse Aldrovandi', 'alessandrat@weg.net', 'Sistemas',     'pm'),
            ('Anderson Montiel Rodrigues',    'montiel@weg.net',     'Sistemas',     'pm'),
            ('Anderson Stein',                'astein@weg.net',      'Sistemas',     'pm'),
            ('Cesar Lopes Bueno',             'cesarb@weg.net',      'Sistemas',     'pm'),
            ('Diego Freitas',                 'dfreitas@weg.net',    'Sistemas',     'pm'),
            ('Douglas Rafael da Silva',       'douglasrs@weg.net',   'Sistemas',     'pm'),
            ('Eduardo Goulart Serafim',       'eserafim@weg.net',    'Sistemas',     'pm'),
            ('Geovan Anderson Wick',          'wick@weg.net',        'Sistemas',     'pm'),
            ('Joao Bruno Bernardo de Deus',   'joaobd@weg.net',      'Sistemas',     'pm'),
            ('Lucas Andre de Araujo',         'lucasaraujo@weg.net', 'Sistemas',     'pm'),
            ('Marcelo Francisco Vieira',      'marcelofv@weg.net',   'Sistemas',     'pm'),
            ('Merli Sanches de Souza',        'merli@weg.net',       'Sistemas',     'pm'),
            ('Roberto Titz',                  'robertot@weg.net',    'Sistemas',     'pm'),
            ('Talita Helen Dias Fodi',        'talitad@weg.net',     'Sistemas',     'pm'),
            ('Domênica Maurissens',              '', 'Solar',        'pm'),
            ('Matheus Rocha Pinheiro',           '', 'Solar',        'pm'),
            ('Roberto Novoa Chiaratti',          '', 'Solar',        'pm'),
            ('Eduarda Pellis',                   '', 'Solar',        'pm'),
            ('Felipe Eduardo Pilz Dieder',       '', 'Solar',        'pm'),
            ('Juliana Gianisella Gamba Manente', '', 'Solar',        'pm'),
            ('Juliano Da Silva Fagundes',        '', 'Solar',        'pm'),
            ('Patricia Lacerda Nazario',         '', 'Solar',        'pm'),
            ('Ricardo Vitorino',                 '', 'Solar',        'pm'),
            ('Tibor Maria Do Valle',             '', 'Solar',        'pm'),
            ('Welerson Felipe Effting',          '', 'Solar',        'pm'),
            ('Alberto Ramos Machado Neto',           '', 'Acionamentos', 'pm'),
            ('Ana Luiza Da Costa Garcia',            '', 'Acionamentos', 'pm'),
            ('Angello Bruno Campagnollo',            '', 'Acionamentos', 'pm'),
            ('Arthur Peter Garcia',                  '', 'Acionamentos', 'pm'),
            ('Eduardo Murussi Sodoski',              '', 'Acionamentos', 'pm'),
            ('Giovanni Bohlhalter Fittipaldi',       '', 'Acionamentos', 'pm'),
            ('Jackson Doubrawa',                     '', 'Acionamentos', 'pm'),
            ('Juliane Barcarolo',                    '', 'Acionamentos', 'pm'),
            ('Marcelo Vallim Leao',                  '', 'Acionamentos', 'pm'),
            ('Pablo Yuri Benavenuto Dos Santos',     '', 'Acionamentos', 'pm'),
            ('Patricia Ramirez Jardim',  'pramirez@weg.net',       'Acionamentos', 'boss'),
            ('Eduardo Moretti',          'emoretti@weg.net',        'Solar',        'boss'),
            ('Fabio de Souza',           'fabiodesouza@weg.net',    'Sistemas',     'boss'),
            ('André Luís Henchenski',          'e-henchenski@weg.net', 'wau',          'dev'),
            ('Luiz Gustavo de Oliveira Filho', 'luizgo@weg.net',       'Solar',        'admin'),
            ('Josmeri Sardagna',               'josmeri@weg.net',       'Sistemas',     'admin'),
            ('Josmeri Sardagna',               'josmeri@weg.net',       'Acionamentos', 'admin'),
            ('Rosana Vieira',                  'e-rosana@weg.net',      'wau',          'finance'),
            ('Arthur Delmiro Lourenco',        'arthurdl@weg.net',      'wau',          'controller')
            ) AS v("name", "email", "secao", "position")
            WHERE NOT EXISTS (SELECT 1 FROM "project_people" LIMIT 1)
        `);

        await queryRunner.query(`
            ALTER TABLE "projetos"
              ADD COLUMN IF NOT EXISTS "workflow_status" TEXT NOT NULL DEFAULT 'RASCUNHO'
                CONSTRAINT projetos_workflow_status_check
                  CHECK ("workflow_status" IN ('RASCUNHO','AGUARDANDO_GESTOR','ENVIO_EMAIL','FINALIZADO')),
              ADD COLUMN IF NOT EXISTS "anexo_ov"    TEXT,
              ADD COLUMN IF NOT EXISTS "anexo_outro" TEXT
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projetos' AND column_name = 'observacoes_chefe'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projetos' AND column_name = 'observacoes_admin'
                ) THEN
                    ALTER TABLE "projetos" RENAME COLUMN "observacoes_chefe" TO "observacoes_admin";
                END IF;
            END $$;
        `);

        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "observacoes_chefe" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "custos_ipex" BOOLEAN`);
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "contato_cliente_para" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "contato_cliente_cc" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "contato_weg_para" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "contato_weg_cc" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "empresa"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "empresa" TEXT`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "contato_weg_cc"`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "contato_weg_para"`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "contato_cliente_cc"`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "contato_cliente_para"`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "custos_ipex"`);
        await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "observacoes_chefe"`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projetos' AND column_name = 'observacoes_admin'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projetos' AND column_name = 'observacoes_chefe'
                ) THEN
                    ALTER TABLE "projetos" RENAME COLUMN "observacoes_admin" TO "observacoes_chefe";
                END IF;
            END $$;
        `);
        await queryRunner.query(`
            ALTER TABLE "projetos"
              DROP COLUMN IF EXISTS "workflow_status",
              DROP COLUMN IF EXISTS "anexo_ov",
              DROP COLUMN IF EXISTS "anexo_outro"
        `);
        await queryRunner.query(`DROP TABLE IF EXISTS "project_people"`);
    }
}
