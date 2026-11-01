/**
 * src/server/db.js
 * Lớp truy cập dữ liệu cho SmartATS với HAI backend:
 *
 *   1. postgres — khi .env có DATABASE_URL/DIRECT_URL (Supabase).
 *      Mỗi collection là một bảng: id text pk, doc jsonb, seq bigserial, updated_at.
 *
 *   2. file — khi CHƯA cấu hình DATABASE_URL. Dữ liệu lưu vào data/store.json
 *      để hệ thống vẫn chạy đầy đủ (kể cả hàng đợi email) mà không cần máy chủ DB.
 *      Khi bạn điền DATABASE_URL vào .env, hệ thống tự chuyển sang PostgreSQL.
 *
 * Cả hai backend phơi ra CÙNG một API nên phần còn lại của ứng dụng không đổi.
 */
const fs = require('fs');
const path = require('path');
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

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SEED_FILE = path.join(__dirname, 'seed.json');

let pool = null;
let schemaReady = false;

// ────────────────────────────────────────────────────────────────
// Chọn backend
// ────────────────────────────────────────────────────────────────
function dsn() {
  loadEnv();
  return String(process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim();
}

function getBackendMode() {
  loadEnv();
  const explicit = String(process.env.DB_BACKEND || 'auto').toLowerCase();
  if (explicit === 'file') return 'file';
  if (explicit === 'postgres') return 'postgres';
  return dsn() ? 'postgres' : 'file';
}

// ────────────────────────────────────────────────────────────────
// Backend FILE (JSON) — dùng khi chưa có DATABASE_URL
// ────────────────────────────────────────────────────────────────
let _store = null;

function emptyStore() {
  const store = { settings: null, emailQueue: [] };
  COLLECTIONS.forEach((collection) => { store[collection] = []; });
  return store;
}

function readStore() {
  if (_store) return _store;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        _store = parsed;
        COLLECTIONS.forEach((collection) => {
          if (!Array.isArray(_store[collection])) _store[collection] = [];
        });
        if (!Array.isArray(_store.emailQueue)) _store.emailQueue = [];
        return _store;
      }
    }
  } catch (err) {
    console.warn('[db:file] Không đọc được data/store.json:', err.message);
  }
  _store = emptyStore();
  return _store;
}

function writeStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(readStore(), null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

// ────────────────────────────────────────────────────────────────
// Backend POSTGRES
// ────────────────────────────────────────────────────────────────
function getPool() {
  if (pool) return pool;
  const connectionString = dsn();
  if (!connectionString) throw new Error('Thiếu DATABASE_URL trong .env');
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX || 10),
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  pool.on('error', (err) => console.error('[db] lỗi pool:', err.message));
  return pool;
}

async function ensurePgSchema() {
  if (schemaReady) return;
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await getPool().connect();
  try {
    await client.query(sql);
    schemaReady = true;
  } finally {
    client.release();
  }
}

// ────────────────────────────────────────────────────────────────
// API chung: schema / seed / state / sync / login / counts
// ────────────────────────────────────────────────────────────────
async function ensureSchema() {
  if (getBackendMode() === 'postgres') return ensurePgSchema();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  readStore();
}

async function seedIfEmpty() {
  await ensureSchema();

  if (getBackendMode() === 'file') {
    const store = readStore();
    if (store.users.length > 0) return { seeded: false };
    if (!fs.existsSync(SEED_FILE)) return { seeded: false, reason: 'missing seed.json' };
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    COLLECTIONS.forEach((collection) => {
      if (collection === 'emailLog') return;
      store[collection] = clone(seed[collection] || []);
    });
    if (seed.settings) store.settings = clone(seed.settings);
    writeStore();
    return { seeded: true };
  }

  const { rows } = await getPool().query('select count(*)::int as total from users');
  if (rows[0].total > 0) return { seeded: false };
  if (!fs.existsSync(SEED_FILE)) return { seeded: false, reason: 'missing seed.json' };
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));

  const client = await getPool().connect();
  try {
    await client.query('begin');
    for (const collection of COLLECTIONS) {
      const table = TABLES[collection];
      for (const doc of seed[collection] || []) {
        if (!doc || !doc.id) continue;
        await client.query(
          `insert into ${table} (id, doc) values ($1, $2) on conflict (id) do nothing`,
          [doc.id, doc]
        );
      }
    }
    if (seed.settings) {
      await client.query(
        'insert into app_settings (id, doc) values (1, $1) on conflict (id) do nothing',
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

async function getState() {
  await ensureSchema();

  if (getBackendMode() === 'file') {
    const store = readStore();
    const data = {};
    COLLECTIONS.forEach((collection) => { data[collection] = clone(store[collection]); });
    data.settings = clone(store.settings);
    return data;
  }

  const data = {};
  COLLECTIONS.forEach((collection) => { data[collection] = []; });
  const union = COLLECTIONS
    .map((collection) => `select '${collection}' as collection, seq, doc from ${TABLES[collection]}`)
    .join(' union all ');
  const { rows } = await getPool().query(
    `select collection, doc from (${union}) t order by collection, seq`
  );
  rows.forEach((row) => {
    if (data[row.collection]) data[row.collection].push(row.doc);
  });
  const settings = await getPool().query('select doc from app_settings where id = 1');
  data.settings = settings.rows[0] ? settings.rows[0].doc : null;
  return data;
}

function upsertFileRecord(store, collection, record) {
  const list = store[collection];
  const index = list.findIndex((item) => item && item.id === record.id);
  if (index === -1) list.unshift(clone(record));
  else list[index] = clone(record);
}

function enqueueFileMail(store, record, receivedAt) {
  const existing = store.emailQueue.find((row) => row.id === record.id);
  const row = {
    id: record.id,
    doc: clone(record),
    type: record.type || null,
    to_email: record.to || null,
    subject: record.subject || null,
    status: existing ? existing.status : 'pending',
    provider: existing ? existing.provider : null,
    provider_message_id: existing ? existing.provider_message_id : null,
    preview_url: existing ? existing.preview_url : null,
    error: existing ? existing.error : null,
    created_at: existing ? existing.created_at : receivedAt,
    sent_at: existing ? existing.sent_at : null,
  };
  if (existing) Object.assign(existing, row);
  else store.emailQueue.push(row);
}

async function applySync(payload = {}) {
  await ensureSchema();
  const upserts = payload.upserts || {};
  const deletes = payload.deletes || {};
  const summary = { upserted: 0, deleted: 0, settings: false };
  const receivedAt = new Date().toISOString();

  if (getBackendMode() === 'file') {
    const store = readStore();
    for (const [collection, rows] of Object.entries(upserts)) {
      if (!COLLECTIONS.includes(collection) || !Array.isArray(rows)) continue;
      for (const record of rows) {
        if (!record || typeof record !== 'object' || !record.id) continue;
        if (collection === 'emailLog') {
          upsertFileRecord(store, 'emailLog', record);
          enqueueFileMail(store, record, receivedAt);
        } else {
          upsertFileRecord(store, collection, record);
        }
        summary.upserted += 1;
      }
    }
    for (const [collection, ids] of Object.entries(deletes)) {
      if (!COLLECTIONS.includes(collection) || !Array.isArray(ids) || !ids.length) continue;
      const before = store[collection].length;
      store[collection] = store[collection].filter((item) => !ids.includes(item && item.id));
      summary.deleted += before - store[collection].length;
      if (collection === 'emailLog') {
        store.emailQueue = store.emailQueue.filter((row) => !ids.includes(row.id));
      }
    }
    if (payload.settings && typeof payload.settings === 'object') {
      store.settings = clone(payload.settings);
      summary.settings = true;
    }
    writeStore();
    return summary;
  }

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

  const findUser = (list) => (list || []).find(
    (user) => String(user.username || '') === String(username || '').trim()
  );

  let user = null;
  if (getBackendMode() === 'file') {
    user = findUser(readStore().users);
  } else {
    const { rows } = await getPool().query(
      `select doc from users where doc->>'username' = $1 limit 1`,
      [String(username || '').trim()]
    );
    user = rows[0] && rows[0].doc;
  }

  if (!user || user.password !== String(password || '').trim()) return null;
  if (user.role === 'candidate') return null;
  return user;
}

async function getSettings() {
  await ensureSchema();
  if (getBackendMode() === 'file') return clone(readStore().settings) || {};
  const { rows } = await getPool().query('select doc from app_settings where id = 1');
  return (rows[0] && rows[0].doc) || {};
}

async function counts() {
  await ensureSchema();
  const out = {};
  if (getBackendMode() === 'file') {
    const store = readStore();
    COLLECTIONS.forEach((collection) => { out[collection] = (store[collection] || []).length; });
    return out;
  }
  for (const collection of COLLECTIONS) {
    const { rows } = await getPool().query(`select count(*)::int as total from ${TABLES[collection]}`);
    out[collection] = rows[0].total;
  }
  return out;
}

// ────────────────────────────────────────────────────────────────
// Hàng đợi email — cùng API cho cả hai backend
// ────────────────────────────────────────────────────────────────
const mailQueue = {
  async listPending(minCreatedAt) {
    await ensureSchema();
    const since = minCreatedAt || '1970-01-01T00:00:00.000Z';

    if (getBackendMode() === 'file') {
      const store = readStore();
      return store.emailQueue
        .filter((row) => !row.sent_at
          && (row.status === 'pending' || row.status === 'sent')
          && String((row.doc && row.doc.createdAt) || '') >= since)
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
        .slice(0, 25)
        .map((row) => ({ id: row.id, doc: clone(row.doc), to_email: row.to_email }));
    }

    const { rows } = await getPool().query(
      `select id, doc, to_email
         from email_log
        where sent_at is null
          and status in ('pending', 'sent')
          and coalesce(doc->>'createdAt', '') >= $1
        order by created_at asc
        limit 25`,
      [since]
    );
    return rows;
  },

  async claim(id) {
    await ensureSchema();
    if (getBackendMode() === 'file') {
      const row = readStore().emailQueue.find((item) => item.id === id);
      if (!row || row.sent_at || !['pending', 'sent'].includes(row.status)) return false;
      row.status = 'sending';
      writeStore();
      return true;
    }
    const result = await getPool().query(
      `update email_log
          set status = 'sending'
        where id = $1 and sent_at is null and status in ('pending', 'sent')
        returning id`,
      [id]
    );
    return result.rowCount > 0;
  },

  async markResult(id, result) {
    await ensureSchema();
    const status = result.status;
    if (getBackendMode() === 'file') {
      const store = readStore();
      const row = store.emailQueue.find((item) => item.id === id);
      if (!row) return;
      row.status = status;
      row.provider = result.provider || null;
      row.provider_message_id = result.messageId || null;
      row.preview_url = result.previewUrl || null;
      row.error = result.error || null;
      if (status === 'sent') row.sent_at = new Date().toISOString();
      writeStore();
      return;
    }
    await getPool().query(
      `update email_log
          set status = $2, provider = $3, provider_message_id = $4,
              preview_url = $5,
              sent_at = case when $2 = 'sent' then now() else sent_at end,
              error = null
        where id = $1`,
      [id, status, result.provider || null, result.messageId || null, result.previewUrl || null]
    );
  },

  async markFailed(id, message) {
    await ensureSchema();
    if (getBackendMode() === 'file') {
      const row = readStore().emailQueue.find((item) => item.id === id);
      if (!row) return;
      row.status = 'failed';
      row.error = String(message || '').slice(0, 500);
      writeStore();
      return;
    }
    await getPool().query('update email_log set status = $2, error = $3 where id = $1', [
      id,
      'failed',
      String(message || '').slice(0, 500),
    ]);
  },

  async stats() {
    await ensureSchema();
    if (getBackendMode() === 'file') {
      const stats = {};
      readStore().emailQueue.forEach((row) => {
        stats[row.status] = (stats[row.status] || 0) + 1;
      });
      return stats;
    }
    const { rows } = await getPool().query(
      'select status, count(*)::int as total from email_log group by status'
    );
    const stats = {};
    rows.forEach((row) => { stats[row.status] = row.total; });
    return stats;
  },

  /** Danh sách thư gần nhất cho trang Hộp thư ứng viên. */
  async list(limit = 200) {
    await ensureSchema();
    const capped = Math.max(1, Math.min(500, Number(limit) || 200));

    if (getBackendMode() === 'file') {
      return readStore().emailQueue
        .slice()
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, capped)
        .map((row) => this._shape(row));
    }

    const { rows } = await getPool().query(
      `select id, type, to_email, subject, status, provider, preview_url, error, created_at, sent_at
         from email_log
        order by created_at desc
        limit $1`,
      [capped]
    );
    return rows.map((row) => this._shape(row));
  },

  /** Chuẩn hoá một dòng hàng đợi về dạng dùng chung cho UI. */
  _shape(row) {
    return {
      id: row.id,
      type: row.type,
      to: row.to_email,
      subject: row.subject,
      status: row.status,
      provider: row.provider,
      previewUrl: row.preview_url || row.previewUrl || null,
      error: row.error || null,
      createdAt: row.created_at || row.createdAt || null,
      sentAt: row.sent_at || row.sentAt || null,
    };
  },

  async recent(limit = 5) {
    return this.list(limit);
  },
};

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  COLLECTIONS,
  TABLES,
  getBackendMode,
  getPool,
  ensureSchema,
  getState,
  applySync,
  getSettings,
  mailQueue,
  login,
  seedIfEmpty,
  counts,
  closePool,
};
