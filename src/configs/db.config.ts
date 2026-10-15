import dotenv from 'dotenv';
import { Options } from 'sequelize';

dotenv.config();

const dialect = (process.env.DB_DIALECT || 'mysql') as 'mysql' | 'sqlite';

const baseConfig: Options = {
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.APP_DEBUG === 'true' ? console.log : false,
};

const sqliteConfig: Options = {
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  ...baseConfig,
};

const mysqlConfig: Options = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DB_DB || 'di_app',
  dialectOptions: {
    multipleStatements: false,
  },
  ...baseConfig,
};

const activeConfig: Options = dialect === 'sqlite' ? sqliteConfig : mysqlConfig;

export const dbConfig = {
  development: activeConfig,
  test: activeConfig,
  production: activeConfig,
};

export default dbConfig;
