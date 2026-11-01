/**
 * scripts/test-auth-guard.js
 * Kiểm thử PHÂN QUYỀN & BẢO MẬT ĐIỀU HƯỚNG:
 *   - Chưa đăng nhập: không được vào trang quản trị, bị đẩy về #/portal.
 *   - Đã đăng nhập: được vào khu vực quản trị theo đúng vai trò.
 *   - Đăng xuất: xoá phiên + token + bản đệm dữ liệu (không tự đăng nhập lại).
 *   - Phiên có hạn 12 giờ; token phiên lấy từ /api/login.
 *
 * Chạy: node scripts/test-auth-guard.js
 */
const fs = require('fs');
const path = require('path');

// ── Mock môi trường trình duyệt ────────────────────────────────────────────
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};
global.window = {
  location: { hash: '#/portal', origin: 'http://localhost:3000', pathname: '/' },
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

const ROOT = path.join(__dirname, '..');
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

const INTERNAL_PAGES = ['dashboard', 'requisitions', 'candidates', 'screening', 'interviews',
  'evaluations', 'reports', 'postings', 'users', 'settings', 'notifications', 'profile'];

console.log('='.repeat(72));
console.log(' KIỂM THỬ PHÂN QUYỀN & BẢO MẬT ĐIỀU HƯỚNG');
console.log('='.repeat(72));

// ── 1. Chưa đăng nhập ─────────────────────────────────────────────────────
console.log('\n[1] Chưa đăng nhập — chặn toàn bộ trang quản trị');
check('Không có người dùng hiện tại', ATSStore.getCurrentUser() === null, ATSStore.getCurrentUser());
check('Phiên không hợp lệ', ATSStore.isSessionValid() === false);

const blocked = INTERNAL_PAGES.filter((page) => {
  const access = Helpers.resolveRouteAccess(page, null);
  return !access.allowed && access.redirect === '#/portal';
});
check(`Chặn đủ ${INTERNAL_PAGES.length} trang quản trị và đẩy về #/portal`,
  blocked.length === INTERNAL_PAGES.length, blocked);

check('Cho phép vào #/portal khi chưa đăng nhập',
  Helpers.resolveRouteAccess('portal', null).allowed === true);
check('Cho phép vào #/login khi chưa đăng nhập',
  Helpers.resolveRouteAccess('login', null).allowed === true);

// init() không được tự tạo phiên đăng nhập.
global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
(async () => {
  await ATSStore.init();
  check('Gọi init() khi chưa đăng nhập KHÔNG tạo phiên', ATSStore.getCurrentUser() === null, ATSStore.getCurrentUser());

  // ── 2. Đăng nhập bằng API (có token) ───────────────────────────────────
  console.log('\n[2] Đăng nhập qua API — nhận token phiên');
  const hrUser = ATSStore.getUsers().find(u => u.username === 'hr1');
  global.fetch = async (url) => {
    if (String(url).includes('/api/login')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, user: hrUser, token: 'fake.token.value', expiresIn: 43200 }),
      };
    }
    return { ok: false, status: 503, json: async () => ({}) };
  };

  const loginResult = await ATSStore.loginWithServer('hr1', '123456');
  check('Đăng nhập thành công', loginResult.success === true, loginResult.message);
  check('Đã lưu người dùng hiện tại', ATSStore.getCurrentUser() && ATSStore.getCurrentUser().role === 'hr');
  check('Đã lưu token phiên', ATSStore.getAuthToken() === 'fake.token.value', ATSStore.getAuthToken());
  check('Phiên hợp lệ', ATSStore.isSessionValid() === true);

  // ── 3. Đã đăng nhập — vào được trang quản trị ─────────────────────────
  console.log('\n[3] Đã đăng nhập — vào được khu vực quản trị theo vai trò');
  const hr = ATSStore.getCurrentUser();
  check('HR vào được #/interviews', Helpers.resolveRouteAccess('interviews', hr).allowed === true);
  check('HR vào được #/settings', Helpers.resolveRouteAccess('settings', hr).allowed === true);
  check('HR vào được #/users', Helpers.resolveRouteAccess('users', hr).allowed === true);
  check('HR vào #/login bị đẩy về #/dashboard',
    Helpers.resolveRouteAccess('login', hr).allowed === false
    && Helpers.resolveRouteAccess('login', hr).redirect === '#/dashboard');

  const deptHead = ATSStore.getUsers().find(u => u.username === 'head_it');
  check('Trưởng phòng KHÔNG vào được #/settings',
    Helpers.resolveRouteAccess('settings', deptHead).allowed === false);
  check('Trưởng phòng vào được #/interviews',
    Helpers.resolveRouteAccess('interviews', deptHead).allowed === true);

  const director = ATSStore.getUsers().find(u => u.username === 'director');
  check('Giám đốc vào được #/reports', Helpers.resolveRouteAccess('reports', director).allowed === true);
  check('Giám đốc KHÔNG vào được #/users (ngoài quyền)',
    Helpers.resolveRouteAccess('users', director).allowed === false);

  // ── 4. Đăng xuất — xoá sạch phiên ─────────────────────────────────────
  console.log('\n[4] Đăng xuất — xoá phiên, token và bản đệm dữ liệu');
  ATSStore.logout();
  check('Không còn người dùng sau đăng xuất', ATSStore.getCurrentUser() === null);
  check('Đã xoá token', ATSStore.getAuthToken() === '');
  check('Đã xoá user khỏi localStorage', !storage['smart_ats_current_user']);
  check('Đã xoá mốc phiên', !storage['smart_ats_session_started_at']);
  check('Đã xoá bản đệm dữ liệu', !storage['smart_ats_store_v1']);
  check('Sau đăng xuất, #/interviews bị chặn',
    Helpers.resolveRouteAccess('interviews', null).allowed === false
    && Helpers.resolveRouteAccess('interviews', null).redirect === '#/portal');

  // ── 5. Phiên hết hạn ──────────────────────────────────────────────────
  console.log('\n[5] Phiên hết hạn sau 12 giờ');
  ATSStore.setCurrentUser(hrUser);
  check('Có phiên hợp lệ ngay sau đăng nhập', ATSStore.isSessionValid() === true);
  storage['smart_ats_session_started_at'] = String(Date.now() - 13 * 60 * 60 * 1000); // 13 giờ trước
  check('Phiên quá 12 giờ bị coi là hết hạn', ATSStore.isSessionValid() === false);

  // ── 6. Đăng nhập sai ──────────────────────────────────────────────────
  console.log('\n[6] Đăng nhập sai mật khẩu');
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }),
  });
  ATSStore.setCurrentUser(null);
  const bad = await ATSStore.loginWithServer('hr1', 'sai-mat-khau');
  check('Từ chối đăng nhập sai', bad.success === false, bad.message);
  check('Không tạo phiên khi đăng nhập sai', ATSStore.getCurrentUser() === null);

  console.log('\n' + '='.repeat(72));
  console.log(failed === 0
    ? ' KẾT QUẢ: PHÂN QUYỀN & BẢO MẬT ĐIỀU HƯỚNG HOẠT ĐỘNG ĐÚNG'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(72) + '\n');
  process.exitCode = failed === 0 ? 0 : 1;
})();
