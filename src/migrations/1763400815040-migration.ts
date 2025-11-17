import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763400815040 implements MigrationInterface {
    name = 'Migration1763400815040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "envios" ADD CONSTRAINT "CHK_db1455c8c67fdbf6d6547c4ad6" CHECK ("status" IN ('RASCUNHO','SEPARACAO','ENVIADO','CANCELADO'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "envios" DROP CONSTRAINT "CHK_db1455c8c67fdbf6d6547c4ad6"`);
    }

}
