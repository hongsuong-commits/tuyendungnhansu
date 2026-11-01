/**
 * src/server/db.js
 * Lớp truy cập PostgreSQL (Supabase) cho SmartATS.
 *
 * Mô hình lưu trữ: mỗi collection trong ATSStore là một bảng Postgres
 *   (id text primary key, doc jsonb, seq bigserial, updated_at timestamptz)
 * để bảo toàn nguyên vẹn cấu trúc bản ghi mà giao diện đang dùng,
 * đồng thời vẫn cho phép truy vấn SQL trên các trường cần thiết.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { loadEnv } = require('./env');

const COLLECTIONS = [
  'users',
  'departments',
  'requisitions',
  'postings',
  'candidates',
  'applications',
  'interviews',
  'evaluations',
  'notifications',
  'emailLog',
];

const TABLES = {
  users: 'users',
  departments: 'departments',
  requisitions: 'requisitions',
  postings: 'postings',
  candidates: 'candidates',
  applications: 'applications',
  interviews: 'interviews',
  evaluations: 'evaluations',
  notifications: 'notifications',
  emailLog: 'email_log',
};

let pool = null;
let schemaReady = false;

function connectionString() {
  loadEnv();
  const dsn = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dsn) throw new Error('Thiếu DATABASE_URL trong .env');
  return dsn;
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: connectionString(),
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX || 10),
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  pool.on('error', (err) => console.error('[db] lỗi pool:', err.message));
  return pool;
}

async function ensureSchema() {
  if (schemaReady) return;
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await getPool().connect();
  try {
    await client.query(sql);
    schemaReady = true;
  } finally {
    client.release();
  }
}

async function getState() {
  await ensureSchema();
  const data = {};
  COLLECTIONS.forEach((collection) => { data[collection] = []; });

  // Một lượt truy vấn duy nhất (UNION ALL) thay vì 10 vòng mạng tới Supabase.
  const union = COLLECTIONS
    .map((collection) => `select '${collection}' as collection, seq, doc from ${TABLES[collection]}`)
    .join(' union all ');
  const { rows } = await getPool().query(`select collection, doc from (${union}) t order by collection, seq`);

  rows.forEach((row) => {
    if (data[row.collection]) data[row.collection].push(row.doc);
  });

  const settings = await getPool().query('select doc from app_settings where id = 1');
  data.settings = settings.rows[0] ? settings.rows[0].doc : null;
  return data;
}

async function applySync(payload = {}) {
  await ensureSchema();
  const upserts = payload.upserts || {};
  const deletes = payload.deletes || {};
  const summary = { upserted: 0, deleted: 0, settings: false };

  const client = await getPool().connect();
  try {
    await client.query('begin');

    for (const [collection, rows] of Object.entries(upserts)) {
      const table = TABLES[collection];
      if (!table || !Array.isArray(rows)) continue;

      for (const row of rows) {
        if (!row || typeof row !== 'object' || !row.id) continue;

        if (collection === 'emailLog') {
          await client.query(
            `insert into email_log (id, doc, type, to_email, subject, status, created_at)
             values ($1, $2, $3, $4, $5, 'pending', now())
             on conflict (id) do update
               set doc = excluded.doc,
                   type = excluded.type,
                   to_email = excluded.to_email,
                   subject = excluded.subject`,
            [row.id, row, row.type || null, row.to || null, row.subject || null]
          );
        } else {
          await client.query(
            `insert into ${table} (id, doc) values ($1, $2)
             on conflict (id) do update
               set doc = excluded.doc, updated_at = now()`,
            [row.id, row]
          );
        }
        summary.upserted += 1;
      }
    }

    for (const [collection, ids] of Object.entries(deletes)) {
      const table = TABLES[collection];
      if (!table || !Array.isArray(ids) || ids.length === 0) continue;
      const clean = ids.filter((id) => typeof id === 'string' && id);
      if (!clean.length) continue;
      const result = await client.query(`delete from ${table} where id = any($1::text[])`, [clean]);
      summary.deleted += result.rowCount;
    }

    if (payload.settings && typeof payload.settings === 'object') {
      await client.query(
        `insert into app_settings (id, doc) values (1, $1)
         on conflict (id) do update set doc = excluded.doc, updated_at = now()`,
        [payload.settings]
      );
      summary.settings = true;
    }

    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }

  return summary;
}

async function login(username, password) {
  await ensureSchema();
  const { rows } = await getPool().query(
    `select doc from users where doc->>'username' = $1 limit 1`,
    [String(username || '').trim()]
  );
  const user = rows[0] && rows[0].doc;
  if (!user || user.password !== String(password || '').trim()) return null;
  if (user.role === 'candidate') return null;
  return user;
}

async function seedIfEmpty() {
  await ensureSchema();
  const { rows } = await getPool().query('select count(*)::int as total from users');
  if (rows[0].total > 0) return { seeded: false };

  const seedPath = path.join(__dirname, 'seed.json');
  if (!fs.existsSync(seedPath)) return { seeded: false, reason: 'missing seed.json' };
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  const client = await getPool().connect();
  try {
    await client.query('begin');
    for (const collection of COLLECTIONS) {
      const items = seed[collection] || [];
      const table = TABLES[collection];
      for (const doc of items) {
        if (!doc || !doc.id) continue;
        await client.query(
          `insert into ${table} (id, doc) values ($1, $2) on conflict (id) do nothing`,
          [doc.id, doc]
        );
      }
    }
    if (seed.settings) {
      await client.query(
        `insert into app_settings (id, doc) values (1, $1)
         on conflict (id) do nothing`,
        [seed.settings]
      );
    }
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }

  return { seeded: true };
}

async function counts() {
  await ensureSchema();
  const out = {};
  for (const collection of COLLECTIONS) {
    const { rows } = await getPool().query(`select count(*)::int as total from ${TABLES[collection]}`);
    out[collection] = rows[0].total;
  }
  return out;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  COLLECTIONS,
  TABLES,
  getPool,
  ensureSchema,
  getState,
  applySync,
  login,
  seedIfEmpty,
  counts,
  closePool,
};
