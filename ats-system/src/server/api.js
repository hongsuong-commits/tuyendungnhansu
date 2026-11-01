/**
 * src/server/api.js
 * REST API của SmartATS. Toàn bộ dữ liệu nghiệp vụ được đọc/ghi trên PostgreSQL,
 * trình duyệt chỉ giữ một bản sao trong bộ nhớ để giao diện cũ tiếp tục chạy đồng bộ.
 */
const db = require('./db');
const mailer = require('./mailer');

const MAX_BODY_BYTES = 8 * 1024 * 1024;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
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

async function handleApi(req, res, options) {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname.replace(/\/+$/, '');
  const method = req.method.toUpperCase();

  try {
    if (route === '/api/health' && method === 'GET') {
      const counts = await db.counts();
      const mail = await mailer.queueStats();
      return sendJson(res, 200, {
        ok: true,
        service: 'smartats-api',
        database: 'postgres',
        counts,
        mail,
        startedAt: options.startedAt,
      });
    }

    if (route === '/api/state' && method === 'GET') {
      const data = await db.getState();
      return sendJson(res, 200, { ok: true, data });
    }

    if (route === '/api/sync' && method === 'POST') {
      const payload = await readBody(req);
      const summary = await db.applySync(payload);
      // Thư mới (mời phỏng vấn, đổi lịch, kết quả...) được gửi ngay sau khi ghi.
      mailer.processQueue(options.mailSince).catch((err) => {
        console.error('[mail] hàng đợi lỗi:', err.message);
      });
      return sendJson(res, 200, { ok: true, ...summary });
    }

    if (route === '/api/login' && method === 'POST') {
      const body = await readBody(req);
      const user = await db.login(body.username, body.password);
      if (!user) {
        return sendJson(res, 401, { ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }
      const { password, ...safeUser } = user;
      return sendJson(res, 200, { ok: true, user: safeUser });
    }

    if (route === '/api/mail/process' && method === 'POST') {
      const result = await mailer.processQueue(options.mailSince);
      return sendJson(res, 200, { ok: true, ...result });
    }

    return sendJson(res, 404, { ok: false, message: 'Không tìm thấy API.' });
  } catch (err) {
    console.error('[api]', err);
    return sendJson(res, err.status || 500, {
      ok: false,
      message: err.status ? err.message : 'Lỗi máy chủ khi xử lý yêu cầu.',
      detail: process.env.NODE_ENV === 'development' ? String(err.message) : undefined,
    });
  }
}

module.exports = { handleApi };
