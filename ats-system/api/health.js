/** GET /api/health — kiểm tra kết nối database, số bản ghi và hàng đợi email. */
const { db, mailer, ensureBoot, sendJson, fail } = require('./_lib');

module.exports = async (req, res) => {
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
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    return fail(res, err);
  }
};
