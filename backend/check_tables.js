const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function getTables() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        console.log("TABLES:");
        console.log(result.recordset);
        
        // Also get columns of the firms table if we can guess its name
        const cols = await sql.query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME LIKE '%Firm%' OR TABLE_NAME LIKE '%Company%' OR TABLE_NAME LIKE '%Agency%'
        `);
        console.log("FIRM COLUMNS:");
        console.log(cols.recordset);
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getTables();
