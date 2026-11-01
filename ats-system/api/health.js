/** GET /api/health — kiểm tra kết nối database, số bản ghi, hàng đợi email.
 *  Kèm theo tình trạng KHAI BÁO biến môi trường (chỉ báo có/không, không lộ giá trị)
 *  để dễ chẩn đoán khi triển khai lên Vercel.
 */
const { db, mailer, ensureBoot, sendJson } = require('./_lib');

function envPresence() {
  const has = (name) => Boolean(String(process.env[name] || '').trim());
  return {
    DATABASE_URL: has('DATABASE_URL'),
    DB_SSL: has('DB_SSL') ? String(process.env.DB_SSL) : null,
    EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT || null,
    SMTP_HOST: has('SMTP_HOST'),
    SMTP_USER: has('SMTP_USER'),
    SMTP_PASS: has('SMTP_PASS'),
    MAIL_FROM: has('MAIL_FROM'),
    runtime: process.env.VERCEL ? 'vercel' : 'node'
  };
}

module.exports = async (req, res) => {
  const env = envPresence();

  if (!env.DATABASE_URL) {
    return sendJson(res, 503, {
      ok: false,
      message: 'Chưa cấu hình DATABASE_URL trên Vercel. Vào Project → Settings → Environment Variables, '
        + 'thêm DATABASE_URL (chuỗi Session Pooler của Supabase, dạng postgresql://...) và DB_SSL=true, '
        + 'sau đó Deployments → Redeploy.',
      env,
    });
  }

  try {
    await ensureBoot();
    const counts = await db.counts();
    let mail = { mode: 'unknown', stats: {}, recent: [] };
    try {
      mail = await mailer.queueStats();
    } catch (err) {
      mail = { mode: 'error', error: err.message, stats: {}, recent: [] };
    }
    return sendJson(res, 200, {
      ok: true,
      service: 'smartats-api',
      runtime: 'vercel-serverless',
      database: db.getBackendMode(),
      counts,
      mail,
      env,
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    const status = err && err.status ? err.status : 503;
    return sendJson(res, status, {
      ok: false,
      message: (err && err.message) || 'Lỗi kết nối database',
      env,
    });
  }
};
