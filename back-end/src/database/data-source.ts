import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import type { DataSourceOptions } from 'typeorm/browser';
import { InitialSchema1757623551991 } from '../migrations/1757623551991-initial-schema.ts';
import { UserRolesDeadlineEnabledSession1762463659656 } from '../migrations/1762463659656-user-roles-deadline-enabled-session.ts';
import { ChangeEnabledDefaultToFalse1762464439246 } from '../migrations/1762464439246-change-enabled-default-to-false.ts';
import { MakeSubNullable1762464552974 } from '../migrations/1762464552974-make-sub-nullable.ts';
import { DeadlineNullable1740441600000 } from '../migrations/1740441600000-deadline-nullable.ts';
import { AddFunctionSignatureToExercise1772245234876 } from '../migrations/1772245234876-add-function-signature-to-exercise.ts';
import { AddHasTestFileToExercise1772245234877 } from '../migrations/1772245234877-add-has-test-file-to-exercise.ts';
import { UserFullName1772553600000 } from '../migrations/1772553600000-user-full-name.ts';

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
    InitialSchema1757623551991,
    UserRolesDeadlineEnabledSession1762463659656,
    ChangeEnabledDefaultToFalse1762464439246,
    MakeSubNullable1762464552974,
    DeadlineNullable1740441600000,
    AddFunctionSignatureToExercise1772245234876,
    AddHasTestFileToExercise1772245234877,
    UserFullName1772553600000,
  ],
}

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;

