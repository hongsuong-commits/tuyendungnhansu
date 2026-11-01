/** POST /api/login — đăng nhập nhân sự, trả về token phiên cho các API bảo vệ. */
const { db, ensureBoot, sendJson, readBody, fail, signToken } = require('./_lib');

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
    return sendJson(res, 200, {
      ok: true,
      user: safeUser,
      token: signToken(safeUser),
      expiresIn: 12 * 60 * 60
    });
  } catch (err) {
    return fail(res, err);
  }
};
