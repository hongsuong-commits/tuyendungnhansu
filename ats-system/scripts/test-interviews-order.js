/**
 * scripts/test-interviews-order.js
 * Kiểm chứng: danh sách lịch phỏng vấn sắp xếp theo LỊCH (ngày + giờ bắt đầu),
 * không theo thời điểm tạo bản ghi.
 *
 *   • Lịch sắp tới xếp trước, gần nhất lên đầu.
 *   • Cùng ngày: giờ bắt đầu sớm hơn lên trước.
 *   • Lịch đã qua xếp sau (mới nhất trước).
 *
 * Chạy: node scripts/test-interviews-order.js
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

console.log('='.repeat(74));
console.log(' KIỂM CHỨNG: LỊCH PHỎNG VẤN SẮP XẾP THEO LỊCH (KHÔNG THEO LÚC TẠO)');
console.log('='.repeat(74));

ATSStore.login('hr1', '123456');

const dayOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const apps = ATSStore.getApplications();
const pickApp = (index) => apps[index % apps.length];

function schedule(app, date, startTime, endTime, round, interviewers) {
  return ATSStore.createInterview({
    candidateId: app.candidateId,
    candidateName: app.candidateName,
    requisitionId: app.requisitionId,
    positionTitle: app.positionTitle,
    round,
    date,
    startTime,
    endTime,
    type: 'online',
    location: 'https://meet.google.com/order-test',
    interviewers,
    notes: 'Kiểm thử thứ tự sắp xếp theo lịch'
  });
}

// Tạo theo thứ tự CỐ TÌNH lệch với thứ tự lịch: xa → gần → đã qua → cùng ngày muộn → cùng ngày sớm.
const far = schedule(pickApp(0), dayOffset(10), '09:00', '10:00', 'Vòng 2 - Xa', ['Nguyễn Thu Hà']);
const near = schedule(pickApp(1), dayOffset(2), '14:00', '15:00', 'Vòng 2 - Gần', ['Trần Quốc Bảo']);
const past = schedule(pickApp(2), dayOffset(-3), '10:00', '11:00', 'Vòng 1 - Đã qua', ['Lê Thị Mai']);
const sameDayLate = schedule(pickApp(3), dayOffset(5), '16:00', '17:00', 'Vòng 2 - Chiều', ['Phạm Văn Nam']);
const sameDayEarly = schedule(pickApp(4), dayOffset(5), '08:00', '09:00', 'Vòng 2 - Sáng', ['Đỗ Minh Anh']);

[far, near, past, sameDayLate, sameDayEarly].forEach((iv, i) => {
  if (!iv || iv.success === false || !iv.id) {
    check(`Tạo lịch kiểm thử #${i + 1}`, false, iv && iv.message);
  }
});

const list = ATSStore.getInterviews();
const indexOf = (iv) => list.findIndex(x => x.id === (iv && iv.id));

check('Tạo đủ 5 lịch kiểm thử', [far, near, past, sameDayLate, sameDayEarly].every(iv => iv && iv.id));

console.log('\nThứ tự trả về (ngày · giờ):');
list.slice(0, 8).forEach((iv, i) => console.log(`  ${i + 1}. ${iv.date} · ${iv.startTime} — ${iv.candidateName} (${iv.status})`));

check('Lịch +2 ngày đứng trước lịch +10 ngày', indexOf(near) < indexOf(far),
  { near: indexOf(near), far: indexOf(far) });
check('Lịch +2 ngày đứng trước lịch +5 ngày', indexOf(near) < indexOf(sameDayEarly),
  { near: indexOf(near), fiveDay: indexOf(sameDayEarly) });
check('Lịch sắp tới đứng trước lịch đã qua', indexOf(far) < indexOf(past),
  { far: indexOf(far), past: indexOf(past) });
check('Cùng ngày: 08:00 đứng trước 16:00', indexOf(sameDayEarly) < indexOf(sameDayLate),
  { early: indexOf(sameDayEarly), late: indexOf(sameDayLate) });
check('Lịch đã qua nằm cuối danh sách (sau mọi lịch sắp tới)',
  indexOf(past) > Math.max(indexOf(near), indexOf(far), indexOf(sameDayEarly), indexOf(sameDayLate)),
  { past: indexOf(past), total: list.length });

// Kiểm tra chuỗi thời gian của nhóm sắp tới tăng dần.
const upcoming = list.filter((iv) => {
  const ts = new Date(`${iv.date}T${iv.startTime || '00:00'}:00`).getTime();
  return !Number.isNaN(ts) && ts >= Date.now();
});
let increasing = true;
for (let i = 1; i < upcoming.length; i++) {
  const prev = new Date(`${upcoming[i - 1].date}T${upcoming[i - 1].startTime || '00:00'}:00`).getTime();
  const cur = new Date(`${upcoming[i].date}T${upcoming[i].startTime || '00:00'}:00`).getTime();
  if (cur < prev) increasing = false;
}
check('Toàn bộ nhóm lịch sắp tới tăng dần theo thời gian', increasing);

console.log('\n' + '='.repeat(74));
console.log(failed === 0
  ? ' KẾT QUẢ: LỊCH PHỎNG VẤN ĐÃ SẮP XẾP ĐÚNG THEO LỊCH'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(74) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
