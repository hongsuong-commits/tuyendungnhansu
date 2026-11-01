/** POST /api/mail/process — xử lý thủ công hàng đợi email. */
const { mailer, ensureBoot, sendJson, fail, requireAuth } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ POST.' });
  }
  const auth = requireAuth(req);
  if (!auth.ok) {
    return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
  try {
    await ensureBoot();
    const result = await mailer.processQueue();
    return sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    return fail(res, err);
  }
};
