/**
 * scripts/test-email-flow.js
 * Kiểm chứng đặc tả email của SmartATS:
 *
 *   "Email CHỈ gửi về hộp thư ứng viên (email đã đăng ký lúc nộp CV) khi HR
 *    duyệt CV và hẹn phỏng vấn, kèm thông tin giờ giấc/địa điểm phỏng vấn."
 *
 * Các bước:
 *   1. Duyệt CV (đổi trạng thái hồ sơ)      → KHÔNG được sinh email.
 *   2. Hẹn phỏng vấn (tạo lịch)             → sinh đúng 1 email mời, đúng địa chỉ,
 *                                             có giờ/ngày/địa điểm.
 *   3. Đổi lịch / chốt tuyển dụng           → KHÔNG sinh thêm email.
 *   4. Đẩy email lên máy chủ để gửi thật    → kiểm tra trạng thái gửi.
 *
 * Chạy khi máy chủ đang chạy: node scripts/test-email-flow.js
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
  location: { hash: '#/dashboard', origin: 'http://localhost:3000', pathname: '/' },
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

const API = process.env.API_BASE || 'http://localhost:3000';
let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`); }
}
const mailCount = () => ATSStore.getEmails().length;

(async () => {
  console.log('='.repeat(70));
  console.log(' KIỂM CHỨNG: EMAIL CHỈ GỬI KHI HR DUYỆT CV + HẸN PHỎNG VẤN');
  console.log('='.repeat(70));

  ATSStore.login('hr1', '123456');

  const app = ATSStore.getApplications().find((a) => a.status === 'pending_review')
    || ATSStore.getApplications()[0];
  const candidate = ATSStore.getCandidateById(app.candidateId) || {};
  const registeredEmail = candidate.email;
  console.log(`\nHồ sơ thử: ${app.candidateName} — email đăng ký lúc nộp CV: ${registeredEmail}`);

  // ── 1. Duyệt CV: không được gửi mail ─────────────────────────────────────
  const before = mailCount();
  ATSStore.updateApplicationStatus(app.id, 'passed_screening', 'Duyệt hồ sơ đủ điều kiện vào vòng phỏng vấn');
  check('Duyệt CV không sinh email', mailCount() === before, `số mail: ${before} → ${mailCount()}`);

  // ── 2. Hẹn phỏng vấn: đúng 1 email, đúng địa chỉ, có giờ giấc ────────────
  const iv = ATSStore.createInterview({
    candidateId: app.candidateId,
    candidateName: app.candidateName,
    requisitionId: app.requisitionId,
    positionTitle: app.positionTitle,
    round: 'Vòng 2 - Đánh giá Chuyên môn',
    date: '2026-11-20',
    startTime: '09:00',
    endTime: '10:30',
    type: 'online',
    location: 'https://meet.google.com/ats-test-flow',
    interviewers: ['Lê Văn Hùng', 'Nguyễn Thu Hà'],
    notes: 'Kiểm thử luồng gửi email khi hẹn phỏng vấn',
  });
  check('Hẹn phỏng vấn thành công', !!(iv && iv.id), iv && iv.message);

  const afterSchedule = ATSStore.getEmails();
  check('Hẹn phỏng vấn sinh đúng 1 email', afterSchedule.length === before + 1, `tổng: ${afterSchedule.length}`);

  const invite = afterSchedule.find((m) => m.id === (iv && iv.inviteEmailId));
  check('Email mời tồn tại và gắn với lịch phỏng vấn', !!invite);
  if (invite) {
    console.log(`    Tiêu đề : ${invite.subject}`);
    console.log(`    Người nhận: ${invite.to}`);
    const facts = invite.facts || [];
    facts.forEach((f) => console.log(`      • ${f.label}: ${f.value}`));
    check('Gửi đúng email ứng viên đã đăng ký', invite.to === registeredEmail, invite.to);
    check('Có thông tin giờ phỏng vấn', facts.some((f) => /thời gian/i.test(f.label) && /\d{1,2}:\d{2}/.test(f.value)));
    check('Có thông tin địa điểm/liên kết', facts.some((f) => /địa điểm/i.test(f.label) && !!f.value));
    check('Có thông tin vòng phỏng vấn', facts.some((f) => /vòng/i.test(f.label) && !!f.value));
  }

  // ── 3. Đổi lịch và chốt tuyển dụng: không sinh thêm email ────────────────
  const afterInvite = mailCount();
  ATSStore.updateInterview(iv.id, { date: '2026-11-21', startTime: '14:00', endTime: '15:30' });
  check('Đổi lịch không sinh email', mailCount() === afterInvite, `số mail: ${afterInvite} → ${mailCount()}`);

  ATSStore.updateApplicationStatus(app.id, 'hired', 'Chốt tuyển dụng');
  check('Chốt tuyển dụng không sinh email', mailCount() === afterInvite, `số mail: ${afterInvite} → ${mailCount()}`);
  check('Không có email loại khác ngoài thư mời phỏng vấn',
    ATSStore.getEmails().every((m) => m.type === 'interview_invite'));

  // ── 4. Gửi thật qua máy chủ ──────────────────────────────────────────────
  const pending = ATSStore.getEmails().filter((m) => !m._pushed);
  const now = new Date().toISOString();
  pending.forEach((m) => { m.createdAt = now; m._pushed = true; });

  console.log(`\nĐẩy ${pending.length} thư lên máy chủ ${API}/api/sync ...`);
  const res = await fetch(`${API}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upserts: { emailLog: pending } }),
  });
  check('Máy chủ nhận bản ghi email', res.ok, `HTTP ${res.status}`);

  console.log('Chờ máy chủ gửi (10 giây)...');
  await new Promise((r) => setTimeout(r, 10000));

  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  console.log(`    backend dữ liệu: ${health.database} | chế độ gửi: ${health.mail.mode}`);
  console.log(`    thống kê: ${JSON.stringify(health.mail.stats)}`);

  const ids = pending.map((m) => m.id);
  const sent = (health.mail.recent || []).filter((r) => ids.includes(r.id));
  check('Máy chủ đã xử lý thư mời', sent.length > 0);
  sent.forEach((row) => {
    check(`Gửi thành công (${row.status}/${row.provider}) tới ${row.to}`,
      row.status === 'sent' || row.status === 'preview');
    if (row.previewUrl) console.log(`    → Nội dung thư thật: ${row.previewUrl}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(failed === 0
    ? ' KẾT QUẢ: ĐÚNG ĐẶC TẢ — CHỈ GỬI EMAIL KHI DUYỆT CV + HẸN PHỎNG VẤN'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(70) + '\n');
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('Lỗi kiểm thử:', err.message);
  process.exitCode = 1;
});
