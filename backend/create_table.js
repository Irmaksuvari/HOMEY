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

async function createTable() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            CREATE TABLE FirmaEvraklari (
                Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                FirmaId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Firmalar(Id),
                KiraKontratSablonu NVARCHAR(MAX) NULL,
                TahliyeTaahhutnamesiSablonu NVARCHAR(MAX) NULL,
                SenetSablonu NVARCHAR(MAX) NULL,
                OnSatisSozlesmesiSablonu NVARCHAR(MAX) NULL,
                YetkilendirmeSozlesmesiSablonu NVARCHAR(MAX) NULL,
                OlusturulmaTarihi DATETIME DEFAULT GETDATE(),
                GuncellemeTarihi DATETIME DEFAULT GETDATE()
            );
        `);
        console.log("Table FirmaEvraklari created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}
createTable();
