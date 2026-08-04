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

async function alterTable() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            ALTER TABLE Portfoyler
            ADD YetkilendirmeSozlesmesiYapildi BIT NOT NULL DEFAULT 0;
        `);
        console.log("Column YetkilendirmeSozlesmesiYapildi added successfully to Portfoyler.");
    } catch (err) {
        console.error("Error altering table:", err);
    } finally {
        process.exit();
    }
}
alterTable();
