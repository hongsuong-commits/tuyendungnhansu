/**
 * scripts/test-pdf-extract.js
 * Kiểm chứng chức năng ĐỌC PDF + TỰ ĐỘNG ĐIỀN THÔNG TIN.
 *
 * Dùng đúng thư viện pdfjs-dist mà trình duyệt dùng (bản legacy chạy được trên
 * Node), trích xuất văn bản y như src/utils/cv-file.js, rồi đưa qua bộ phân
 * tích CV của ứng dụng để xác nhận các trường được điền đúng.
 *
 * Chạy:
 *   node scripts/test-pdf-extract.js
 *   node scripts/test-pdf-extract.js sample-data/cv-mau-ung-vien.pdf
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

let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}

function normalize(text) {
  return String(text || '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u0000-\u0008|\u000B|\u000C|\u000E-\u001F/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Giống hệt logic readPdf trong src/utils/cv-file.js. */
async function extractPdfText(filePath) {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, disableFontFace: true, useSystemFonts: false }).promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map();
    content.items.forEach((item) => {
      const value = String(item.str || '').trim();
      if (!value) return;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], value });
    });
    pages.push(
      [...rows.keys()]
        .sort((a, b) => b - a)
        .map((y) => rows.get(y).sort((a, b) => a.x - b.x).map((p) => p.value).join(' '))
        .join('\n')
    );
  }
  return normalize(pages.join('\n\n'));
}

(async () => {
  const filePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(ROOT, 'sample-data', 'cv-mau-ung-vien.pdf');

  console.log('='.repeat(70));
  console.log(' KIỂM CHỨNG ĐỌC PDF + TỰ ĐỘNG ĐIỀN THÔNG TIN');
  console.log('='.repeat(70));
  console.log('Tệp:', path.relative(ROOT, filePath));

  if (!fs.existsSync(filePath)) {
    console.error('Không tìm thấy tệp PDF. Chạy: python scripts/make-sample-cv-pdf.py');
    process.exit(1);
  }

  const text = await extractPdfText(filePath);
  console.log(`\nĐộ dài văn bản trích xuất: ${text.length} ký tự`);
  console.log('--- 8 dòng đầu ---');
  text.split('\n').slice(0, 8).forEach((line) => console.log('  ' + line));

  check('Đọc được văn bản từ PDF (không rỗng)', text.length > 200, text.length);
  check('Không có ký tự lỗi (�) trong văn bản', !text.includes('\uFFFD'));
  check('Giữ đúng tiếng Việt có dấu', /NGUYỄN THỊ LAN PHƯƠNG/u.test(text));

  // ── Bộ phân tích của ứng dụng ──────────────────────────────────────────
  const parsed = ATSStore.parseCVText(text);
  console.log('\n--- Thông tin bộ phân tích trích ra ---');
  console.log('  Họ tên       :', parsed.name);
  console.log('  Email        :', parsed.email);
  console.log('  Điện thoại   :', parsed.phone);
  console.log('  Giới tính    :', parsed.gender);
  console.log('  Học vấn      :', parsed.education);
  console.log('  Kinh nghiệm  :', parsed.experienceYears, 'năm');
  console.log('  Kỹ năng      :', (parsed.skills || []).join(', '));
  console.log('  Chứng chỉ    :', (parsed.certifications || []).join(', '));

  console.log('\n--- Kiểm tra các trường sẽ được tự điền ---');
  check('Họ tên đúng', /NGUYỄN THỊ LAN PHƯƠNG/.test(parsed.name || ''), parsed.name);
  check('Email đúng', parsed.email === 'lanphuong.nguyen.test@gmail.com', parsed.email);
  check('Điện thoại đúng', parsed.phone === '0977123456', parsed.phone);
  check('Giới tính = Nữ', parsed.gender === 'Nữ', parsed.gender);
  check('Học vấn có tên trường', /Đại học Bách Khoa/i.test(parsed.education || ''), parsed.education);
  check('Kinh nghiệm 2 - 8 năm', parsed.experienceYears >= 2 && parsed.experienceYears <= 8, parsed.experienceYears);
  check('Có kỹ năng React', (parsed.skills || []).includes('React'), parsed.skills);
  check('Có kỹ năng TypeScript', (parsed.skills || []).includes('TypeScript'), parsed.skills);
  check('Có chứng chỉ', (parsed.certifications || []).length > 0, parsed.certifications);

  console.log('\n' + '='.repeat(70));
  console.log(failed === 0
    ? ' KẾT QUẢ: ĐỌC PDF VÀ TỰ ĐỘNG ĐIỀN THÔNG TIN THÀNH CÔNG'
    : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
  console.log('='.repeat(70) + '\n');
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('Lỗi kiểm thử:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
