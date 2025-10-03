import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config({ path: 'config/.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: ['src/modules/**/entities/*.entity.{ts,js}'],
  migrations: ['src/migrations/*.ts'],
});
