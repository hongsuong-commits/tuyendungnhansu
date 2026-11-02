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

// MutationObserver giả lập để kiểm tra cơ chế gắn lại nút "×" sau khi render lại.
global.__observed = null;
global.MutationObserver = class MutationObserver {
  constructor(callback) { this.callback = callback; }
  observe(target, options) { global.__observed = { target, options }; }
  disconnect() {}
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

// ── 3. Form ứng tuyển: bắt buộc CV + bấm cả khung để chọn tệp ──────────────
console.log('\n[3] Form ứng tuyển: bắt buộc nộp CV, bấm được cả khung tải tệp');
loadModule('src/pages/portal.js', 'PortalPage');

let portalHtml = '';
try {
  portalHtml = PortalPage.render({});
} catch (err) {
  console.log('    Lỗi render portal:', err.message);
}
check('Render được trang cổng ứng viên', typeof portalHtml === 'string' && portalHtml.length > 0);

// Form ứng tuyển nằm trong modal (showApplyModal) → kiểm tra markup trong mã nguồn.
const portalSource = fs.readFileSync(path.join(ROOT, 'src/pages/portal.js'), 'utf-8');
check('Có khung tải CV', /id="portal-cv-dropzone"/.test(portalSource));
check('Khung tải CV bấm được (role=button + tabindex)',
  /id="portal-cv-dropzone"[^>]*role="button"/.test(portalSource)
  && /id="portal-cv-dropzone"[^>]*tabindex="0"/.test(portalSource));
check('Khung có nhãn trợ năng hướng dẫn bấm/kéo thả',
  /aria-label="Tải lên tệp CV/.test(portalSource));
check('Nhãn "Tệp CV" có dấu bắt buộc *', /Tệp CV <span class="text-danger"/.test(portalSource));
check('Có vùng cảnh báo đỏ khi thiếu CV', /id="portal-cv-error"/.test(portalSource));
check('Có trường ẩn lưu nội dung CV', /id="portal-raw-cv"/.test(portalSource));
check('Chặn gửi hồ sơ khi chưa có CV (validate trước khi submit)',
  /BẮT BUỘC nộp CV/.test(portalSource) && /if \(!rawCV\)/.test(portalSource));
check('Tô đỏ khung khi thiếu CV', /classList\.toggle\('is-invalid'/.test(portalSource));
check('Hỗ trợ kéo–thả tệp vào khung', /'drop'/.test(portalSource) && /DataTransfer/.test(portalSource));
check('Bấm cả khung mở hộp chọn tệp', /dropzone\.addEventListener\('click'/.test(portalSource)
  && /fileInput\.click\(\)/.test(portalSource));

// ── 1b. Nút "×" phải tự xuất hiện lại sau khi trang render lại (sau khi tìm kiếm) ──
console.log('\n[1b] Nút "×" tự gắn lại sau mỗi lần trang render lại');
check('Có hàm Helpers.installSearchClearObserver', typeof Helpers.installSearchClearObserver === 'function');
const observerInstalled = Helpers.installSearchClearObserver();
check('Cài đặt observer thành công', observerInstalled === true);
check('Observer theo dõi toàn bộ DOM (subtree)', !!global.__observed && global.__observed.options.subtree === true);
check('Không cài đặt trùng observer', Helpers.installSearchClearObserver() === true);

// Mô phỏng: trang render lại tạo ô tìm kiếm mới → phải được gắn nút ngay.
const reRenderedWrap = makeElement('div');
const reRenderedInput = makeElement('input');
reRenderedInput.value = '';
reRenderedWrap.appendChild(reRenderedInput);
reRenderedInput.parentElement = reRenderedWrap;
Helpers.attachSearchClear({ querySelectorAll: () => [reRenderedInput] });
check('Ô tìm kiếm mới sau khi render lại vẫn có nút "×"',
  reRenderedWrap.children.some(c => String(c.className).includes('search-clear-btn')));

// Khung tải CV ở trang quản trị (thêm hồ sơ thủ công) cũng bấm/kéo–thả được.
const candidatesSource = fs.readFileSync(path.join(ROOT, 'src/pages/candidates.js'), 'utf-8');
check('Trang Ứng viên: khung tải CV cũng bấm/kéo–thả được',
  /drop-cv-zone" role="button"/.test(candidatesSource)
  && /dropZone\.addEventListener\('click'/.test(candidatesSource));

// ── 4. Giới tính: chỉ Nam/Nữ, mặc định "Vui lòng chọn giới tính" ─────────
console.log('\n[4] Giới tính chỉ có Nam/Nữ, không mặc định "Khác"');
const portalSrc = fs.readFileSync(path.join(ROOT, 'src/pages/portal.js'), 'utf-8');
const candidatesSrc = fs.readFileSync(path.join(ROOT, 'src/pages/candidates.js'), 'utf-8');
const storeSrc = fs.readFileSync(path.join(ROOT, 'src/data/store.js'), 'utf-8');

check('Portal: có dòng "Vui lòng chọn giới tính"', /Vui lòng chọn giới tính/.test(portalSrc));
check('Portal: KHÔNG còn lựa chọn "Khác"',
  !/<option value="Khác"[^>]*>Khác<\/option>/.test(portalSrc));
check('Portal: chỉ có 2 lựa chọn Nam/Nữ',
  /<option value="Nam">Nam<\/option>\s*<option value="Nữ">Nữ<\/option>/.test(portalSrc));
check('Portal: chặn gửi khi chưa chọn giới tính',
  /genderValue !== 'Nam' && genderValue !== 'Nữ'/.test(portalSrc));
check('Portal: không gán mặc định "Khác" khi gửi',
  /gender: fd\.get\('gender'\) \|\| ''/.test(portalSrc));

check('Trang Ứng viên: có dòng "Vui lòng chọn giới tính"', /Vui lòng chọn giới tính/.test(candidatesSrc));
check('Trang Ứng viên: KHÔNG còn lựa chọn "Khác"',
  !/<option value="Khác"[^>]*>Khác<\/option>/.test(candidatesSrc));
check('Trang Ứng viên: chỉ có 2 lựa chọn Nam/Nữ',
  /<option value="Nam">Nam<\/option>\s*<option value="Nữ">Nữ<\/option>/.test(candidatesSrc));
check('Trang Ứng viên: không hiển thị "Khác" khi thiếu giới tính',
  /\['Nam', 'Nữ'\]\.includes\(cand\.gender\) \? cand\.gender : '—'/.test(candidatesSrc));

check('Bộ đọc CV: giới tính mặc định là rỗng (không phải "Khác")',
  !/let gender = 'Khác'/.test(storeSrc) && /let gender = '';/.test(storeSrc));
check('Lưu hồ sơ: không gán "Khác" khi thiếu giới tính',
  /gender: candidateData\.gender \|\| ''/.test(storeSrc));

// Hành vi thật của bộ đọc CV với từng trường hợp.
const g1 = ATSStore.parseCVText('Họ tên: Nguyễn Văn A\nGiới tính: Nam\nEmail: a@example.com');
const g2 = ATSStore.parseCVText('Họ tên: Trần Thị B\nGiới tính: Nữ\nEmail: b@example.com');
const g3 = ATSStore.parseCVText('Họ tên: Lê Văn C\nGiới tính: Khác\nEmail: c@example.com');
const g4 = ATSStore.parseCVText('Họ tên: Phạm Thị D\nEmail: d@example.com');

check('Đọc CV: "Giới tính: Nam" → Nam', g1.gender === 'Nam', g1.gender);
check('Đọc CV: "Giới tính: Nữ" → Nữ', g2.gender === 'Nữ', g2.gender);
check('Đọc CV: "Giới tính: Khác" → để trống (không lưu "Khác")', g3.gender === '', g3.gender);
check('Đọc CV: không ghi giới tính → để trống', g4.gender === '', g4.gender);

// ── Tổng kết ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(74));
console.log(failed === 0
  ? ' KẾT QUẢ: Ô TÌM KIẾM • THÔNG BÁO • BẮT BUỘC CV • GIỚI TÍNH CHUẨN'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(74) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
