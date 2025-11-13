import { DataSource } from 'typeorm';
import typeormConfig from '../typeorm.config';

async function resetMigrations() {
  const dataSource = typeormConfig;

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Drop the migrations table to reset migration state
    await dataSource.query('DROP TABLE IF EXISTS "migrations"');
    console.log('Dropped migrations table');

    await dataSource.destroy();
    console.log('Reset complete. Migrations can now run from scratch.');
  } catch (error) {
    console.error('Error resetting migrations:', error);
    process.exit(1);
  }
}

resetMigrations();
