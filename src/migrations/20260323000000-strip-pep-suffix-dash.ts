import { MigrationInterface, QueryRunner } from 'typeorm';

export class StripPepSuffixDash_20260323000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE projeto_peps
            SET pep_suffix = LTRIM(pep_suffix, '-')
            WHERE pep_suffix LIKE '-%'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE projeto_peps
            SET pep_suffix = '-' || pep_suffix
            WHERE pep_suffix NOT LIKE '-%'
        `);
    }
}
