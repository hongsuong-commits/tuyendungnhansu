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

// Serverless: dùng pool nhỏ để không vượt giới hạn kết nối của Supabase,
// và ghi tệp tạm vào /tmp (ổ đĩa của function là chỉ-đọc).
if (process.env.VERCEL) {
  process.env.DB_POOL_MAX = process.env.DB_POOL_MAX || '3';
  process.env.MAIL_OUTBOX_DIR = process.env.MAIL_OUTBOX_DIR || '/tmp/mail-outbox';
}

const { loadEnv } = require('../src/server/env');
loadEnv();

const db = require('../src/server/db');
const mailer = require('../src/server/mailer');

let booted = false;

/** Tạo bảng + nạp dữ liệu mẫu một lần cho mỗi cold start. */
async function ensureBoot() {
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
  return sendJson(res, status, {
    ok: false,
    message,
    detail: /DATABASE_URL|password|connect|ENOTFOUND|ECONNREFUSED/i.test(message)
      ? 'Kiểm tra biến môi trường DATABASE_URL và kết nối Supabase.'
      : undefined,
  });
}

module.exports = { db, mailer, ensureBoot, sendJson, readBody, fail, path };
