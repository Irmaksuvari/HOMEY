import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
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

let globalPool: sql.ConnectionPool | null = null;
let globalPoolPromise: Promise<sql.ConnectionPool> | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (globalPool && globalPool.connected) {
    return globalPool;
  }
  if (!globalPoolPromise) {
    globalPoolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((p) => {
        globalPool = p;
        console.log('Successfully connected to Azure SQL Database');
        return p;
      })
      .catch((err) => {
        globalPoolPromise = null;
        globalPool = null;
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
      });
  }
  return globalPoolPromise;
};

export const poolPromise = {
  then: (onfulfilled?: any, onrejected?: any) => getPool().then(onfulfilled, onrejected),
  catch: (onrejected?: any) => getPool().catch(onrejected)
} as Promise<sql.ConnectionPool>;

export { sql };

