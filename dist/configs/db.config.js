"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dialect = (process.env.DB_DIALECT || 'mysql');
const baseConfig = {
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: process.env.APP_DEBUG === 'true' ? console.log : false,
};
const sqliteConfig = {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    ...baseConfig,
};
const mysqlConfig = {
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
const activeConfig = dialect === 'sqlite' ? sqliteConfig : mysqlConfig;
exports.dbConfig = {
    development: activeConfig,
    test: activeConfig,
    production: activeConfig,
};
exports.default = exports.dbConfig;
