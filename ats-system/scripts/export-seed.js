/**
 * scripts/export-seed.js
 * Kết xuất dữ liệu mẫu ban đầu của ATSStore (src/data/store.js) ra JSON
 * để máy chủ nạp vào PostgreSQL ở lần khởi động đầu tiên.
 *
 * Chạy: node scripts/export-seed.js
 */
const fs = require('fs');
const path = require('path');

const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
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
  createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, addEventListener: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  getElementById: () => null,
  querySelectorAll: () => [],
};

function loadModule(relPath) {
  let code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf-8');
  code = code.replace(/^const Helpers =/m, 'global.Helpers =');
  code = code.replace(/^const ATSStore =/m, 'global.ATSStore =');
  (0, eval)(code);
}

loadModule('src/utils/helpers.js');
loadModule('src/data/store.js');

const seed = {
  users: ATSStore.getUsers(),
  departments: ATSStore.getDepartments().map((name, index) => ({
    id: `dept_${index + 1}`,
    name,
  })),
  requisitions: ATSStore.getRequisitions(),
  postings: ATSStore.getPostings(),
  candidates: ATSStore.getCandidates(),
  applications: ATSStore.getApplications(),
  interviews: ATSStore.getInterviews(),
  evaluations: ATSStore.getEvaluations(),
  notifications: ATSStore.getNotifications(),
  emailLog: [],
  settings: ATSStore.getSettings(),
};

const outPath = path.join(__dirname, '..', 'src', 'server', 'seed.json');
fs.writeFileSync(outPath, JSON.stringify(seed, null, 2), 'utf8');

const summary = Object.entries(seed)
  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : 'object'}`)
  .join('\n');
console.log('Đã ghi', outPath);
console.log(summary);
