/**
 * scripts/db-check.js
 * Kiểm tra kết nối PostgreSQL tới Supabase bằng cấu hình trong .env
 *
 * Cách chạy (từ thư mục ats-system):
 *   npm install pg          # chỉ cần một lần
 *   node scripts/db-check.js
 *
 * Ưu tiên DATABASE_URL (Session Pooler, IPv4). Nếu không có thì dùng DIRECT_URL.
 * Không in mật khẩu ra màn hình.
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Không tìm thấy tệp .env tại', envPath);
    process.exit(1);
  }
  const text = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function maskConnectionString(dsn) {
  try {
    const url = new URL(dsn);
    if (url.password) url.password = '***';
    return url.toString();
  } catch (_) {
    return '(chuỗi kết nối không hợp lệ)';
  }
}

async function main() {
  loadEnv();

  let pg;
  try {
    pg = require('pg');
  } catch (_) {
    console.error('Thiếu thư viện "pg". Chạy: npm install pg');
    process.exit(1);
  }

  const dsn = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dsn) {
    console.error('Thiếu DATABASE_URL hoặc DIRECT_URL trong .env');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dsn,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  console.log('Đang kết nối:', maskConnectionString(dsn));

  try {
    await client.connect();
    const info = await client.query(
      'select current_database() as db, current_user as usr, version() as ver'
    );
    const row = info.rows[0];
    console.log('Kết nối thành công');
    console.log('  database :', row.db);
    console.log('  user     :', row.usr);
    console.log('  version  :', row.ver.split(' on ')[0]);

    const tables = await client.query(
      `select table_schema, table_name
         from information_schema.tables
        where table_schema = 'public'
        order by table_name`
    );
    console.log('  bảng public:', tables.rowCount);
    if (tables.rowCount > 0) {
      for (const t of tables.rows) console.log('    -', t.table_name);
    }
  } catch (err) {
    console.error('Kết nối thất bại:', err.code || '', err.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch (_) { /* ignore */ }
  }
}

main();
