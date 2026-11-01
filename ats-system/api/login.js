/** POST /api/login — đăng nhập nhân sự (kiểm tra trong PostgreSQL). */
const { db, ensureBoot, sendJson, readBody, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Chỉ hỗ trợ POST.' });
  }
  try {
    const body = await readBody(req);
    await ensureBoot();
    const user = await db.login(body.username, body.password);
    if (!user) {
      return sendJson(res, 401, { ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }
    const { password, ...safeUser } = user;
    return sendJson(res, 200, { ok: true, user: safeUser });
  } catch (err) {
    return fail(res, err);
  }
};
