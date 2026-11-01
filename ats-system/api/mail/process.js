/** POST /api/mail/process — xử lý thủ công hàng đợi email. */
const { mailer, ensureBoot, sendJson, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ POST.' });
  }
  try {
    await ensureBoot();
    const result = await mailer.processQueue();
    return sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    return fail(res, err);
  }
};
