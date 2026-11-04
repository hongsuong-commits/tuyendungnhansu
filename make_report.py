from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

for section in doc.sections:
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')

def set_cell_bg(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color)
    tcPr.append(shd)

def add_heading(text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0x1F, 0x3B, 0x63)
        run.font.name = 'Times New Roman'
    return h

def add_para(text, bold=False, italic=False, size=12, align=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.size = Pt(size)
    if align == 'center':
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return p

def add_table(headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = ''
        p = hdr_cells[i].paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_bg(hdr_cells[i], '1F3B63')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ''
            p = cells[i].paragraphs[0]
            run = p.add_run(str(val))
            run.font.size = Pt(11)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in table.rows:
                row.cells[i].width = Cm(w)
    return table

# ================= NỘI DUNG =================
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run('BÁO CÁO KIẾN TRÚC VÀ PHÂN QUYỀN\nHỆ THỐNG QUẢN LÝ TUYỂN DỤNG THÔNG MINH (SmartATS)')
run.bold = True
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(0x1F, 0x3B, 0x63)

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub.add_run('Môn học: Công nghệ phần mềm / Kiến trúc hệ thống\nMã sinh viên: ... | Ngày nộp: ...')
run.font.size = Pt(11)
run.italic = True

doc.add_paragraph()

# ── 1. Danh sách màn hình và vai trò ──
add_heading('1. Danh sách màn hình và vai trò được truy cập', 1)
add_para(
    'Hệ thống phân quyền theo mô hình RBAC (Role-Based Access Control). '
    'Kiểm tra quyền được thực hiện trong Auth Guard (src/app.js) trước khi render bất kỳ màn hình nào, '
    'dựa trên ma trận PAGE_ACCESS (src/utils/helpers.js). Ứng viên không có tài khoản nội bộ; '
    'họ chỉ dùng cổng tuyển dụng công khai (#/portal) bằng email/Số điện thoại đã nộp CV.'
)

table_rows = [
    ('Tổng quan', '#/dashboard', 'Giám đốc, Nhân sự, Trưởng phòng', 'Thống kê, pipeline yêu cầu, lịch phỏng vấn sắp tới'),
    ('Yêu cầu tuyển dụng', '#/requisitions', 'Giám đốc, Nhân sự, Trưởng phòng', 'Tạo, xem, phê duyệt/từ chối, hủy yêu cầu tuyển dụng'),
    ('Danh sách ứng viên', '#/candidates', 'Giám đốc, Nhân sự, Trưởng phòng', 'Xem chi tiết hồ sơ, từ chối, thêm ghi chú, tải CV thủ công'),
    ('Sàng lọc CV', '#/screening', 'Giám đốc, Nhân sự, Trưởng phòng', 'Xem điểm sàng lọc AI, đánh dấu cần kiểm tra thủ công'),
    ('Lịch phỏng vấn', '#/interviews', 'Giám đốc, Nhân sự, Trưởng phòng', 'Tạo/đổi/hủy lịch, chấm điểm sau phỏng vấn'),
    ('Đánh giá ứng viên', '#/evaluations', 'Giám đốc, Nhân sự, Trưởng phòng', 'Nhập phiếu đánh giá 4 tiêu chí (1–5), đưa ra quyết định'),
    ('Vị trí & tin tuyển dụng', '#/postings', 'Giám đốc, Nhân sự, Trưởng phòng', 'Đăng tin, xem lỗi đăng tin, đăng lại tin'),
    ('Báo cáo tuyển dụng', '#/reports', 'Giám đốc', 'Phễu tuyển dụng, hiệu quả nguồn'),
    ('Cài đặt hệ thống', '#/settings', 'Nhân sự', 'Trọng số sàng lọc, ngưỡng nhắc phê duyệt, hotline'),
    ('Quản lý người dùng', '#/users', 'Nhân sự', 'Tạo/sửa tài khoản nội bộ'),
    ('Hồ sơ cá nhân', '#/profile', 'Tất cả vai trò nội bộ', 'Thông tin cá nhân'),
    ('Trung tâm thông báo', '#/notifications', 'Tất cả vai trò nội bộ', 'Xem, đánh dấu đã đọc thông báo hệ thống'),
    ('Cổng tuyển dụng công khai', '#/portal', 'Công cộng / Ứng viên', 'Tìm việc, nộp CV, tra cứu tiến độ hồ sơ'),
    ('Đăng nhập', '#/login', 'Nhân viên nội bộ (HR, Giám đốc, Trưởng phòng)', 'Xác thực vào khu vực quản trị'),
]
add_table(['Màn hình', 'Đường dẫn', 'Vai trò được truy cập', 'Mô tả'], table_rows, col_widths=[3.2, 2.2, 3.2, 5.2])

doc.add_paragraph()
add_para('Lưu ý phân quyền quan trọng:', bold=True, size=11)
for note in [
    'Giám đốc không vào được Settings và Users (giám đốc chỉ giám sát và phê duyệt, không quản lý cấu hình hệ thống).',
    'Trưởng phòng không vào được Settings và Users; chỉ hủy được yêu cầu của phòng ban mình.',
    'Chưa đăng nhập dán link trực tiếp (ví dụ #/interviews) sẽ bị đẩy về #/portal kèm thông báo yêu cầu đăng nhập.',
    'Đã đăng nhập vào #/login sẽ được chuyển về #/dashboard.',
]:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(note); run.font.size = Pt(11)

# ── 2. Ánh xạ BPMN → tính năng ──
doc.add_paragraph()
add_heading('2. Bảng ánh xạ BPMN → tính năng thực tế', 1)
add_para(
    'Mỗi phần tử trong mô hình BPMN được ánh xạ trực tiếp thành thành phần cụ thể trong hệ thống SmartATS:'
)

add_para('2.1 User Task → Màn hình (UI)', bold=True, size=12)
table_rows = [
    ('Tạo yêu cầu tuyển dụng', 'Yêu cầu tuyển dụng (tạo mới)', 'src/pages/requisitions.js'),
    ('Xem xét và phê duyệt JD', 'Yêu cầu tuyển dụng (nút Duyệt / Từ chối)', 'src/pages/requisitions.js'),
    ('Đăng tin tuyển dụng', 'Vị trí & Tin tuyển dụng', 'src/pages/postings.js'),
    ('Sàng lọc CV', 'Sàng lọc CV', 'src/pages/screening.js'),
    ('Hẹn phỏng vấn', 'Lịch phỏng vấn', 'src/pages/interviews.js'),
    ('Đánh giá phỏng vấn', 'Đánh giá ứng viên', 'src/pages/evaluations.js'),
    ('Quản lý hồ sơ ứng viên', 'Danh sách ứng viên', 'src/pages/candidates.js'),
    ('Cấu hình hệ thống', 'Cài đặt', 'src/pages/settings.js'),
]
add_table(['User task (BPMN)', 'Màn hình thực tế', 'File code'], table_rows, col_widths=[4.0, 5.0, 4.8])

doc.add_paragraph()
add_para('2.2 Service Task → API', bold=True, size=12)
table_rows = [
    ('Đồng bộ dữ liệu client ↔ server', '/api/sync', 'POST'),
    ('Nạp toàn bộ dữ liệu nghiệp vụ', '/api/state', 'GET'),
    ('Đăng nhập nhân sự', '/api/login', 'POST'),
    ('Gửi thư mời phỏng vấn (nodemailer SMTP)', 'Kích hoạt sau /api/sync (hàng đợi email_log)', 'Nodemailer'),
    ('Xem danh sách thư đã gửi', '/api/emails', 'GET'),
    ('Xử lý lại hàng đợi email', '/api/mail/process', 'POST'),
    ('Kiểm tra hệ thống', '/api/health', 'GET'),
]
add_table(['Service task (BPMN)', 'API thực tế', 'Phương thức'], table_rows, col_widths=[6.0, 5.0, 2.8])

doc.add_paragraph()
add_para('2.3 Cổng XOR → Điều kiện phê duyệt', bold=True, size=12)
table_rows = [
    ('Phê duyệt JD', 'status === "pending" và người dùng là Giám đốc / Nhân sự', 'Cho phép Duyệt / Từ chối'),
    ('', 'status === "cancelled"', 'Chặn phê duyệt (quy trình đã kết thúc)'),
    ('Đăng tin', 'status === "approved"', 'HR được vào nút Đăng tin'),
    ('', 'publish_status === "error"', 'Vào nhánh xử lý lỗi, có nút "Đăng lại"'),
    ('Hủy yêu cầu', 'Phòng ban yêu cầu hủy hợp lệ (lý do ≥ 5 ký tự)', 'Ngắt quy trình ngay, không cần Giám đốc phê duyệt'),
]
add_table(['Cổng XOR', 'Điều kiện rẽ nhánh', 'Kết quả'], table_rows, col_widths=[3.0, 6.0, 4.8])

doc.add_paragraph()
add_para('2.4 Lane → Phân quyền', bold=True, size=12)
table_rows = [
    ('Giám đốc', 'director', 'Phê duyệt/từ chối JD, xem báo cáo; không vào Settings/Users'),
    ('Nhân sự', 'hr', 'Tạo yêu cầu, đăng tin, sàng lọc, cài đặt, quản lý tài khoản'),
    ('Trưởng phòng', 'department_head', 'Tạo yêu cầu của phòng ban, hủy yêu cầu phòng ban mình; không vào Settings/Users'),
]
add_table(['Lane (BPMN)', 'Vai trò trong hệ thống', 'Quyền hạn thực tế'], table_rows, col_widths=[3.0, 2.6, 8.2])

# ── 3. Ngăn xếp công nghệ ──
doc.add_paragraph()
add_heading('3. Ngăn xếp công nghệ kèm lý do lựa chọn', 1)
table_rows = [
    ('Ngôn ngữ chính', 'Vanilla JavaScript (ES6+)', 'Không cần bundler/build tool, dễ chạy tĩnh trên Vercel, ít phụ sở, phù hợp prototype ATS'),
    ('Giao diện', 'HTML + CSS tùy biến (design.css, main.css, utilities.css) cùng các lớp utility gần Tailwind; icon Lucide SVG', 'Nhẹ, kiểm soát hoàn toàn giao diện, không cần framework JS nặng (React/Vue)'),
    ('Định tuyến', 'Hash-based client-side router (src/utils/router.js)', 'SPA đơn giản, không cần server-side routing, phù hợp hosting tĩnh'),
    ('Môi trường backend', 'Node.js', 'Có sẵn, dễ kết nối pg (PostgreSQL) và nodemailer'),
    ('Cơ sở dữ liệu', 'PostgreSQL qua Supabase (Session Pooler)', 'Quản trị liên tục, không cần tự vận hành DB server, gói miễn phí đủ dùng cho prototype'),
    ('Gửi email', 'Nodemailer + Gmail SMTP (App Password); dự phòng Ethereal (xem trước) và file outbox', 'Gửi thư thật không tốn phí dịch vụ email riêng, có chế độ xem trước khi chưa cấu hình SMTP'),
    ('Đọc CV (PDF/DOCX/TXT)', 'pdf.js 3.11.174 + mammoth 1.6.0 (chạy client-side, nạp từ CDN khi deploy)', 'Trích xuất văn bản ngay trên trình duyệt, không tốn tài nguyên server parse file'),
    ('Triển khai', 'Vercel (Serverless Functions cho api/*, static files cho frontend)', 'Miễn phí, tự động deploy từ GitHub, không cần quản lý server'),
    ('Phiên đăng nhập & token', 'HMAC-SHA256 custom token, TTL 12 giờ, lưu localStorage', 'Không cần thư viện JWT nặng, tự kiểm soát phiên, dễ bật/tắt bảo mật qua AUTH_REQUIRED'),
    ('Quản lý mã nguồn', 'Git + GitHub (hongsuong-commits/tuyendungnhansu, nhánh main)', 'Lưu lịch sử, cộng tác, deploy tự động qua Vercel'),
]
add_table(['Thành phần', 'Công nghệ', 'Lý do lựa chọn'], table_rows, col_widths=[3.0, 5.2, 5.6])

# ── 4. Quyết định kiến trúc ──
doc.add_paragraph()
add_heading('4. Các quyết định kiến trúc nhóm tự đưa ra', 1)

add_para('4.1 Dữ liệu lưu ở đâu', bold=True, size=12)
for item in [
    'Nguồn chính (source of truth): PostgreSQL trên Supabase (biến môi trường DATABASE_URL).',
    'Bản đệm phía client: localStorage (smart_ats_store_v1) lưu cache dữ liệu + payload thay đổi chưa gửi; đồng bộ diff lên server theo khoảng thời gian.',
    'Fallback: Nếu không có DATABASE_URL, hệ thống tự dùng backend tệp (data/store.json) để app vẫn hoạt động mà không hỏng.',
    'Hàng đợi email: bảng email_log trong PostgreSQL (trạng thái: pending → sending → sent | preview | failed); thư tạm có thể ghi vào /tmp trên Vercel.',
]:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(item); run.font.size = Pt(11)

add_para('4.2 Phân quyền thế nào', bold=True, size=12)
for item in [
    'Kiểm tra trước khi render qua Helpers.resolveRouteAccess(path, role) (src/utils/helpers.js) và Auth Guard (src/app.js).',
    'Mỗi route nội bộ được kiểm tra: chưa đăng nhập → về #/portal; đã đăng nhập vào #/login → về #/dashboard; vai trò không có quyền → về #/dashboard kèm toast cảnh báo.',
    'Phiên đăng nhập: Token HMAC-SHA256 có hiệu lực 12 giờ; gửi kèm header Authorization: Bearer <token> khi gọi /api/state, /api/sync, /api/emails, /api/mail/process.',
    'Nếu bật AUTH_REQUIRED=true trên Vercel, mọi request thiếu/sai/hết hạn token trả 401, kể cả gọi bằng Postman/curl.',
]:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(item); run.font.size = Pt(11)

add_para('4.3 Ứng dụng chạy ở đâu', bold=True, size=12)
for item in [
    'Frontend (HTML/JS/CSS): Vercel static hosting, tên miền https://tuyendungnhansu.vercel.app.',
    'Backend API: Vercel Serverless Functions trong thư mục ats-system/api/ (mapping sang /api/*), tối đa 30 giây/function, 1024 MB bộ nhớ.',
    'Phát triển local: chạy node server.js trên cổng 3000, kết nối PostgreSQL thật + SMTP Gmail thật.',
]:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(item); run.font.size = Pt(11)

add_para('4.4 Khóa bí mật được cất giữ ra sao', bold=True, size=12)
for item in [
    'File .env không commit lên Git (có trong .gitignore).',
    'Mật số produzione lưu trên Vercel Environment Variables (DATABASE_URL, DB_SSL, EMAIL_TRANSPORT, SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, AUTH_SECRET…).',
    'Mật khẩu người dùng không trả về trong phản hồi API (trường password được loại bỏ trước khi gửi JSON về client).',
    'localStorage chỉ lưu phiên người dùng và bản đệm dữ liệu; không lưu mật khẩu.',
    'Cảnh báo: SMTP_PASS (App Password Gmail) đã từng hiển thị trong các tin nhắn trò chuyện trước đó → nên xoá/App Password mới ngay để tránh rủi ro bảo mật.',
]:
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(item); run.font.size = Pt(11)

# ── Footer ──
doc.add_paragraph()
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run('--- Hết báo cáo ---')
run.italic = True
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

out_path = 'D:\\tuyendungnhansu\\Bao_Cao_Kien_Truc_SmartATS.docx'
doc.save(out_path)
print('DA TAO: ' + out_path)
