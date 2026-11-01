/**
 * scripts/db-inspect.js
 * Liệt kê các bảng đang có trong schema public và số dòng mỗi bảng.
 * Chạy: node scripts/db-inspect.js
 */
const db = require('../src/server/db');

(async () => {
  const tables = await db.getPool().query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log('Bảng trong public:', tables.rows.map((r) => r.table_name).join(', ') || '(trống)');

  const counts = await db.counts();
  Object.entries(counts).forEach(([name, total]) => console.log(`  ${name.padEnd(14)} ${total}`));

  const settings = await db.getPool().query('select doc->>\'companyName\' as name, doc->>\'hotline\' as hotline from app_settings where id = 1');
  if (settings.rows[0]) {
    console.log('Cấu hình:', settings.rows[0].name, '·', settings.rows[0].hotline);
  }

  await db.closePool();
})().catch(async (err) => {
  console.error('Lỗi:', err.message);
  try { await db.closePool(); } catch (_) { /* ignore */ }
  process.exit(1);
});
