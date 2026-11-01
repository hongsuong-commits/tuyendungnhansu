/**
 * scripts/test-candidate-email.js
 * Kiểm chứng: hệ thống gửi thư tới EMAIL CỦA ỨNG VIÊN (không phải email người gửi).
 *
 * Luồng mô phỏng đúng thao tác thật:
 *   1. Ứng viên nộp hồ sơ tại cổng tuyển dụng với email đã đăng ký.
 *   2. HR duyệt CV và hẹn phỏng vấn (tạo lịch).
 *   3. Hệ thống soạn thư mời → người nhận = email ứng viên đã đăng ký.
 *   4. Đẩy thư lên máy chủ để gửi thật qua SMTP, rồi kiểm tra trạng thái.
 *
 * Cách chạy:
 *   node scripts/test-candidate-email.js lychanhyen20052006@gmail.com
 */
const fs = require('fs');
const path = require('path');

// ── Mock môi trường trình duyệt để nạp ATSStore ────────────────────────────
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

const API = process.env.API_BASE || 'http://localhost:3000';
const CANDIDATE_EMAIL = (process.argv[2] || process.env.CANDIDATE_EMAIL || '').trim();

let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  console.log('='.repeat(72));
  console.log(' KIỂM CHỨNG: GỬI MAIL TỚI EMAIL CỦA ỨNG VIÊN (KHÔNG PHẢI NGƯỜI GỬI)');
  console.log('='.repeat(72));

  if (!CANDIDATE_EMAIL) {
    console.error('Thiếu email ứng viên. Ví dụ: node scripts/test-candidate-email.js a@b.com');
    process.exit(1);
  }
  console.log(`\nEmail ứng viên (người nhận) : ${CANDIDATE_EMAIL}`);

  // ── Kiểm tra máy chủ & CSDL trước khi gửi ───────────────────────────────
  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  console.log(`Backend dữ liệu             : ${health.database}`);
  console.log(`Kênh gửi thư                : ${health.mail.mode}`);
  check('Máy chủ phản hồi', health.ok === true);
  check('Đang dùng PostgreSQL (Supabase)', health.database === 'postgres', health.database);
  check('Đang dùng SMTP (gửi thật)', health.mail.mode === 'smtp', health.mail.mode);

  // ── 1. Ứng viên nộp hồ sơ bằng email của họ ────────────────────────────
  const requisition = ATSStore.getRequisitions().find((r) => r.status === 'recruiting')
    || ATSStore.getRequisitions()[0];

  const candidateData = {
    fullName: 'Lý Chánh Yến',
    email: CANDIDATE_EMAIL,
    phone: '0912345678',
    experienceYears: 3.5,
    education: 'Đại học Bách Khoa Hà Nội - Công nghệ thông tin',
    skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS'],
    rawResumeText: 'HỌ VÀ TÊN: LÝ CHÁNH YẾN\nKinh nghiệm: 3.5 năm React, TypeScript.\nHọc vấn: Đại học Bách Khoa Hà Nội.',
  };

  const application = ATSStore.submitApplication({
    candidateData,
    requisitionId: requisition.id,
    source: 'website',
  });
  check('Ứng viên nộp hồ sơ thành công', !!(application && application.id));
  const candidate = ATSStore.getCandidateById(application.candidateId);
  console.log(`  Hồ sơ: ${candidate.fullName} — email lưu trong hồ sơ: ${candidate.email}`);
  check('Email trong hồ sơ ứng viên đúng', candidate.email === CANDIDATE_EMAIL, candidate.email);

  // ── 2. HR duyệt CV rồi hẹn phỏng vấn ───────────────────────────────────
  ATSStore.updateApplicationStatus(application.id, 'passed_screening', 'Duyệt hồ sơ đủ điều kiện phỏng vấn');
  check('Duyệt CV không gửi thư', ATSStore.getEmails().length === 0);

  const interview = ATSStore.createInterview({
    candidateId: application.candidateId,
    candidateName: application.candidateName,
    requisitionId: application.requisitionId,
    positionTitle: application.positionTitle,
    round: 'Vòng 2 - Đánh giá Chuyên môn',
    date: '2026-11-25',
    startTime: '09:30',
    endTime: '11:00',
    type: 'online',
    location: 'https://meet.google.com/ats-candidate-test',
    interviewers: ['Lê Văn Hùng', 'Nguyễn Thu Hà'],
    notes: 'Kiểm thử gửi thư tới email ứng viên',
  });
  check('Hẹn phỏng vấn thành công', !!(interview && interview.id), interview && interview.message);

  const mails = ATSStore.getEmails();
  check('Sinh đúng 1 thư mời phỏng vấn', mails.length === 1, `số thư: ${mails.length}`);
  const invite = mails[0];
  if (invite) {
    console.log(`  Tiêu đề    : ${invite.subject}`);
    console.log(`  Người nhận : ${invite.to}`);
    console.log(`  Người gửi  : ${invite.from}`);
    (invite.facts || []).forEach((f) => console.log(`    • ${f.label}: ${f.value}`));
    check('Người nhận = email ứng viên', invite.to === CANDIDATE_EMAIL, invite.to);
    check('Người gửi khác người nhận (From = tài khoản Gmail cấu hình)', invite.from !== invite.to);
  }

  // ── 3. Gửi thật qua máy chủ ────────────────────────────────────────────
  const now = new Date().toISOString();
  invite.createdAt = now;
  delete invite._pushed;
  console.log(`\nĐẩy thư lên ${API}/api/sync để gửi thật…`);
  const res = await fetch(`${API}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upserts: { emailLog: [invite] } }),
  });
  check('Máy chủ nhận bản ghi email', res.ok, `HTTP ${res.status}`);

  console.log('Chờ SMTP gửi (12 giây)…');
  await new Promise((r) => setTimeout(r, 12000));

  const list = await fetch(`${API}/api/emails?limit=20`).then((r) => r.json());
  const sent = (list.emails || []).find((m) => m.id === invite.id);
  if (sent) {
    console.log(`\nKết quả gửi: status=${sent.status} | provider=${sent.provider} | to=${sent.to}`);
    if (sent.error) console.log(`Lỗi: ${sent.error}`);
    check('Trạng thái gửi = sent (Gmail đã nhận thư)', sent.status === 'sent', sent.status);
    check('Nhà cung cấp = smtp', sent.provider === 'smtp', sent.provider || '(rỗng)');
    check('Gửi đúng hộp thư ứng viên', sent.to === CANDIDATE_EMAIL, sent.to);
  } else {
    check('Tìm thấy bản ghi thư đã gửi', false);
  }

  console.log('\n' + '='.repeat(72));
  console.log(failed === 0
    ? ' KẾT QUẢ: GỬI THÀNH CÔNG TỚI EMAIL CỦA ỨNG VIÊN QUA GMAIL SMTP'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(72) + '\n');
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('Lỗi kiểm thử:', err.message);
  process.exitCode = 1;
});
