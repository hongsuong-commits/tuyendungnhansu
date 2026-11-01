/** GET /api/state — trả toàn bộ dữ liệu hiện có trong PostgreSQL. */
const { db, ensureBoot, sendJson, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ GET.' });
  }
  try {
    await ensureBoot();
    const data = await db.getState();
    return sendJson(res, 200, { ok: true, data, database: db.getBackendMode() });
  } catch (err) {
    return fail(res, err);
  }
};
