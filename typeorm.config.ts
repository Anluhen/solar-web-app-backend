import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Only load from config/.env in development if the file exists
const envPath = path.join(__dirname, 'config', '.env');
try {
  config({ path: envPath });
} catch (error) {
  // Silently fail in production where .env file doesn't exist
}

// Determine if we're running from dist (production) or src (development)
const isProduction = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
const migrationsPath = isProduction
  ? path.resolve(__dirname, 'dist/migrations/*.js')
  : path.resolve(__dirname, 'src/migrations/*.ts');
const entitiesPath = isProduction
  ? path.resolve(__dirname, 'dist/modules/**/entities/*.entity.js')
  : path.resolve(__dirname, 'src/modules/**/entities/*.entity.{ts,js}');

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [entitiesPath],
  migrations: [migrationsPath],
});
