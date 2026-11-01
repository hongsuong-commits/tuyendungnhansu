/** GET /api/emails — danh sách thư đã soạn/gửi cho ứng viên (dùng cho kiểm tra). */
const { db, ensureBoot, sendJson, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ GET.' });
  }
  try {
    const url = new URL(req.url || '/api/emails', 'http://localhost');
    const limit = Math.min(500, Number(url.searchParams.get('limit') || 200) || 200);
    await ensureBoot();
    const emails = await db.mailQueue.list(limit);
    return sendJson(res, 200, { ok: true, database: db.getBackendMode(), emails });
  } catch (err) {
    return fail(res, err);
  }
};
