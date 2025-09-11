import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import type { DataSourceOptions } from 'typeorm/browser';

dotenv.config();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'app_db',
  synchronize: false,
  logging: Boolean(process.env.DB_LOGGING) || false,
  entities: [
    'src/entities/**/*.{ts,js}',
  ],
  migrations: [
    'src/migrations/**/*.{ts,js}',
  ],
}

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;

