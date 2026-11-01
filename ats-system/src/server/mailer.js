/**
 * src/server/mailer.js
 * Gửi thư điện tử thật cho ứng viên từ hộp thư của doanh nghiệp.
 *
 * Chế độ hoạt động (EMAIL_TRANSPORT trong .env):
 *   - smtp     : gửi qua máy chủ SMTP thật (Gmail, Brevo, Resend SMTP, ...)
 *   - ethereal : tài khoản thử nghiệm của nodemailer — thư được gửi thật qua
 *                mạng và xem lại được qua đường dẫn preview_url
 *   - auto     : SMTP nếu có SMTP_HOST, ngược lại ghi tệp .eml
 *   - file     : chỉ ghi tệp .eml vào mail-outbox/ để kiểm tra nội dung
 *
 * Mỗi thư nằm trong bảng email_log với trạng thái pending → sent | preview | failed.
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { loadEnv } = require('./env');
const { getPool, ensureSchema } = require('./db');

let transport = null;
let transportMode = 'file';
let fromFallback = 'hr@smartats.vn';
let outboxDir = path.join(__dirname, '..', '..', 'mail-outbox');

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function init() {
  if (transport) return { mode: transportMode };

  loadEnv();

  const requested = String(process.env.EMAIL_TRANSPORT || 'auto').toLowerCase();
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';

  fromFallback = (process.env.MAIL_FROM || process.env.SMTP_USER || 'hr@smartats.vn').trim();
  if (process.env.MAIL_OUTBOX_DIR) {
    outboxDir = path.resolve(__dirname, '..', '..', process.env.MAIL_OUTBOX_DIR);
  }

  if ((requested === 'smtp' || requested === 'auto') && host) {
    transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    transportMode = 'smtp';
  } else if (requested === 'ethereal') {
    // Tài khoản thử nghiệm: thư đi ra Internet thật nhưng bị giữ tại Ethereal,
    // mở preview_url để xem đúng thứ ứng viên sẽ nhận.
    try {
      const account = await nodemailer.createTestAccount();
      transport = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
      transportMode = 'ethereal';
    } catch (err) {
      console.warn('[mail] Không tạo được tài khoản Ethereal:', err.message);
      transport = null;
    }
  }

  if (!transport) {
    transport = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
    transportMode = 'file';
  }

  if (transportMode === 'file') {
    fs.mkdirSync(outboxDir, { recursive: true });
  }

  if (transportMode === 'smtp') {
    console.log(`[mail] SMTP ${host}:${port} — thư sẽ được gửi thật tới ứng viên`);
  } else if (transportMode === 'ethereal') {
    console.log('[mail] Ethereal — thư được gửi thật tới hộp thư thử nghiệm, mở preview_url để xem');
  } else {
    console.log(
      `[mail] Chưa cấu hình SMTP — thư được ghi vào ${path.relative(process.cwd(), outboxDir)}\\*.eml`
    );
  }

  return { mode: transportMode };
}

function buildHtml(record, company) {
  const greeting = escapeHtml(record.greeting || '');
  const paragraphs = (record.paragraphs || [])
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.65;color:#22303f;">${escapeHtml(p)}</p>`)
    .join('');

  const facts = Array.isArray(record.facts) && record.facts.length
    ? `<table cellpadding="0" cellspacing="0" style="margin:18px 0 22px;border-collapse:collapse;width:100%;max-width:520px;">
         ${record.facts
           .filter((f) => f && f.value)
           .map(
             (f) => `<tr>
               <td style="padding:7px 14px 7px 0;color:#5d6b79;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(f.label)}</td>
               <td style="padding:7px 0;color:#122a3f;font-size:13.5px;font-weight:600;vertical-align:top;">${escapeHtml(f.value)}</td>
             </tr>`
           )
           .join('')}
       </table>`
    : '';

  const closing = escapeHtml(record.closing || '').replace(/\n/g, '<br>');

  const footer = [
    company.companyName || 'SmartATS Solutions Việt Nam',
    company.companyAddress || '',
    [company.hotline ? `Hotline: ${company.hotline}` : '', company.companyEmail ? `Email: ${company.companyEmail}` : '']
      .filter(Boolean)
      .join(' · '),
  ]
    .filter(Boolean)
    .map((line) => `<div style="margin:2px 0;">${escapeHtml(line)}</div>`)
    .join('');

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(record.subject || '')}</title></head>
<body style="margin:0;padding:0;background:#f2f5f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f8;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #dbe4ec;border-radius:8px;">
        <tr><td style="padding:26px 30px 8px;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1d5d91;font-weight:700;margin-bottom:14px;">
            ${escapeHtml(company.companyName || 'SmartATS Solutions Việt Nam')}
          </div>
          <p style="margin:0 0 16px;font-size:15px;color:#122a3f;">${greeting}</p>
          ${paragraphs}
          ${facts}
          <p style="margin:0 0 26px;line-height:1.65;color:#22303f;">${closing}</p>
        </td></tr>
        <tr><td style="padding:14px 30px 24px;border-top:1px solid #e6edf3;font-size:12px;line-height:1.6;color:#6b7a89;">
          ${footer}
          <div style="margin-top:10px;color:#93a2b1;">Thư được gửi tự động từ hệ thống SmartATS, vui lòng không trả lời trực tiếp email này.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText(record, company) {
  const lines = [record.greeting || '', '', ...(record.paragraphs || []), ''];
  (record.facts || []).forEach((f) => {
    if (f && f.value) lines.push(`${f.label}: ${f.value}`);
  });
  lines.push('', record.closing || '', '');
  lines.push('---');
  lines.push(company.companyName || 'SmartATS Solutions Việt Nam');
  if (company.companyAddress) lines.push(company.companyAddress);
  const contact = [
    company.hotline ? `Hotline: ${company.hotline}` : '',
    company.companyEmail ? `Email: ${company.companyEmail}` : '',
  ].filter(Boolean).join(' · ');
  if (contact) lines.push(contact);
  return lines.join('\n');
}

async function loadCompany() {
  const { rows } = await getPool().query('select doc from app_settings where id = 1');
  const settings = (rows[0] && rows[0].doc) || {};
  return {
    companyName: settings.companyName || 'SmartATS Solutions Việt Nam',
    companyAddress: settings.companyAddress || '',
    companyEmail: settings.companyEmail || fromFallback,
    hotline: settings.hotline || '',
  };
}

async function sendRecord(row, company) {
  const record = row.doc || {};
  const to = record.to || row.to_email;
  if (!to) throw new Error('Thiếu địa chỉ email người nhận');

  const fromAddress = company.companyEmail || fromFallback;
  const fromName = company.companyName || 'SmartATS';

  const info = await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: record.subject || 'Thông báo từ SmartATS',
    text: buildText(record, company),
    html: buildHtml(record, company),
    headers: {
      'X-SmartATS-Type': String(record.type || ''),
      'X-SmartATS-Email-Id': row.id,
    },
  });

  if (transportMode === 'file') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeId = String(row.id).replace(/[^\w.-]+/g, '_');
    const filePath = path.join(outboxDir, `${stamp}_${safeId}.eml`);
    fs.writeFileSync(filePath, info.message);
    return { status: 'preview', provider: 'file', messageId: path.basename(filePath), previewUrl: null };
  }

  if (transportMode === 'ethereal') {
    // Thư đã được Ethereal nhận; đường dẫn cho phép mở lại đúng nội dung đã gửi.
    return {
      status: 'preview',
      provider: 'ethereal',
      messageId: info.messageId || null,
      previewUrl: nodemailer.getTestMessageUrl(info) || null,
    };
  }

  return {
    status: 'sent',
    provider: 'smtp',
    messageId: info.messageId || null,
    previewUrl: null,
  };
}

/**
 * Gửi các thư còn nằm trong hàng đợi.
 * Chỉ xử lý thư được tạo sau mốc minCreatedAt để không gửi lại thư cũ
 * khi dữ liệu localStorage lần đầu được đồng bộ lên máy chủ.
 */
async function processQueue(minCreatedAt) {
  await init();
  await ensureSchema();

  const { rows } = await getPool().query(
    `select id, doc, to_email
       from email_log
      where sent_at is null
        and status in ('pending', 'sent')
        and coalesce(doc->>'createdAt', '') >= $1
      order by created_at asc
      limit 25`,
    [minCreatedAt]
  );

  if (!rows.length) return { processed: 0 };

  const company = await loadCompany();
  let processed = 0;

  for (const row of rows) {
    const claim = await getPool().query(
      `update email_log
          set status = 'sending'
        where id = $1 and sent_at is null and status in ('pending', 'sent')
        returning id`,
      [row.id]
    );
    if (claim.rowCount === 0) continue;

    try {
      const result = await sendRecord(row, company);
      await getPool().query(
        `update email_log
            set status = $2, provider = $3, provider_message_id = $4,
                preview_url = $5,
                sent_at = case when $2 = 'sent' then now() else sent_at end,
                error = null
          where id = $1`,
        [row.id, result.status, result.provider, result.messageId, result.previewUrl || null]
      );
      processed += 1;
      console.log(
        result.provider === 'file'
          ? `[mail] Đã ghi ${result.messageId} (chưa cấu hình SMTP)`
          : `[mail] Đã gửi "${row.doc.subject}" tới ${row.doc.to || row.to_email}`
      );
      if (result.previewUrl) {
        console.log(`       Xem lại thư: ${result.previewUrl}`);
      }
    } catch (err) {
      await getPool().query(
        `update email_log set status = 'failed', error = $2 where id = $1`,
        [row.id, String(err.message || err).slice(0, 500)]
      );
      console.error(`[mail] Gửi thất bại tới ${row.doc.to || row.to_email}: ${err.message}`);
    }
  }

  return { processed };
}

async function queueStats() {
  await ensureSchema();
  const { rows } = await getPool().query(
    `select status, count(*)::int as total from email_log group by status`
  );
  const stats = {};
  rows.forEach((r) => { stats[r.status] = r.total; });

  // Vài thư gần nhất (kèm preview_url) để tiện kiểm tra khi thử nghiệm.
  const recent = await getPool().query(
    `select id, type, to_email, subject, status, provider, preview_url, sent_at
       from email_log
      order by created_at desc
      limit 5`
  );

  return {
    mode: transportMode,
    stats,
    recent: recent.rows.map((r) => ({
      id: r.id,
      type: r.type,
      to: r.to_email,
      subject: r.subject,
      status: r.status,
      provider: r.provider,
      previewUrl: r.preview_url || null,
      sentAt: r.sent_at,
    })),
  };
}

module.exports = { init, processQueue, queueStats };
