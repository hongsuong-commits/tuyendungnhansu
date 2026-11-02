/**
 * scripts/test-interview-notifications.js
 * Kiểm chứng email tự động cho TOÀN BỘ vòng đời lịch phỏng vấn:
 *
 *   1. Tạo lịch (HR hẹn)          → gửi đúng 1 thư MỜI, kèm giờ/ngày/địa điểm.
 *   2. Đổi giờ/ngày               → gửi thư ĐỔI LỊCH với lịch mới.
 *   3. Đổi địa điểm               → gửi thư ĐỔI LỊCH.
 *   4. Chỉ đổi trạng thái         → KHÔNG gửi thư.
 *   5. Hủy lịch                   → gửi thư HỦY (kèm lý do).
 *   6. Hủy lần 2                 → KHÔNG gửi trùng.
 *   7. Hủy lịch chưa từng thông báo → KHÔNG gửi thư.
 *
 * Chạy offline (không cần máy chủ): node scripts/test-interview-notifications.js
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
  location: { hash: '#/interviews', origin: 'http://localhost:3000', pathname: '/' },
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
const mails = () => ATSStore.getEmails();
const countType = (type) => mails().filter((m) => m.type === type).length;

console.log('='.repeat(74));
console.log(' KIỂM CHỨNG EMAIL TỰ ĐỘNG: HẸN • ĐỔI LỊCH • HỦY LỊCH PHỎNG VẤN');
console.log('='.repeat(74));

ATSStore.login('hr1', '123456');

const apps = ATSStore.getApplications();
const app = apps.find((a) => {
  const c = ATSStore.getCandidateById(a.candidateId);
  return c && c.email;
}) || apps[0];
const candidate = ATSStore.getCandidateById(app.candidateId) || {};
const email = candidate.email;
console.log(`\nHồ sơ thử: ${app.candidateName} — email đăng ký: ${email}\n`);

const baseInvite = countType('interview_invite');
const baseReschedule = countType('interview_reschedule');
const baseCancel = countType('interview_cancel');

// ── 1. Hẹn phỏng vấn ──────────────────────────────────────────────────────
const iv = ATSStore.createInterview({
  candidateId: app.candidateId,
  candidateName: app.candidateName,
  requisitionId: app.requisitionId,
  positionTitle: app.positionTitle,
  round: 'Vòng 2 - Đánh giá Chuyên môn',
  date: '2026-12-10',
  startTime: '09:00',
  endTime: '10:30',
  type: 'online',
  location: 'https://meet.google.com/interview-notify-test',
  interviewers: ['Lê Văn Hùng', 'Nguyễn Thu Hà'],
  notes: 'Kiểm thử thông báo đổi/hủy lịch'
});

check('Tạo lịch phỏng vấn thành công', !!(iv && iv.id), iv && iv.message);
check('Tạo lịch: sinh đúng 1 thư MỜI', countType('interview_invite') === baseInvite + 1);

const invite = mails().find((m) => m.id === (iv && iv.inviteEmailId));
check('Thư mời gửi đúng email ứng viên', !!invite && invite.to === email, invite && invite.to);

// ── 2. Đổi giờ/ngày → thư ĐỔI LỊCH ───────────────────────────────────────
const res = ATSStore.updateInterview(iv.id, {
  date: '2026-12-12',
  startTime: '14:00',
  endTime: '15:30'
});
check('Đổi lịch thành công', !!(res && res.id), res && res.message);
check('Đổi giờ/ngày: sinh đúng 1 thư ĐỔI LỊCH',
  countType('interview_reschedule') === baseReschedule + 1,
  countType('interview_reschedule'));

const reschedule = mails().find((m) => m.id === (res && res.rescheduleEmailId));
check('Thư đổi lịch tồn tại và gắn với lịch', !!reschedule);
if (reschedule) {
  console.log(`    Tiêu đề: ${reschedule.subject}`);
  console.log(`    Người nhận: ${reschedule.to}`);
  (reschedule.facts || []).forEach((f) => console.log(`      • ${f.label}: ${f.value}`));
  check('Thư đổi lịch gửi đúng email ứng viên', reschedule.to === email, reschedule.to);
  check('Thư đổi lịch có giờ MỚI (14:00)',
    (reschedule.facts || []).some((f) => /thời gian/i.test(f.label) && /14:00/.test(f.value)));
  check('Thư đổi lịch có ngày mới (12/12)',
    (reschedule.facts || []).some((f) => /thời gian/i.test(f.label) && /12\/12|12-12/.test(f.value)));
}
check('Ghi nhận số lần đổi lịch = 1',
  ATSStore.getInterviewById(iv.id).rescheduleCount === 1,
  ATSStore.getInterviewById(iv.id).rescheduleCount);

// ── 3. Đổi địa điểm → thư ĐỔI LỊCH ───────────────────────────────────────
ATSStore.updateInterview(iv.id, { location: 'https://meet.google.com/phong-hop-moi' });
check('Đổi địa điểm: sinh thư ĐỔI LỊCH',
  countType('interview_reschedule') === baseReschedule + 2,
  countType('interview_reschedule'));
check('Số lần đổi lịch = 2', ATSStore.getInterviewById(iv.id).rescheduleCount === 2);

// ── 4. Chỉ đổi trạng thái → KHÔNG gửi ───────────────────────────────────
const beforeStatus = mails().length;
ATSStore.updateInterview(iv.id, { status: 'completed' });
check('Chỉ đổi trạng thái: KHÔNG sinh thư', mails().length === beforeStatus,
  `${beforeStatus} → ${mails().length}`);

// ── 5. Hủy lịch đã thông báo → thư HỦY ──────────────────────────────────
const cancelReason = 'Hội đồng phỏng vấn bận đột xuất, sẽ sắp xếp lại';
const cancelled = ATSStore.cancelInterview(iv.id, cancelReason);
check('Hủy lịch thành công', !!(cancelled && cancelled.status === 'cancelled'));
check('Hủy lịch: sinh đúng 1 thư HỦY', countType('interview_cancel') === baseCancel + 1);

const cancelMail = mails().find((m) => m.id === (cancelled && cancelled.cancelEmailId));
check('Thư hủy tồn tại và gắn với lịch', !!cancelMail);
if (cancelMail) {
  console.log(`    Tiêu đề: ${cancelMail.subject}`);
  console.log(`    Người nhận: ${cancelMail.to}`);
  check('Thư hủy gửi đúng email ứng viên', cancelMail.to === email, cancelMail.to);
  const allText = (cancelMail.paragraphs || []).join(' ');
  check('Thư hủy có nêu lý do', allText.includes(cancelReason), allText);
}

// ── 6. Hủy lần 2 → không gửi trùng ──────────────────────────────────────
const beforeSecond = countType('interview_cancel');
ATSStore.cancelInterview(iv.id, 'Hủy lại lần nữa');
check('Hủy lần 2 không gửi thêm thư', countType('interview_cancel') === beforeSecond,
  countType('interview_cancel'));

// ── 7. Hủy lịch chưa từng thông báo → không gửi ─────────────────────────
const iv2 = ATSStore.createInterview({
  candidateId: app.candidateId,
  candidateName: app.candidateName,
  requisitionId: app.requisitionId,
  positionTitle: app.positionTitle,
  round: 'Vòng 3 - Phỏng vấn Giám đốc',
  date: '2027-01-15',
  startTime: '10:00',
  endTime: '11:00',
  type: 'onsite',
  location: 'Phòng họp A, Tòa nhà Landmark',
  interviewers: ['Trần Quốc Bảo']
});
// Giả lập lịch chưa từng gửi thư cho ứng viên.
const raw = ATSStore.getInterviewById(iv2.id);
raw.inviteEmailId = null;
raw.status = 'pending';

const beforeUnnotified = countType('interview_cancel');
ATSStore.cancelInterview(iv2.id, 'Hủy lịch nháp nội bộ');
check('Hủy lịch chưa thông báo: KHÔNG gửi thư',
  countType('interview_cancel') === beforeUnnotified,
  countType('interview_cancel'));

// ── Tổng kết ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(74));
console.log(failed === 0
  ? ' KẾT QUẢ: ĐỦ EMAIL CHO HẸN • ĐỔI LỊCH • HỦY LỊCH'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(74) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
