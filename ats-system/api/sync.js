/**
 * POST /api/sync — nhận phần thay đổi từ trình duyệt, ghi vào PostgreSQL,
 * sau đó gửi các thư còn trong hàng đợi (thư mời phỏng vấn).
 */
const { db, mailer, ensureBoot, sendJson, readBody, fail, requireAuth } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ POST.' });
  }
  const auth = requireAuth(req);
  if (!auth.ok) {
    return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
  try {
    const payload = await readBody(req);
    await ensureBoot();
    const summary = await db.applySync(payload || {});

    // Gửi thư ngay trong request để không bị Vercel huỷ khi response kết thúc.
    let mail = { processed: 0, failed: 0 };
    try {
      mail = await mailer.processQueue();
    } catch (err) {
      console.error('[api/sync] lỗi gửi thư:', err.message);
    }

    return sendJson(res, 200, { ok: true, ...summary, mail });
  } catch (err) {
    return fail(res, err);
  }
};
