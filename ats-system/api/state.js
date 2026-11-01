/** GET /api/state — trả toàn bộ dữ liệu hiện có trong PostgreSQL (cần đăng nhập khi bật AUTH_REQUIRED). */
const { db, ensureBoot, sendJson, fail, requireAuth } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ GET.' });
  }
  const auth = requireAuth(req);
  if (!auth.ok) {
    return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
  try {
    await ensureBoot();
    const data = await db.getState();
    return sendJson(res, 200, { ok: true, data, database: db.getBackendMode() });
  } catch (err) {
    return fail(res, err);
  }
};
