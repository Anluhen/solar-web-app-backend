import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppConfig_20260518000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "app_config" (
                "key"   TEXT PRIMARY KEY,
                "value" TEXT NOT NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "app_config"`);
    }
}
