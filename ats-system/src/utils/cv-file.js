/**
 * cv-file.js — Đọc nội dung văn bản thật của CV tải lên.
 *
 * Trình duyệt KHÔNG đọc được .pdf/.docx bằng FileReader.readAsText() (sẽ ra rác
 * nhị phân). Helper này trích xuất văn bản trước rồi mới đưa cho bộ phân tích:
 *   - PDF  : pdf.js
 *   - DOCX : mammoth
 *   - TXT  : UTF-8, dự phòng windows-1258/1252
 *
 * Thư viện được nạp THEO THỨ TỰ: bản cục bộ trong node_modules trước, nếu lỗi
 * mới thử CDN. Nhờ vậy chức năng đọc PDF/DOCX vẫn chạy khi mạng bị chặn CDN
 * hoặc khi triển khai nội bộ.
 */
const CVFile = (() => {
  // Bản cục bộ (server tĩnh phục vụ trực tiếp node_modules)
  const LOCAL_PDF_JS = 'node_modules/pdfjs-dist/build/pdf.min.js';
  const LOCAL_PDF_WORKER = 'node_modules/pdfjs-dist/build/pdf.worker.min.js';
  const LOCAL_MAMMOTH = 'node_modules/mammoth/mammoth.browser.min.js';

  // Bản dự phòng trên CDN
  const CDN_PDF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const CDN_PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const CDN_MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

  const scriptCache = {};

  function loadScript(src) {
    if (scriptCache[src]) return scriptCache[src];
    scriptCache[src] = new Promise((resolve, reject) => {
      const absolute = new URL(src, document.baseURI).href;
      const existing = document.querySelector(`script[src="${absolute}"]`)
        || document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('load-error')));
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('load-error'));
      document.head.appendChild(script);
    });
    return scriptCache[src];
  }

  /** Thử lần lượt từng nguồn, dùng nguồn đầu tiên nạp được. */
  async function loadFirstAvailable(sources) {
    let lastError = null;
    for (const src of sources) {
      try {
        await loadScript(src);
        return src;
      } catch (err) {
        lastError = err;
        // Lần sau thử nguồn khác, không cache lỗi.
        delete scriptCache[src];
      }
    }
    throw lastError || new Error('Không tải được thư viện đọc tệp.');
  }

  function normalize(text) {
    return String(text || '')
      .normalize('NFC')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function readPlainText(file) {
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder('utf-8').decode(buffer);
    const broken = (text.match(/\uFFFD/g) || []).length;

    // Tệp .txt lưu bằng công cụ Windows cũ thường là windows-1258.
    if (broken > 3) {
      for (const encoding of ['windows-1258', 'windows-1252']) {
        try {
          const alternative = new TextDecoder(encoding).decode(buffer);
          if ((alternative.match(/\uFFFD/g) || []).length < broken) {
            text = alternative;
            break;
          }
        } catch (_) {
          /* trình duyệt không hỗ trợ bảng mã này */
        }
      }
    }
    return normalize(text);
  }

  async function readPdf(file) {
    const usedSource = await loadFirstAvailable([LOCAL_PDF_JS, CDN_PDF_JS]);
    const pdfjs = window.pdfjsLib;
    if (!pdfjs) throw new Error('Trình đọc PDF chưa sẵn sàng. Vui lòng tải lại trang và thử lại.');

    if (pdfjs.GlobalWorkerOptions) {
      // Worker phải cùng phiên bản với thư viện chính.
      pdfjs.GlobalWorkerOptions.workerSrc = usedSource === LOCAL_PDF_JS
        ? LOCAL_PDF_WORKER
        : CDN_PDF_WORKER;
    }

    const data = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
      doc = await pdfjs.getDocument({ data, disableFontFace: true, useSystemFonts: false }).promise;
    } catch (err) {
      const name = String((err && err.name) || '');
      if (name === 'PasswordException') {
        throw new Error('Tệp PDF đang được đặt mật khẩu. Vui lòng gỡ mật khẩu rồi tải lên lại.');
      }
      if (name === 'InvalidPDFException') {
        throw new Error('Tệp PDF bị hỏng hoặc không đúng định dạng PDF.');
      }
      throw new Error('Không đọc được nội dung tệp PDF: ' + ((err && err.message) || 'lỗi không xác định'));
    }

    const pages = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();

      // Gom các mảnh chữ theo tọa độ dọc để giữ đúng thứ tự dòng như khi đọc.
      const rows = new Map();
      content.items.forEach(item => {
        const value = String(item.str || '').trim();
        if (!value) return;
        const y = Math.round(item.transform[5]);
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push({ x: item.transform[4], value });
      });

      const pageText = [...rows.keys()]
        .sort((a, b) => b - a)
        .map(y => rows.get(y).sort((a, b) => a.x - b.x).map(part => part.value).join(' '))
        .join('\n');

      pages.push(pageText);
    }

    const text = normalize(pages.join('\n\n'));

    // PDF scan/ảnh không có lớp văn bản — báo rõ để người dùng biết cách xử lý.
    if (!text || text.replace(/\s/g, '').length < 20) {
      throw new Error(
        'Tệp PDF này không có lớp văn bản (có thể là bản scan/ảnh). ' +
        'Vui lòng dùng PDF xuất từ Word/Google Docs, hoặc tệp .docx/.txt, hoặc dán nội dung CV vào ô văn bản.'
      );
    }
    return text;
  }

  async function readDocx(file) {
    await loadFirstAvailable([LOCAL_MAMMOTH, CDN_MAMMOTH]);
    if (!window.mammoth || !window.mammoth.extractRawText) {
      throw new Error('Trình đọc DOCX chưa sẵn sàng. Vui lòng tải lại trang và thử lại.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return normalize(result.value);
  }

  async function extractText(file) {
    if (!file) throw new Error('Chưa chọn tệp CV.');
    const name = String(file.name || '').toLowerCase();
    const type = String(file.type || '').toLowerCase();

    if (name.endsWith('.pdf') || type === 'application/pdf') return readPdf(file);
    if (name.endsWith('.docx') || type.includes('officedocument.wordprocessingml')) return readDocx(file);
    if (name.endsWith('.doc')) {
      throw new Error('Tệp .doc cũ chưa hỗ trợ đọc trực tiếp. Vui lòng lưu lại thành .docx hoặc .pdf.');
    }

    const text = await readPlainText(file);
    if (!text || /[\u0000-\u0008]/.test(text)) {
      throw new Error('Tệp này không phải văn bản đọc được. Vui lòng dùng .pdf, .docx hoặc .txt.');
    }
    return text;
  }

  return {
    extractText,
    normalize,
    readPlainText,
  };
})();
