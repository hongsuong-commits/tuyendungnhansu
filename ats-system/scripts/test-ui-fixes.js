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

// ── 5. Màu trạng thái • nút quay lại • đánh giá 1–5 ─────────────────────
console.log('\n[5] Màu trạng thái, nút quay lại, thang điểm 1–5');
const designCss = fs.readFileSync(path.join(ROOT, 'src/styles/design.css'), 'utf-8');
const dashboardSrc = fs.readFileSync(path.join(ROOT, 'src/pages/dashboard.js'), 'utf-8');
const evalSrc = fs.readFileSync(path.join(ROOT, 'src/pages/evaluations.js'), 'utf-8');
const screeningSrc = fs.readFileSync(path.join(ROOT, 'src/pages/screening.js'), 'utf-8');
const candidatesSource2 = fs.readFileSync(path.join(ROOT, 'src/pages/candidates.js'), 'utf-8');
const helpersSrc = fs.readFileSync(path.join(ROOT, 'src/utils/helpers.js'), 'utf-8');

check('CSS có đủ 6 nhóm màu trạng thái',
  ['.status-success', '.status-warning', '.status-danger', '.status-info', '.status-primary', '.status-secondary']
    .every((cls) => designCss.includes(cls)));
check('Trạng thái "Đang tuyển" dùng màu info', /recruiting:\s*'status-info'/.test(helpersSrc));
check('Trạng thái "Đã tuyển" dùng màu success', /hired:\s*'status-success'/.test(helpersSrc));
check('Trạng thái "Chờ phê duyệt" dùng màu warning', /pending:\s*'status-warning'/.test(helpersSrc));
const badgeHtml = Helpers.statusBadge('recruiting');
check('statusBadge sinh class màu có định nghĩa CSS',
  /status-info/.test(badgeHtml) && designCss.includes('.status-info'));

check('Tổng quan: nút Mở hồ sơ mở đúng hồ sơ (tham số open)',
  /open: '\$\{app\.id\}'/.test(dashboardSrc));
check('Hồ sơ ứng viên có nút "Quay lại Tổng quan"', /Quay lại Tổng quan/.test(candidatesSource2));
check('Hồ sơ ứng viên tự tạo container khi mở từ trang khác',
  /candidate-modals-container/.test(candidatesSource2) && /document\.createElement\('div'\)/.test(candidatesSource2));
check('Sàng lọc: nút "Xem hồ sơ ứng viên đầy đủ" gọi đúng hàm',
  /showCandidateDetailModal\('\$\{app\.id\}'\)/.test(screeningSrc));

check('Đánh giá: chặn điểm ngoài thang 1–5', /value < 1 \|\| value > 5/.test(evalSrc));
check('Đánh giá: điểm tổng không cho nhập tay (readonly)',
  /id="eval-overall-score"[^>]*readonly/.test(evalSrc));

// Tầng dữ liệu cũng phải kẹp điểm ngoài 1–5.
const savedEval = ATSStore.createEvaluation({
  candidateId: 'cand_test_scale',
  requisitionId: 'req_test_scale',
  evaluatorName: 'Người kiểm thử',
  round: 'Vòng 1 - HR Sơ loại',
  scores: { professionalKnowledge: 9, workSkills: 0, experience: 3, teamworkCommunication: 4 },
  comment: 'Kiểm thử thang điểm'
});
check('Lưu phiếu: điểm 9 bị kẹp về 5', savedEval.scores.professionalKnowledge === 5, savedEval.scores.professionalKnowledge);
check('Lưu phiếu: điểm 0 bị kẹp về 1', savedEval.scores.workSkills === 1, savedEval.scores.workSkills);
check('Lưu phiếu: điểm tổng tính từ 1–5',
  savedEval.overallScore === Math.round(((5 + 1 + 3 + 4) / 4) * 20), savedEval.overallScore);

// ── 6. Tất cả ô "số năm" đều chặn số âm ──────────────────────────────────
console.log('\n[6] Chặn số âm ở TẤT CẢ ô nhập số năm');
const requisitionsSrc = fs.readFileSync(path.join(ROOT, 'src/pages/requisitions.js'), 'utf-8');

check('Ứng tuyển công khai: chặn số âm (0–60)',
  /id="portal-exp"[\s\S]{0,200}Math\.max\(0, Math\.min\(60/.test(portalSrc));
check('Tải CV thủ công: chặn số âm (0–60)',
  /id="upload-exp"[\s\S]{0,200}Math\.max\(0, Math\.min\(60/.test(candidatesSrc));
check('Sàng lọc CV: chặn số âm kinh nghiệm tối thiểu (0–20)',
  /id="criteria-exp-input"[\s\S]{0,200}Math\.max\(0, Math\.min\(20/.test(screeningSrc));
check('Yêu cầu tuyển dụng (Trưởng phòng): chặn số âm (0–60)',
  /id="req-min-exp"[\s\S]{0,200}Math\.max\(0, Math\.min\(60/.test(requisitionsSrc));
check('Yêu cầu tuyển dụng: chặn lưu khi ngoài 0–60',
  /isValidExperienceYears\(minExperienceValue\)/.test(requisitionsSrc));
check('Sàng lọc CV: chặn lưu khi ngoài 0–20',
  /isValidExperienceYears\(minExp\) \|\| minExp > 20/.test(screeningSrc));

// Tầng dữ liệu cũng phải kẹp số âm.
const negativeReq = ATSStore.createRequisition({ title: 'Kiểm thử số âm', minExperience: -5 });
check('Lưu yêu cầu: minExperience âm bị kẹp về 0',
  negativeReq.minExperience === 0, negativeReq.minExperience);
const tooBigReq = ATSStore.createRequisition({ title: 'Kiểm thử quá lớn', minExperience: 99 });
check('Lưu yêu cầu: minExperience 99 bị kẹp về 60',
  tooBigReq.minExperience === 60, tooBigReq.minExperience);
ATSStore.updateRequisition(negativeReq.id, { minExperience: -2 });
check('Cập nhật yêu cầu: minExperience âm bị kẹp về 0',
  ATSStore.getRequisitionById(negativeReq.id).minExperience === 0,
  ATSStore.getRequisitionById(negativeReq.id).minExperience);

// ── 7. JD hiển thị số năm kinh nghiệm yêu cầu ────────────────────────────
console.log('\n[7] JD hiển thị số năm kinh nghiệm yêu cầu');
const portalSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/portal.js'), 'utf-8');
const postingsSrc = fs.readFileSync(path.join(ROOT, 'src/pages/postings.js'), 'utf-8');

check('Thẻ việc làm ở cổng ứng viên có "Kinh nghiệm"', /Kinh nghiệm: \$\{minExpText\}/.test(portalSrc2));
check('JD công khai có dòng "Kinh nghiệm tối thiểu"', /Kinh nghiệm tối thiểu:/.test(portalSrc2));
check('Trang Tin tuyển dụng: xem trước có "Kinh nghiệm tối thiểu"',
  /Kinh nghiệm tối thiểu:<\/span> <strong>\$\{Helpers\.formatMinExperience/.test(postingsSrc));
check('Định dạng 0 năm → "Không yêu cầu"', Helpers.formatMinExperience(0) === 'Không yêu cầu');
check('Định dạng 2 năm → "2 năm"', Helpers.formatMinExperience(2) === '2 năm');
check('Định dạng 2.5 năm → "2.5 năm"', Helpers.formatMinExperience(2.5) === '2.5 năm');

// Hành vi thật: tin tuyển dụng lưu kinh nghiệm từ yêu cầu và đọc lại đúng.
const postingReq = ATSStore.getRequisitions().find(r => r.status === 'approved' || r.status === 'recruiting');
if (postingReq) {
  const exp = Number(postingReq.minExperience || 0);
  const post = ATSStore.createPostingFromRequisition(postingReq.id, { title: 'Kiểm thử JD kinh nghiệm' });
  check('Tin tuyển dụng lưu minExperience từ yêu cầu gốc',
    Number(post.minExperience) === exp, post.minExperience);
  check('getPostingMinExperience đọc đúng từ tin', ATSStore.getPostingMinExperience(post) === exp,
    ATSStore.getPostingMinExperience(post));
  delete post.minExperience;
  check('Tin cũ chưa có minExperience → lấy từ yêu cầu gốc',
    ATSStore.getPostingMinExperience(post) === exp, ATSStore.getPostingMinExperience(post));
} else {
  check('Tìm được yêu cầu tuyển dụng để tạo tin kiểm thử', false);
}

// ── 8. Lỗi runtime & hiển thị ngày đúng múi giờ ──────────────────────────
console.log('\n[8] Sửa lỗi runtime và hiển thị ngày đúng');
const candidatesSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/candidates.js'), 'utf-8');
const interviewsSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/interviews.js'), 'utf-8');
const storeSrc2 = fs.readFileSync(path.join(ROOT, 'src/data/store.js'), 'utf-8');

check('candidates.js: nút Lên lịch nằm trong điều kiện chưa tuyển',
  /app\.status !== 'hired' \?[\s\S]{0,400}Lên lịch phỏng vấn/.test(candidatesSrc2));
check('interviews.js: dùng ATSStore.getApplicationById', /ATSStore\.getApplicationById/.test(interviewsSrc2));
check('interviews.js: không còn tham chiếu _data', !/_data\./.test(interviewsSrc2));
check('store.js: có isHiredInterview (ẩn lịch ứng viên đã tuyển)',
  /isHiredInterview/.test(storeSrc2) && /upcomingInterviewsList[\s\S]{0,200}isHiredInterview/.test(storeSrc2));
check('formatDate("2026-11-04") → 04/11/2026', Helpers.formatDate('2026-11-04') === '04/11/2026');
check('formatDate(Date object) → 04/11/2026', Helpers.formatDate(new Date(2026, 10, 4)) === '04/11/2026');
check('formatDate ISO timestamp giữ đúng ngày đã lưu',
  Helpers.formatDate('2026-11-04T17:00:00.000Z') === '04/11/2026');
check('toLocalDateStr trả YYYY-MM-DD theo giờ máy',
  Helpers.toLocalDateStr(new Date(2026, 10, 4)) === '2026-11-04');
check('interviews.js: không còn toISOString cho ngày lịch',
  !/toISOString\(\)\.split\('T'\)\[0\]/.test(interviewsSrc2));
check('interviews.js: ngày mặc định của form là hôm nay',
  /id="iv-date-input"[\s\S]{0,200}toLocalDateStr/.test(interviewsSrc2));
check('Lịch tuần: nhãn tuần dùng formatDate(Date) không qua UTC',
  /formatDate\(monday\)/.test(interviewsSrc2) && /formatDate\(sunday\)/.test(interviewsSrc2));

// ── 9. Phân quyền theo yêu cầu nghiệp vụ mới ─────────────────────────────
console.log('\n[9] Phân quyền & tinh gọn theo yêu cầu nghiệp vụ');
const settingsSrc = fs.readFileSync(path.join(ROOT, 'src/pages/settings.js'), 'utf-8');
const layoutSrc = fs.readFileSync(path.join(ROOT, 'src/components/layout.js'), 'utf-8');
const postingsSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/postings.js'), 'utf-8');
const screeningSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/screening.js'), 'utf-8');
const requisitionsSrc2 = fs.readFileSync(path.join(ROOT, 'src/pages/requisitions.js'), 'utf-8');

check('Cài đặt: đã bỏ khối "Cổng dịch vụ tích hợp (Integrations)"',
  !/Cổng dịch vụ tích hợp/.test(settingsSrc));
check('Menu: đổi tên thành "Tin tuyển dụng"',
  /label: 'Tin tuyển dụng'/.test(layoutSrc) && !/Vị trí & tin tuyển dụng/.test(layoutSrc));
check('Lịch phỏng vấn: chỉ HR được tạo lịch', /const canSchedule = user\.role === 'hr';/.test(interviewsSrc2));
check('Lịch phỏng vấn: chỉ HR được sửa/hủy lịch', /const canEdit = user\.role === 'hr';/.test(interviewsSrc2));
check('Lịch phỏng vấn: GĐ và Trưởng phòng vẫn được đánh giá',
  /canEvaluate = \['hr', 'director', 'department_head'\]/.test(interviewsSrc2));
check('Yêu cầu tuyển dụng: chỉ Trưởng phòng được chỉnh sửa',
  /const canEdit = \(user\.role === 'department_head'\)/.test(requisitionsSrc2));
check('Yêu cầu tuyển dụng: chỉ Trưởng phòng được hủy (store)',
  /Chỉ Trưởng phòng \(đúng phòng ban\) được hủy yêu cầu tuyển dụng/.test(storeSrc2));
check('Danh sách ứng viên: chỉ HR được duyệt hồ sơ',
  /const canManage = user\.role === 'hr';/.test(candidatesSrc2));
check('Tin tuyển dụng: có nút Xem / Sửa / Đăng lại / Đóng',
  /btn-preview-post/.test(postingsSrc2) && /btn-edit-post/.test(postingsSrc2)
  && /btn-republish-post/.test(postingsSrc2) && /btn-close-post/.test(postingsSrc2));
check('Tin tuyển dụng: bỏ nút Sao chép link và Cấu hình nguồn đăng',
  !/btn-share-post/.test(postingsSrc2) && !/btn-channels-post/.test(postingsSrc2));
check('Tin tuyển dụng: có modal chỉnh sửa + hàm đăng lại',
  /showEditPostModal\(/.test(postingsSrc2) && /republishPosting\(/.test(storeSrc2));
check('Sàng lọc CV: đã xóa nút "Chạy đọc CV mới ngay"',
  !/btn-open-live-scanner/.test(screeningSrc2) && !/Chạy đọc CV mới ngay/.test(screeningSrc2));

// Hành vi thật: sửa tin và đăng lại tin tuyển dụng.
const postingToEdit = ATSStore.getPostings().find(p => p.status === 'published') || ATSStore.getPostings()[0];
if (postingToEdit) {
  const editedPost = ATSStore.updatePosting(postingToEdit.id, { title: 'Tiêu đề đã chỉnh sửa (kiểm thử)' });
  check('Sửa tin: lưu tiêu đề mới', editedPost && editedPost.title === 'Tiêu đề đã chỉnh sửa (kiểm thử)', editedPost && editedPost.title);

  ATSStore.updatePosting(postingToEdit.id, { status: 'closed' });
  const republished = ATSStore.republishPosting(postingToEdit.id);
  check('Đăng lại tin: thành công', republished.success === true, republished.message);
  check('Đăng lại tin: trạng thái quay về "published"',
    ATSStore.getPostingById(postingToEdit.id).status === 'published',
    ATSStore.getPostingById(postingToEdit.id).status);
} else {
  check('Tìm được tin tuyển dụng để kiểm thử sửa/đăng lại', false);
}

// ── 10. Smoke test render thật các trang theo từng vai trò ────────────────
console.log('\n[10] Render thật các trang cho Giám đốc / Nhân sự / Trưởng phòng');
global.UI = global.UI || { toast() {}, confirm() {}, openModal() {}, closeModal() {} };
global.Router = global.Router || { navigate() {} };
global.lucide = global.lucide || { createIcons() {} };
loadModule('src/pages/interviews.js', 'InterviewsPage');
loadModule('src/pages/candidates.js', 'CandidatesPage');
loadModule('src/pages/requisitions.js', 'RequisitionsPage');
loadModule('src/pages/postings.js', 'PostingsPage');
loadModule('src/pages/dashboard.js', 'DashboardPage');
loadModule('src/pages/screening.js', 'ScreeningPage');
loadModule('src/pages/evaluations.js', 'EvaluationsPage');
loadModule('src/pages/reports.js', 'ReportsPage');
loadModule('src/pages/notifications.js', 'NotificationsPage');
loadModule('src/pages/users.js', 'UsersPage');
loadModule('src/pages/profile.js', 'ProfilePage');
loadModule('src/pages/settings.js', 'SettingsPage');
loadModule('src/pages/portal.js', 'PortalPage');

const roleUsers = {
  director: ATSStore.getUsers().find(u => u.role === 'director'),
  hr: ATSStore.getUsers().find(u => u.role === 'hr'),
  department_head: ATSStore.getUsers().find(u => u.role === 'department_head'),
};
const pagesToRender = [
  ['Tổng quan', () => DashboardPage.render({})],
  ['Lịch phỏng vấn', () => InterviewsPage.render({})],
  ['Danh sách ứng viên', () => CandidatesPage.render()],
  ['Yêu cầu tuyển dụng', () => RequisitionsPage.render()],
  ['Tin tuyển dụng', () => PostingsPage.render()],
  ['Sàng lọc CV', () => ScreeningPage.render({})],
  ['Đánh giá ứng viên', () => EvaluationsPage.render({})],
  ['Báo cáo', () => ReportsPage.render({})],
  ['Thông báo', () => NotificationsPage.render({})],
  ['Người dùng', () => UsersPage.render({})],
  ['Hồ sơ cá nhân', () => ProfilePage.render({})],
  ['Cài đặt', () => SettingsPage.render({})],
  ['Cổng tuyển dụng', () => PortalPage.render({})],
];
const originalGetCurrentUser = ATSStore.getCurrentUser;

Object.keys(roleUsers).forEach(role => {
  const user = roleUsers[role];
  check(`Có tài khoản vai trò ${role}`, !!user);
  if (!user) return;
  ATSStore.getCurrentUser = () => user;
  pagesToRender.forEach(([label, renderFn]) => {
    let html = '';
    let err = '';
    try { html = renderFn(); } catch (e) { err = e.message; }
    check(`Vai trò ${role}: mở "${label}" render được`,
      !err && typeof html === 'string' && html.length > 100,
      err || 'output rỗng');
  });
});
ATSStore.getCurrentUser = originalGetCurrentUser;

// ── 11. Ảnh nền trang đăng nhập ─────────────────────────────────────────
console.log('\n[11] Ảnh nền trang đăng nhập');
const cssSrc2 = fs.readFileSync(path.join(ROOT, 'src/styles/design.css'), 'utf-8');
const loginSrc = fs.readFileSync(path.join(ROOT, 'src/pages/login.js'), 'utf-8');
const portalSrcAll = fs.readFileSync(path.join(ROOT, 'src/pages/portal.js'), 'utf-8');
const bgPath = path.join(ROOT, 'src/assets/login-bg.png');

check('Có file ảnh nền src/assets/login-bg.png',
  fs.existsSync(bgPath) && fs.statSync(bgPath).size > 100 * 1024,
  fs.existsSync(bgPath) ? fs.statSync(bgPath).size : 'không có file');
check('CSS dùng ảnh nền cho panel đăng nhập',
  /url\('\.\.\/assets\/login-bg\.png'\)/.test(cssSrc2));
check('CSS phủ kín ảnh (cover) và căn giữa',
  /background-size:\s*cover/.test(cssSrc2) && /background-position:\s*center center/.test(cssSrc2));
check('CSS có lớp phủ navy để chữ dễ đọc',
  /linear-gradient\(140deg,\s*rgba\(11, 31, 58/.test(cssSrc2));
check('Logo + slogan trang đăng nhập giữ nguyên',
  /Mỗi hồ sơ đi đúng một lối\./.test(loginSrc));
check('Mobile: panel trái vẫn ẩn (không đổi)',
  /\.login-aside\s*\{\s*display:\s*none;?\s*\}/.test(cssSrc2));
check('Form đăng nhập căn giữa nửa phải màn hình',
  /\.login-container\s*\{[^}]*align-items:\s*center/.test(cssSrc2));
check('Trang đăng nhập giữ tỉ lệ cũ (ảnh 45% | form 55%)',
  /grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\)/.test(cssSrc2));
check('Ô nhập đăng nhập giữ cỡ hài hoà (cao 52px, chữ 16px)',
  /\.login-form \.form-input\s*\{[^}]*height:\s*52px[^}]*font-size:\s*16px/.test(cssSrc2));
check('Tiêu đề "Đăng nhập" lớn hơn (≥26px)',
  /\.login-title\s*\{[^}]*font-size:\s*(2[6-9]|3[0-9])px/.test(cssSrc2));
check('Nút đăng nhập lớn (cao 52px)',
  /\.login-btn\s*\{[^}]*height:\s*52px/.test(cssSrc2));
check('Hero portal: bỏ số lượng vị trí đang mở, giữ slogan',
  !/\$\{postings\.length\} vị trí đang mở/.test(portalSrcAll)
  && /Đúng người – Đúng tầm – Đúng tương lai\./.test(portalSrcAll));

// ── 12. Thông báo yêu cầu mới & thứ tự mới nhất lên đầu ─────────────────
console.log('\n[12] Thông báo yêu cầu tuyển dụng mới & thứ tự mới nhất');
const dirNotifBefore = ATSStore.getNotificationsForUser('director').length;
const testReq = ATSStore.createRequisition({
  title: 'Kiểm thử thông báo yêu cầu mới',
  department: 'Công nghệ thông tin',
  quantity: 1,
  reason: 'Kiểm thử',
  creatorId: 'usr_head_it',
  creatorName: 'Lê Văn Hùng'
});
const dirNotifAfter = ATSStore.getNotificationsForUser('director');
check('Tạo yêu cầu → Giám đốc nhận thông báo phê duyệt',
  dirNotifAfter.length === dirNotifBefore + 1,
  dirNotifAfter.length - dirNotifBefore);
check('Thông báo Giám đốc đúng tiêu đề',
  (dirNotifAfter[0] || {}).title === 'Yêu cầu tuyển dụng mới cần phê duyệt',
  (dirNotifAfter[0] || {}).title);
check('Thông báo có mã yêu cầu và link tới danh sách',
  ((dirNotifAfter[0] || {}).message || '').includes(testReq.code)
  && (dirNotifAfter[0] || {}).link === '#/requisitions');
check('Danh sách yêu cầu: yêu cầu tạo sau hiển thị lên đầu',
  ATSStore.getRequisitions()[0].id === testReq.id,
  ATSStore.getRequisitions()[0].id);
const appsSorted = ATSStore.getApplications();
check('Danh sách ứng viên: hồ sơ nộp sau hiển thị lên đầu',
  new Date(appsSorted[0].appliedDate).getTime() >= new Date(appsSorted[appsSorted.length - 1].appliedDate).getTime(),
  { first: appsSorted[0].appliedDate, last: appsSorted[appsSorted.length - 1].appliedDate });

// ── Tổng kết ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(74));
console.log(failed === 0
  ? ' KẾT QUẢ: TÌM KIẾM • THÔNG BÁO • CV • GIỚI TÍNH • MÀU • QUAY LẠI • ĐIỂM 1–5 • SỐ NĂM ≥ 0 • JD KINH NGHIỆM • LỊCH/NGÀY • PHÂN QUYỀN • RENDER • NỀN ĐĂNG NHẬP'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(74) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
