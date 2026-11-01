/**
 * scripts/test-vercel-api.js
 * Kiểm thử các Vercel Serverless Function (api/*.js) bằng cách gọi trực tiếp
 * handler với request/response giả — đúng cách Vercel gọi chúng.
 *
 * Chạy: node scripts/test-vercel-api.js   (cần .env có DATABASE_URL)
 */
const path = require('path');

const ROOT = path.join(__dirname, '..');
function handler(relPath) {
  return require(path.join(ROOT, relPath));
}

function makeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(chunk) { this.body = chunk == null ? '' : String(chunk); },
    json() { try { return JSON.parse(this.body); } catch (_) { return null; } },
  };
}

async function invoke(fn, { method = 'GET', url = '/', body = undefined } = {}) {
  const req = { method, url, headers: {}, body };
  const res = makeResponse();
  await fn(req, res);
  return res;
}

let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}

(async () => {
  console.log('='.repeat(70));
  console.log(' KIỂM THỬ VERCEL SERVERLESS API (api/*.js)');
  console.log('='.repeat(70));

  // ── /api/health ────────────────────────────────────────────────────────
  const health = await invoke(handler('api/health.js'));
  const healthJson = health.json();
  console.log(`\n/api/health -> HTTP ${health.statusCode}`);
  check('health trả 200', health.statusCode === 200, health.statusCode);
  check('health báo database = postgres', healthJson && healthJson.database === 'postgres', healthJson && healthJson.database);
  check('health có số bản ghi users', healthJson && healthJson.counts && healthJson.counts.users > 0, healthJson && healthJson.counts);
  check('health báo chế độ gửi thư', healthJson && healthJson.mail && !!healthJson.mail.mode, healthJson && healthJson.mail);

  // ── /api/state ─────────────────────────────────────────────────────────
  const state = await invoke(handler('api/state.js'), { method: 'GET', url: '/api/state' });
  const stateJson = state.json();
  console.log(`/api/state -> HTTP ${state.statusCode}`);
  check('state trả 200', state.statusCode === 200, state.statusCode);
  check('state có dữ liệu users từ DB', stateJson && stateJson.data && stateJson.data.users.length > 0);
  check('state có applications', stateJson && stateJson.data && Array.isArray(stateJson.data.applications));
  check('state có settings', stateJson && stateJson.data && !!stateJson.data.settings);

  // ── /api/login ─────────────────────────────────────────────────────────
  const okLogin = await invoke(handler('api/login.js'), {
    method: 'POST', url: '/api/login', body: { username: 'hr1', password: '123456' },
  });
  check('login đúng -> 200', okLogin.statusCode === 200, okLogin.statusCode);
  check('login trả user hr', okLogin.json() && okLogin.json().user && okLogin.json().user.username === 'hr1');

  const badLogin = await invoke(handler('api/login.js'), {
    method: 'POST', url: '/api/login', body: { username: 'hr1', password: 'sai-mat-khau' },
  });
  check('login sai -> 401', badLogin.statusCode === 401, badLogin.statusCode);

  // ── /api/sync (payload rỗng, không đổi dữ liệu) ────────────────────────
  const sync = await invoke(handler('api/sync.js'), {
    method: 'POST', url: '/api/sync', body: { upserts: {}, deletes: {} },
  });
  const syncJson = sync.json();
  console.log(`/api/sync -> HTTP ${sync.statusCode} ${JSON.stringify(syncJson)}`);
  check('sync trả 200', sync.statusCode === 200, sync.statusCode);
  check('sync báo ok', syncJson && syncJson.ok === true);

  // ── /api/emails ────────────────────────────────────────────────────────
  const emails = await invoke(handler('api/emails.js'), { method: 'GET', url: '/api/emails?limit=5' });
  check('emails trả 200', emails.statusCode === 200, emails.statusCode);
  check('emails trả mảng', emails.json() && Array.isArray(emails.json().emails));

  // ── 405 cho sai phương thức ────────────────────────────────────────────
  const wrongMethod = await invoke(handler('api/state.js'), { method: 'POST', url: '/api/state', body: {} });
  check('state với POST -> 405', wrongMethod.statusCode === 405, wrongMethod.statusCode);

  console.log('\n' + '='.repeat(70));
  console.log(failed === 0
    ? ' KẾT QUẢ: TẤT CẢ SERVERLESS API HOẠT ĐỘNG'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(70) + '\n');
  await new Promise((r) => setTimeout(r, 200));
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('Lỗi kiểm thử:', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
