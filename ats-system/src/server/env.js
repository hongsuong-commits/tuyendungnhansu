/**
 * src/server/env.js
 * Đọc tệp .env ở thư mục gốc dự án (ats-system/.env) mà không cần thư viện ngoài.
 * Biến đã có trong process.env sẽ được ưu tiên giữ nguyên.
 */
const fs = require('fs');
const path = require('path');

let loaded = false;

function loadEnv() {
  if (loaded) return process.env;
  loaded = true;

  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return process.env;

  const text = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return process.env;
}

module.exports = { loadEnv };
