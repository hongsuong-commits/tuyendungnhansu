/**
 * server.js - SmartATS full-stack server
 * - Phục vụ giao diện tĩnh (HTML/CSS/JS) như trước
 * - REST API /api/* ghi dữ liệu nghiệp vụ vào PostgreSQL (Supabase)
 * - Gửi email tự động cho ứng viên ngay khi hồ sơ phát sinh thư trong hộp thư
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const { loadEnv } = require('./src/server/env');
loadEnv();

const db = require('./src/server/db');
const mailer = require('./src/server/mailer');
const { handleApi } = require('./src/server/api');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const options = {
  startedAt: new Date().toISOString(),
  // Chỉ gửi những thư được tạo trong phiên làm việc này; thư cũ nhập từ
  // localStorage của người dùng sẽ không bị gửi lại ngoài ý muốn.
  mailSince: new Date(Date.now() - 60 * 1000).toISOString(),
};

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  if (reqPath === '/api' || reqPath.startsWith('/api/')) {
    handleApi(req, res, options);
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not an asset
      if (!path.extname(reqPath) || reqPath.endsWith('.html')) {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(content);
          }
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('500 Server Error: ' + readErr.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

async function boot() {
  console.log('=====================================================');
  console.log('  SmartATS - Hệ thống Quản lý Tuyển dụng Thông minh  ');
  console.log('=====================================================');

  try {
    await db.ensureSchema();
    const seed = await db.seedIfEmpty();
    if (seed.seeded) console.log('[db] Đã nạp dữ liệu mẫu ban đầu vào PostgreSQL');
    else if (seed.reason) console.warn('[db] Không nạp được dữ liệu mẫu:', seed.reason);
    else console.log('[db] Dữ liệu đã có sẵn trong PostgreSQL');
    await mailer.init();
  } catch (err) {
    console.error('[db] Không kết nối được PostgreSQL:', err.message);
    console.error('      Giao diện vẫn chạy nhưng dữ liệu chỉ lưu tạm trong trình duyệt.');
  }

  setInterval(() => {
    mailer.processQueue(options.mailSince).catch((err) => {
      console.error('[mail] hàng đợi lỗi:', err.message);
    });
  }, 15000).unref();

  server.listen(PORT, () => {
    console.log(`  Máy chủ đang chạy tại: http://localhost:${PORT}`);
    console.log(`  Cổng ứng viên công khai: http://localhost:${PORT}/#/portal`);
    console.log(`  API: http://localhost:${PORT}/api/health`);
    console.log('=====================================================');
  });
}

boot();

process.on('SIGINT', async () => {
  console.log('\n[server] Đang dừng...');
  try { await db.closePool(); } catch (_) { /* ignore */ }
  process.exit(0);
});
