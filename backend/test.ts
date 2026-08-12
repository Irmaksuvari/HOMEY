import { poolPromise, sql } from './src/config/db';

async function run() {
  const pool = await poolPromise;
  const res = await pool.request().query("SELECT FirmaId, Rol, COUNT(*) as Cnt FROM Kullanicilar WHERE ISNULL(SilindiMi, 0) = 0 GROUP BY FirmaId, Rol");
  console.log('Kullanıcı Rol Sayıları by Firm:', res.recordset);
  process.exit(0);
}
run();
