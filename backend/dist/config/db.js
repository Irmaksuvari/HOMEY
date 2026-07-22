"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.poolPromise = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'HOMEY',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // True for Azure SQL
        trustServerCertificate: true, // Set to true for local dev / self-signed certs
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
exports.poolPromise = new mssql_1.default.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
    console.log('Successfully connected to Azure SQL Database');
    return pool;
})
    .catch((err) => {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
});
