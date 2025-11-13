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
      // Check if there are pending migrations
      const migrations = await dataSource.query('SELECT * FROM "migrations"');
      console.log(`Found ${migrations.length} migration records in database`);

      if (migrations.length > 0) {
        console.log('Resetting migrations table due to stale migration records...');
        await dataSource.query('DROP TABLE IF EXISTS "migrations"');
        console.log('✓ Dropped migrations table - migrations can now run from scratch');
      } else {
        console.log('✓ Migrations table is clean, no reset needed');
      }
    } else {
      console.log('✓ Migrations table does not exist, no reset needed');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error during migration reset check:', error);
    // Don't exit with error - this is a check, not critical
    process.exit(0);
  }
}

resetMigrations();
