/**
 * api/_lib.js — Tiện ích dùng chung cho Vercel Serverless Functions.
 *
 * Vercel KHÔNG chạy server.js (tiến trình Node thường trực); mỗi file trong
 * thư mục api/ trở thành một hàm serverless. File này nạp lớp truy cập
 * PostgreSQL/mailer của dự án và cung cấp helper đọc/ghi JSON.
 *
 * Biến môi trường cần khai báo trong Vercel → Settings → Environment Variables:
 *   DATABASE_URL   (chuỗi Session Pooler của Supabase)
 *   DB_SSL=true
 *   EMAIL_TRANSPORT=smtp
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM
 */
const path = require('path');
const crypto = require('crypto');

// Serverless: dùng pool nhỏ để không vượt giới hạn kết nối của Supabase,
// ghi tệp tạm vào /tmp (ổ đĩa của function là chỉ-đọc) và luôn dùng PostgreSQL
// (backend tệp không hoạt động được trên Vercel).
if (process.env.VERCEL) {
  process.env.DB_POOL_MAX = process.env.DB_POOL_MAX || '3';
  process.env.MAIL_OUTBOX_DIR = process.env.MAIL_OUTBOX_DIR || '/tmp/mail-outbox';
  if (!process.env.DB_BACKEND) process.env.DB_BACKEND = 'postgres';
}

const { loadEnv } = require('../src/server/env');
loadEnv();

const db = require('../src/server/db');
const mailer = require('../src/server/mailer');

function dsnConfigured() {
  loadEnv();
  return Boolean(String(process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim());
}

let booted = false;

/** Tạo bảng + nạp dữ liệu mẫu một lần cho mỗi cold start. */
async function ensureBoot() {
  if (!dsnConfigured()) {
    const err = new Error(
      'Chưa cấu hình DATABASE_URL. Vào Vercel → Project → Settings → Environment Variables, '
      + 'thêm DATABASE_URL (chuỗi Session Pooler của Supabase) cùng DB_SSL=true, sau đó Redeploy.'
    );
    err.status = 503;
    throw err;
  }
  if (booted) return;
  await db.ensureSchema();
  await db.seedIfEmpty();
  booted = true;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);

    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) {
        reject(Object.assign(new Error('Dữ liệu gửi lên quá lớn'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (_) {
        reject(Object.assign(new Error('JSON không hợp lệ'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function fail(res, err) {
  const status = err && err.status ? err.status : 503;
  const message = err && err.message ? err.message : 'Lỗi máy chủ';
  const needsHint = !/DATABASE_URL/i.test(message)
    && /password|connect|ENOTFOUND|ECONNREFUSED|timeout/i.test(message);
  return sendJson(res, status, {
    ok: false,
    message,
    detail: needsHint ? 'Kiểm tra biến môi trường DATABASE_URL và kết nối Supabase.' : undefined,
  });
}

module.exports = { db, mailer, ensureBoot, sendJson, readBody, fail, path, signToken, requireAuth, authEnabled };

// ────────────────────────────────────────────────────────────────
// Token phiên (HMAC-SHA256) — bảo vệ API khi bật AUTH_REQUIRED=true
// ────────────────────────────────────────────────────────────────
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function authSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || 'smartats-local-secret';
}

function authEnabled() {
  return String(process.env.AUTH_REQUIRED || '').toLowerCase() === 'true';
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;

  const expected = crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims || !claims.exp || Date.now() > claims.exp) return null;
    return claims;
  } catch (_) {
    return null;
  }
}

/** Kiểm tra token trên request. Khi AUTH_REQUIRED != true thì cho qua (tương thích). */
function requireAuth(req) {
  if (!authEnabled()) return { ok: true, enforced: false };

  const header = String(
    (req.headers && (req.headers.authorization || req.headers.Authorization)) || ''
  );
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const claims = verifyToken(token);

  return claims ? { ok: true, enforced: true, claims } : { ok: false, enforced: true };
}
