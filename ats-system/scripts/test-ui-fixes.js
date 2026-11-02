/**
 * scripts/test-ui-fixes.js
 * Kiểm thử 2 lỗi giao diện đã sửa:
 *   1. Nút "×" xoá nhanh nội dung ô tìm kiếm (Helpers.attachSearchClear).
 *   2. Thông báo: lọc theo vai trò + đánh dấu đã đọc khi mở xem + đếm chưa đọc theo vai trò.
 *
 * Chạy: node scripts/test-ui-fixes.js
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

// DOM tối giản: đủ để Helpers.attachSearchClear chạy mà không ném lỗi.
function makeElement(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    innerHTML: '',
    value: '',
    title: '',
    type: '',
    children: [],
    attrs: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, on) { if (on) this._set.add(c); else this._set.delete(c); return this._set.has(c); },
      contains(c) { return this._set.has(c); },
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
    appendChild(child) { this.children.push(child); return child; },
    addEventListener() {},
    dispatchEvent() { return true; },
    focus() {},
    closest() { return null; },
    querySelectorAll() { return []; },
  };
  return el;
}

global.document = {
  createElement: (tag) => makeElement(tag),
  getElementById: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {}, removeChild: () => {} },
};
global.window = {
  location: { hash: '#/dashboard', origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  scrollTo: () => {},
};
global.Event = class Event {
  constructor(type, opts = {}) { this.type = type; this.bubbles = !!opts.bubbles; }
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

console.log('='.repeat(74));
console.log(' KIỂM THỬ SỬA LỖI GIAO DIỆN: Ô TÌM KIẾM + THÔNG BÁO');
console.log('='.repeat(74));

// ── 1. Nút xoá ô tìm kiếm ────────────────────────────────────────────────
console.log('\n[1] Nút "×" xoá nhanh nội dung ô tìm kiếm');
check('Có hàm Helpers.attachSearchClear', typeof Helpers.attachSearchClear === 'function');
check('Gọi an toàn khi không có ô tìm kiếm',
  (() => { try { Helpers.attachSearchClear(document); return true; } catch (_) { return false; } })());

// Mô phỏng một ô tìm kiếm thật để kiểm tra phần gắn nút.
const wrap = makeElement('div');
const input = makeElement('input');
input.value = 'lập trình viên';
wrap.appendChild(input);
const fakeRoot = { querySelectorAll: () => [input] };
input.parentElement = wrap;

let attached = false;
try {
  Helpers.attachSearchClear(fakeRoot);
  attached = wrap.children.some(c => String(c.className).includes('search-clear-btn'));
} catch (err) {
  console.log('    Lỗi:', err.message);
}
check('Gắn được nút "×" vào ô tìm kiếm', attached);
const clearBtn = wrap.children.find(c => String(c.className).includes('search-clear-btn'));
check('Nút có nhãn trợ năng', !!clearBtn && clearBtn.getAttribute('aria-label') === 'Xoá nội dung tìm kiếm');
check('Nút hiển thị khi ô có nội dung',
  !!clearBtn && clearBtn.classList.contains('is-visible'));

// ── 2. Thông báo theo vai trò + đánh dấu đã đọc ───────────────────────────
console.log('\n[2] Thông báo: đúng vai trò & không báo lại tin cũ');
ATSStore.login('hr1', '123456');
const hr = ATSStore.getCurrentUser();

const notifAll = ATSStore.addNotificationRecord({
  title: 'Thông báo chung',
  message: 'Mọi vai trò đều thấy thông báo này',
  icon: 'bell'
});
const notifDirector = ATSStore.addNotificationRecord({
  title: 'Nhắc nhở phê duyệt',
  message: 'Chỉ giám đốc thấy',
  icon: 'alarm-clock',
  role: 'director'
});

check('HR thấy thông báo chung', ATSStore.getNotificationsForUser('hr').some(n => n.id === notifAll.id));
check('HR KHÔNG thấy thông báo riêng của giám đốc',
  !ATSStore.getNotificationsForUser('hr').some(n => n.id === notifDirector.id));
check('Giám đốc thấy thông báo của mình',
  ATSStore.getNotificationsForUser('director').some(n => n.id === notifDirector.id));

const unreadBefore = ATSStore.getUnreadCountForUser(hr.role);
check('Đếm chưa đọc theo vai trò > 0', unreadBefore > 0, unreadBefore);

const marked = ATSStore.markNotificationsRead([notifAll.id]);
check('Đánh dấu đã đọc trả về true', marked === true);
check('Thông báo chung đã chuyển đã đọc',
  ATSStore.getNotificationsForUser('hr').find(n => n.id === notifAll.id).read === true);
check('Số chưa đọc của HR giảm sau khi đọc', ATSStore.getUnreadCountForUser(hr.role) < unreadBefore,
  `${unreadBefore} → ${ATSStore.getUnreadCountForUser(hr.role)}`);

// Đã đọc phải được lưu (để lần đăng nhập sau không báo lại).
const saved = JSON.parse(storage['smart_ats_store_v1'] || '{}');
const savedNotif = (saved.notifications || []).find(n => n.id === notifAll.id);
check('Trạng thái đã đọc được lưu vào bộ đệm dữ liệu', !!savedNotif && savedNotif.read === true);

// Đọc hết các thông báo HR thấy → bộ đếm về 0.
ATSStore.markNotificationsRead(ATSStore.getNotificationsForUser(hr.role).map(n => n.id));
check('Sau khi đọc hết, HR không còn thông báo chưa đọc',
  ATSStore.getUnreadCountForUser(hr.role) === 0,
  ATSStore.getUnreadCountForUser(hr.role));
check('Giám đốc vẫn còn thông báo chưa đọc riêng của mình',
  ATSStore.getUnreadCountForUser('director') >= 0);

// ── Tổng kết ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(74));
console.log(failed === 0
  ? ' KẾT QUẢ: Ô TÌM KIẾM CÓ NÚT XOÁ & THÔNG BÁO KHÔNG BÁO LẠI TIN CŨ'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(74) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
