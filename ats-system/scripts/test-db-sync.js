/**
 * scripts/test-db-sync.js
 * Chứng minh dữ liệu được LƯU VÀO DATABASE QUA API (không chỉ localStorage).
 *
 * Cách kiểm chứng:
 *   1. Nạp ATSStore như trình duyệt, gọi ATSStore.init()  → GET /api/state.
 *   2. Thực hiện một thay đổi qua đúng hàm nghiệp vụ (updateSettings).
 *   3. Chờ cơ chế đồng bộ đẩy lên                          → POST /api/sync.
 *   4. Kiểm tra lại qua API /api/state (dữ liệu mới).
 *   5. Truy vấn TRỰC TIẾP PostgreSQL bằng pg để xác nhận bản ghi nằm trong DB.
 *   6. Khôi phục giá trị ban đầu để không để lại rác.
 *
 * Chạy khi server đang chạy:  node scripts/test-db-sync.js
 */
const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://localhost:3000';
const ROOT = path.join(__dirname, '..');

// ── Mock môi trường trình duyệt ────────────────────────────────────────────
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};
global.window = {
  location: { hash: '#/dashboard', origin: API, pathname: '/' },
  addEventListener: () => {},
  scrollTo: () => {},
};
global.document = {
  createElement: () => ({
    tagName: 'DIV', textContent: '', innerHTML: '',
    appendChild: () => {}, setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  getElementById: () => null,
  querySelectorAll: () => [],
};

// fetch của trình duyệt dùng URL tương đối; trong Node phải trỏ về máy chủ thật.
const nativeFetch = global.fetch;
global.fetch = (url, options) => {
  const target = String(url).startsWith('http') ? url : API + String(url);
  return nativeFetch(target, options);
};

function loadModule(relPath, globalName) {
  let code = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
  code = code.replace(new RegExp(`^const ${globalName} =`, 'm'), `global.${globalName} =`);
  (0, eval)(code);
}
loadModule('src/utils/helpers.js', 'Helpers');
loadModule('src/data/store.js', 'ATSStore');

let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readServerState() {
  const res = await fetch('/api/state');
  return (await res.json()).data;
}

async function queryDatabase() {
  const { loadEnv } = require('../src/server/env');
  loadEnv();
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  try {
    const { rows } = await client.query("select doc #>> '{hotline}' as hotline from app_settings where id = 1");
    return rows[0] ? rows[0].hotline : null;
  } finally {
    await client.end();
  }
}

(async () => {
  console.log('='.repeat(70));
  console.log(' KIỂM CHỨNG: LƯU DATABASE QUA API (KHÔNG CHỈ LOCALSTORAGE)');
  console.log('='.repeat(70));

  // ── 1. Nạp dữ liệu từ database ─────────────────────────────────────────
  const ok = await ATSStore.init();
  const status = ATSStore.getSyncStatus();
  console.log(`\ninit() = ${ok} | mode = ${status.mode} | lỗi = ${status.lastError || '(không)'}`);
  check('Ứng dụng nạp được dữ liệu từ database', ok === true);
  check('Chế độ lưu trữ = server (PostgreSQL)', status.mode === 'server', status.mode);
  check('ATSStore.isServerBacked() = true', ATSStore.isServerBacked() === true);

  const before = ATSStore.getSettings();
  const originalHotline = before.hotline;
  console.log(`Giá trị hotline hiện tại trong DB: "${originalHotline}"`);

  // ── 2. Thay đổi qua hàm nghiệp vụ → tự động POST /api/sync ─────────────
  const marker = 'TEST-SYNC-' + Date.now();
  ATSStore.updateSettings({ hotline: marker });
  console.log(`\nĐã gọi updateSettings({ hotline: "${marker}" }), chờ đồng bộ…`);
  await sleep(1500); // debounce 250ms + thời gian gửi

  // ── 3. Đọc lại qua API ─────────────────────────────────────────────────
  const serverState = await readServerState();
  check('API /api/state trả về giá trị mới', serverState.settings && serverState.settings.hotline === marker,
    serverState.settings && serverState.settings.hotline);

  // ── 4. Truy vấn trực tiếp PostgreSQL ───────────────────────────────────
  let dbValue = null;
  try {
    dbValue = await queryDatabase();
  } catch (err) {
    console.log('  (không truy vấn trực tiếp được DB:', err.message, ')');
  }
  console.log(`Giá trị hotline đọc trực tiếp từ PostgreSQL: "${dbValue}"`);
  check('Dữ liệu nằm thật trong PostgreSQL', dbValue === marker, dbValue);

  // ── 5. Khôi phục giá trị ban đầu ───────────────────────────────────────
  ATSStore.updateSettings({ hotline: originalHotline });
  await sleep(1500);
  const restored = await readServerState();
  check('Đã khôi phục giá trị ban đầu trong DB',
    restored.settings && restored.settings.hotline === originalHotline,
    restored.settings && restored.settings.hotline);

  // ── 6. Kiểm tra thay đổi chưa gửi được có được lưu lại không ───────────
  const pendingKey = 'smart_ats_sync_pending_v1';
  const hadPending = storage[pendingKey];
  check('Không còn thay đổi tồn đọng sau khi đồng bộ', !hadPending);

  console.log('\n' + '='.repeat(70));
  console.log(failed === 0
    ? ' KẾT QUẢ: DỮ LIỆU ĐƯỢC LƯU TRONG POSTGRESQL QUA API'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(70) + '\n');
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('Lỗi kiểm thử:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
