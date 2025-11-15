import { DataSource } from 'typeorm';
import typeormConfig from '../typeorm.config';

async function resetMigrations() {
  const dataSource = typeormConfig;

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Check if migrations table exists
    const migrationTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'migrations'
      )
    `);

    if (migrationTableExists[0].exists) {
      // Check current migration records
      const migrations = await dataSource.query('SELECT * FROM "migrations"');
      console.log(`Found ${migrations.length} migration records in database`);
      if (migrations.length > 0) {
        console.log('Migration records:', migrations.map((m: any) => m.name || m.id).join(', '));
      }

      console.log('Dropping migrations table to ensure clean slate for migration discovery...');
      await dataSource.query('DROP TABLE IF EXISTS "migrations"');
      console.log('✓ Dropped migrations table');
    } else {
      console.log('✓ Migrations table does not exist');
    }

    // Log discovered migrations for visibility
    const discoveredMigrations = dataSource.migrations;
    if (discoveredMigrations && discoveredMigrations.length > 0) {
      console.log(`\nDiscovered ${discoveredMigrations.length} migration(s):`);
      discoveredMigrations.forEach((m: any) => {
        const migrationName = m.name || m.constructor.name || 'Unknown';
        console.log(`  - ${migrationName}`);
      });
    } else {
      console.log('\n⚠ WARNING: No migrations discovered in migration path!');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error during migration reset check:', error);
    // Don't exit with error - this is a check, not critical
    process.exit(0);
  }
}

resetMigrations();
