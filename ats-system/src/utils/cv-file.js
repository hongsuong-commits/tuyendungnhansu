/**
 * cv-file.js — Read the real text content of an uploaded CV.
 *
 * Browsers cannot read .pdf or .docx with FileReader.readAsText(): doing so
 * produces binary noise with broken characters, which is why the old parser
 * filled the application form with wrong values. This helper extracts plain
 * text first (pdf.js for PDF, mammoth for DOCX, UTF-8/Windows-1258 decoding
 * for TXT) and only then hands it to the parser.
 */
const CVFile = (() => {
  const PDF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

  const scriptCache = {};

  function loadScript(src) {
    if (scriptCache[src]) return scriptCache[src];
    scriptCache[src] = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Không tải được thư viện đọc tệp.')));
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không tải được thư viện đọc tệp. Kiểm tra kết nối mạng và thử lại.'));
      document.head.appendChild(script);
    });
    return scriptCache[src];
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

    // Vietnamese .txt files saved by older Windows tools are often
    // windows-1258; fall back to it when UTF-8 leaves replacement characters.
    if (broken > 3) {
      for (const encoding of ['windows-1258', 'windows-1252']) {
        try {
          const alternative = new TextDecoder(encoding).decode(buffer);
          if ((alternative.match(/\uFFFD/g) || []).length < broken) {
            text = alternative;
            break;
          }
        } catch (_) {
          /* encoding not supported in this browser */
        }
      }
    }
    return normalize(text);
  }

  async function readPdf(file) {
    await loadScript(PDF_JS);
    const pdfjs = window.pdfjsLib;
    if (!pdfjs) throw new Error('Trình đọc PDF chưa sẵn sàng. Vui lòng thử lại.');

    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();

      // Group text items into visual lines by their vertical position so the
      // extracted order matches what the reader sees, not the PDF draw order.
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

    return normalize(pages.join('\n\n'));
  }

  async function readDocx(file) {
    await loadScript(MAMMOTH);
    if (!window.mammoth || !window.mammoth.extractRawText) {
      throw new Error('Trình đọc DOCX chưa sẵn sàng. Vui lòng thử lại.');
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
