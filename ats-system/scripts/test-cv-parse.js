/**
 * scripts/test-cv-parse.js
 * Kiểm chứng bộ quét CV (CVEngine.parseText + evaluateCandidate) trên một tệp CV mẫu.
 *
 * Cách chạy:
 *   node scripts/test-cv-parse.js
 *   node scripts/test-cv-parse.js sample-data/cv-mau-tran-thi-minh-thu.txt
 */
const fs = require('fs');
const path = require('path');

// ── Mock môi trường trình duyệt tối thiểu để nạp store.js ────────────────
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

// ── Đọc CV ────────────────────────────────────────────────────────────────
const cvPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'sample-data', 'cv-mau-tran-thi-minh-thu.txt');

if (!fs.existsSync(cvPath)) {
  console.error('Không tìm thấy tệp CV:', cvPath);
  process.exit(1);
}
const cvText = fs.readFileSync(cvPath, 'utf8');

console.log('='.repeat(64));
console.log(' KIỂM CHỨNG BỘ QUÉT CV —', path.basename(cvPath));
console.log('='.repeat(64));

const parsed = ATSStore.parseCVText(cvText);
console.log('\n[1] Thông tin trích xuất được:');
console.log('    Họ và tên      :', parsed.name);
console.log('    Email          :', parsed.email);
console.log('    Điện thoại     :', parsed.phone);
console.log('    Học vấn        :', parsed.education);
console.log('    Giới tính      :', parsed.gender);
console.log('    Ngày sinh      :', parsed.dob);
console.log('    Số năm kinh nghiệm:', parsed.experienceYears);
console.log('    Kỹ năng        :', (parsed.skills || []).join(', '));
console.log('    Chứng chỉ      :', (parsed.certifications || []).join(', '));

// ── Đối chiếu với vị trí tuyển dụng đầu tiên trong dữ liệu mẫu ────────────
const req = ATSStore.getRequisitions().find((r) => r.status === 'recruiting')
  || ATSStore.getRequisitions()[0];

let failed = 0;
function check(label, condition, value) {
  if (condition) {
    console.log(`    [PASS] ${label}`);
  } else {
    failed += 1;
    console.log(`    [FAIL] ${label} — giá trị thực tế: ${JSON.stringify(value)}`);
  }
}

console.log('\n[2] Kiểm tra từng trường:');
check('Trích xuất đúng họ tên', /TRẦN THỊ MINH THƯ/i.test(parsed.name || ''), parsed.name);
check('Trích xuất đúng email', parsed.email === 'minhthu.tran.test@gmail.com', parsed.email);
check('Trích xuất đúng số điện thoại', parsed.phone === '0912345678', parsed.phone);
check('Nhận diện trình độ đại học', /đại học/i.test(parsed.education || ''), parsed.education);
check('Nhận diện giới tính Nữ', parsed.gender === 'Nữ', parsed.gender);
check('Nhận diện ngày sinh 1997-03-12', parsed.dob === '1997-03-12', parsed.dob);
check('Số năm kinh nghiệm > 0 và hợp lý (2–6)', parsed.experienceYears >= 2 && parsed.experienceYears <= 6, parsed.experienceYears);
check('Nhận diện kỹ năng React', (parsed.skills || []).includes('React'), parsed.skills);
check('Nhận diện kỹ năng TypeScript', (parsed.skills || []).includes('TypeScript'), parsed.skills);
check('Nhận diện chứng chỉ ngoại ngữ/AWS', (parsed.certifications || []).length > 0, parsed.certifications);

if (req) {
  const screening = ATSStore.evaluateCandidate({ ...parsed, rawResumeText: cvText }, req);
  console.log('\n[3] Đối chiếu với vị trí:', req.title);
  console.log('    Điểm sàng lọc  :', screening.score + '/100');
  console.log('    Phân loại      :', screening.classification);
  console.log('    Tóm tắt        :', screening.summary);
  console.log('    Tiêu chí đạt   :', (screening.metCriteria || []).length, 'mục');
  console.log('    Tiêu chí thiếu :', (screening.unmetCriteria || []).length, 'mục');
  (screening.metCriteria || []).forEach((c) => console.log('      +', c));
  (screening.unmetCriteria || []).forEach((c) => console.log('      -', c));
  check('Điểm sàng lọc nằm trong 0..100', screening.score >= 0 && screening.score <= 100, screening.score);
}

// ── [4] Trích xuất số điện thoại theo nhiều định dạng thực tế ─────────────
console.log('\n[4] Trích xuất số điện thoại theo nhiều định dạng:');
const phoneCases = [
  ['SĐT: 0978123456', '0978123456', 'di động 10 số'],
  ['Điện thoại: 0909 678 123', '0909678123', 'có khoảng trắng'],
  ['Phone: 0912.345.678', '0912345678', 'có dấu chấm'],
  ['SĐT: +84 912 345 678', '0912345678', 'đầu số +84'],
  ['Tel: 0123456789', '0123456789', 'số cũ 11 số'],
  ['ĐT: 024 3123 4567', '02431234567', 'máy bàn'],
  ['Liên hệ: (0912) 345 678', '0912345678', 'có ngoặc'],
  ['Số điện thoại: 0903123456 - Email: a@b.com', '0903123456', 'theo sau là email'],
];
phoneCases.forEach(([line, expected, desc]) => {
  const result = ATSStore.parseCVText('Họ tên: Nguyễn Văn A\n' + line);
  check(`SĐT ${desc} → ${expected}`, result.phone === expected, result.phone);
});
check('Không nhầm năm sinh thành SĐT', ATSStore.parseCVText('Họ tên: Lê Văn B\nNăm sinh: 1998\nEmail: b@example.com').phone === '', 'phone rỗng');

console.log('\n' + '='.repeat(64));
if (failed === 0) {
  console.log(' KẾT QUẢ: TẤT CẢ KIỂM TRA CV ĐỀU ĐẠT');
} else {
  console.log(` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
}
console.log('='.repeat(64) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
