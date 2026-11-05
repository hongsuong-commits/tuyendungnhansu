from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ── Cấu hình trang ──
for section in doc.sections:
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

# ── Style mặc định ──
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
            run.font.size = Pt(10.5)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in table.rows:
                row.cells[i].width = Cm(w)
    return table

def add_bullet(text, size=11):
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(text)
    run.font.size = Pt(size)
    return p

# ================= NỘI DUNG =================
# Tiêu đề
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

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 1: Danh sách màn hình và vai trò
# ════════════════════════════════════════════════════════════════════════════
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
    add_bullet(note)

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 2: Bảng ánh xạ BPMN → tính năng
# ════════════════════════════════════════════════════════════════════════════
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

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 3: Ngăn xếp công nghệ
# ════════════════════════════════════════════════════════════════════════════
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

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 4: Quyết định kiến trúc
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
add_heading('4. Các quyết định kiến trúc nhóm tự đưa ra', 1)

add_para('4.1 Dữ liệu lưu ở đâu', bold=True, size=12)
for item in [
    'Nguồn chính (source of truth): PostgreSQL trên Supabase (biến môi trường DATABASE_URL).',
    'Bản đệm phía client: localStorage (smart_ats_store_v1) lưu cache dữ liệu + payload thay đổi chưa gửi; đồng bộ diff lên server theo khoảng thời gian.',
    'Fallback: Nếu không có DATABASE_URL, hệ thống tự dùng backend tệp (data/store.json) để app vẫn hoạt động mà không hỏng.',
    'Hàng đợi email: bảng email_log trong PostgreSQL (trạng thái: pending → sending → sent | preview | failed); thư tạm có thể ghi vào /tmp trên Vercel.',
]:
    add_bullet(item)

add_para('4.2 Phân quyền thế nào', bold=True, size=12)
for item in [
    'Kiểm tra trước khi render qua Helpers.resolveRouteAccess(path, role) (src/utils/helpers.js) và Auth Guard (src/app.js).',
    'Mỗi route nội bộ được kiểm tra: chưa đăng nhập → về #/portal; đã đăng nhập vào #/login → về #/dashboard; vai trò không có quyền → về #/dashboard kèm toast cảnh báo.',
    'Phiên đăng nhập: Token HMAC-SHA256 có hiệu lực 12 giờ; gửi kèm header Authorization: Bearer <token> khi gọi /api/state, /api/sync, /api/emails, /api/mail/process.',
    'Nếu bật AUTH_REQUIRED=true trên Vercel, mọi request thiếu/sai/hết hạn token trả 401, kể cả gọi bằng Postman/curl.',
]:
    add_bullet(item)

add_para('4.3 Ứng dụng chạy ở đâu', bold=True, size=12)
for item in [
    'Frontend (HTML/JS/CSS): Vercel static hosting, tên miền https://tuyendungnhansu.vercel.app.',
    'Backend API: Vercel Serverless Functions trong thư mục ats-system/api/ (mapping sang /api/*), tối đa 30 giây/function, 1024 MB bộ nhớ.',
    'Phát triển local: chạy node server.js trên cổng 3000, kết nối PostgreSQL thật + SMTP Gmail thật.',
]:
    add_bullet(item)

add_para('4.4 Khóa bí mật được cất giữ ra sao', bold=True, size=12)
for item in [
    'File .env không commit lên Git (có trong .gitignore).',
    'Mật số produktion lưu trên Vercel Environment Variables (DATABASE_URL, DB_SSL, EMAIL_TRANSPORT, SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, AUTH_SECRET…).',
    'Mật khẩu người dùng không trả về trong phản hồi API (trường password được loại bỏ trước khi gửi JSON về client).',
    'localStorage chỉ lưu phiên người dùng và bản đệm dữ liệu; không lưu mật khẩu.',
    'Cảnh báo: SMTP_PASS (App Password Gmail) đã từng hiển thị trong các tin nhắn trò chuyện trước đó → nên xoá/App Password mới ngay để tránh rủi ro bảo mật.',
]:
    add_bullet(item)

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 5: 4.1 Ứng dụng web - 6 yêu cầu kỹ thuật tối thiểu
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
add_heading('5. Ứng dụng web — Chứng minh đáp ứng 6 yêu cầu kỹ thuật tối thiểu', 1)

add_para('5.1 Yêu cầu 1: Xác thực với ít nhất 3 vai trò', bold=True, size=12)
add_para(
    'Hệ thống triển khai mô hình RBAC với 3 vai trò nội bộ rõ ràng trong PAGE_ACCESS (src/utils/helpers.js) '
    'và Auth Guard (src/app.js):'
)
table_rows = [
    ('Giám đốc', 'director', 'Tổng quan, Yêu cầu, Ứng viên, Sàng lọc, Lịch phỏng vấn, Đánh giá, Tin, Báo cáo, Hồ sơ, Thông báo. Không vào Cài_settings và Quản lý người dùng.'),
    ('Nhân sự', 'hr', 'Toàn quyền khu vực quản trị, bao gồm Cài đặt và Quản lý người dùng.'),
    ('Trưởng phòng', 'department_head', 'Yêu cầu của phòng mình, Ứng viên, Sàng lọc, Lịch phỏng vấn, Đánh giá, Tin. Không vào Cài_settings và Quản lý người dùng.'),
]
add_table(['Vai trò', 'Mã', 'Mức truy cập'], table_rows, col_widths=[2.6, 2.2, 9.0])
add_para(
    'Mekanism: Helpers.resolveRouteAccess(path, user) chặn trước khi render; chưa đăng nhập dán link '
    '#/interviews sẽ bị đẩy về #/portal; phiên có TTL 12 giờ và token HMAC-SHA256.'
)

add_para('5.2 Yêu cầu 2: Ít nhất 3 luồng phê duyệt theo cổng XOR', bold=True, size=12)
add_para(
    'Hệ thống mô hình hóa 4 luồng cổng XOR trong src/data/store.js (gắn nhãn BPMN trong tài liệu thiết kế):'
)
table_rows = [
    ('1', 'Xem xét & phê duyệt JD', 'status === pending && role ∈ {director, hr}', 'Phê duyệt được', 'approved / rejected'),
    ('', '', 'status === cancelled', 'Chặn phê duyệt', 'Quy trình đã kết thúc'),
    ('2', 'Đăng tin tuyển dụng', 'status === approved', 'Cho phép đăng tin', 'Chuyển sang recruiting'),
    ('', '', 'publish_status === error', 'Vào nhánh xử lý lỗi', 'Có nút Đăng lại (retryPublish)'),
    ('3', 'Nhắc nhở JD quá hạn (Non-interrupting Timer)', 'waitingMinutes ≥ 480', 'Gửi nhắc giám đốc', 'Trạng thái không đổi (pending), hoạt động phê duyệt không gián đoạn'),
    ('4', 'Hủy yêu cầu (Event Sub-Process)', 'Phòng ban yêu cầu hủy hợp lệ (lý do ≥ 5 ký tự)', 'Ngắt quy trình ngay', 'cancelled, đóng tin, hủy lịch phỏng vấn, không cần Giám đốc'),
]
add_table(['#', 'Luồng (User Task)', 'Cổng XOR / Điều kiện', 'Hành động', 'Kết quả'], table_rows, col_widths=[0.8, 3.6, 4.2, 3.2, 3.6])

add_para('5.3 Yêu cầu 3: Lưu trữ bền vững', bold=True, size=12)
for item in [
    'Nguồn chính: PostgreSQL trên Supabase (DATABASE_URL), kết nối qua pg pool với tham số hóa (chống SQL injection).',
    'Bản đệm client: localStorage (smart_ats_store_v1) lưu cache + payload thay đổi chưa gửi; sync engine diff và replay khi mạng/máy chủ hồi phục.',
    'Fallback: Nếu thiếu DATABASE_URL, hệ thống tự dùng backend tệp data/store.json để app vẫn chạy.',
    'Hàng đợi email: bảng email_log trong PostgreSQL (pending → sending → sent | preview | failed).',
]:
    add_bullet(item)

add_para('5.4 Yêu cầu 4: Ít nhất 1 tích hợp bên ngoài', bold=True, size=12)
for item in [
    'Nodemailer + Gmail SMTP (App Password): gửi thư mời/đổi lịch/hủy lịch thật tới email ứng viên.',
    'Ethereal (preview) và file outbox (/tmp trên Vercel): chế độ dự phòng khi SMTP chưa cấu hình.',
    'pdf.js 3.11.174 + mammoth 1.6.0 qua CDN (unpkg) khi chạy trên Vercel: đọc trích xuất văn bản CV ở client-side.',
    'Vercel Serverless Functions cho toàn bộ API /api/*.',
]:
    add_bullet(item)

add_para('5.5 Yêu cầu 5: Bộ kiểm thử tự động', bold=True, size=12)
table_rows = [
    ('test-suite.js', 'Luồng chức năng chính (69 bài)', '69/69 PASS'),
    ('test-exceptions.js', '3 ngoại lệ BPMN + nút cờ 2 chiều', 'PASS'),
    ('test-auth-guard.js', 'Phân quyền & bảo mật điều hướng', 'PASS'),
    ('test-interview-notifications.js', 'Email mời/đổi lịch/hủy lịch', 'PASS'),
    ('test-ui-fixes.js', 'Nút X tìm kiếm, bắt buộc CV, giới tính, nút × tự gắn lại', 'PASS'),
    ('test-interviews-order.js', 'Sắp xếp lịch theo ngày+giờ', 'PASS'),
    ('test-cv-parse.js', 'Trích xuất CV (tên, email, SĐT, giới tính, ngày sinh…)', 'PASS'),
    ('test-pdf-extract.js', 'Đọc PDF mẫu', 'PASS'),
    ('test-vercel-api.js', 'Kiểm tra serverless API trên Vercel', 'PASS'),
]
add_table(['File kiểm thử', 'Mục đích', 'Kết quả'], table_rows, col_widths=[4.2, 6.0, 3.2])
add_para('Hệ thống có 9 file kiểm thử, chạy hoàn toàn tự động bằng Node.js (không cần server riêng cho phần lớn).')

add_para('5.6 Yêu cầu 6: Ít nhất 15 commit Git', bold=True, size=12)
add_para(
    'Lịch sử Git trên nhánh main (repo hongsuong-commits/tuyendungnhansu) hiện có hơn 15 commit, ví dụ: '
    '8885c00, 19d0e8b, fe3cbe9, fa3bade, 2f6e1d0, cbd2d77, 38cbc5a, e7ed7aa, df1b7dd, '
    '63bcb1d, 43991dd, 8db99d2, 0e8b9c9, c307016, … — đủ điều kiện ≥15 commit.'
)

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 6: 4.2 Nhật ký làm việc với AI
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
add_heading('6. Nhật ký làm việc với AI (tối thiểu 10 lượt tương tác)', 1)
add_para(
    'Mỗi lượt tương tác gồm: Prompt, Kết quả, Đánh giá, Điều chỉnh. Có 2 lượt thất bại được phân tích '
    'nguyên nhân theo mẫu thất bại đã học (lỗi ước lượng ngữ cảnh, sai giả định ma trận quyền).'
)
table_rows = [
    ('1', 'Sửa cv-file.js chọn CDN trước trên Vercel + khai báo standardFontDataUrl', 'Hết lỗi 404 node_modules và cảnh báo font pdf.js', 'Thành công', 'Commit cbd2d77, deploy Vercel xác nhận'),
    ('2', 'Sửa mailer.queueStats báo đúng chế độ gửi (smtp thay vì file)', '/api/health báo mail.mode:smtp', 'Thành công', 'Commit 38cbc5a'),
    ('3', 'Thêm 3 ngoại lệ BPMN (nhắc JD 480p, lỗi đăng tin, hủy yêu cầu) + sửa nút cờ 2 chiều', 'Toàn bộ test ngoại lệ PASS', 'Thành công', 'Commit e7ed7aa'),
    ('4', 'Sửa bảo mật: không tự đăng nhập hr1 khi logout, phiên 12h, token API', 'Guard chặn #/interviews khi chưa đăng nhập → về #/portal', 'Thành công', 'Commit df1b7dd'),
    ('5', 'Thêm email tự động khi đổi lịch và hủy lịch (kèm lý do, chống gửi trùng)', 'Gửi 3 loại thư (mời/đổi/hủy) đúng email đăng ký', 'Thành công', 'Commit cd1780e'),
    ('6', 'Thêm nút × xoá tìm kiếm + tự gắn lại sau render; thông báo theo vai trò + tự đánh dấu đã đọc khi mở chuông', 'Nút × tồn tại sau khi lọc; thông báo không báo lại tin cũ', 'Thành công', 'Commit 63bcb1d'),
    ('7', 'Bắt buộc nộp CV khi ứng tuyển; bấm cả khung kéo-thả chọn tệp; tô đỏ khi thiếu', 'Form chặn gửi nếu thiếu CV, khung chuyển đỏ', 'Thành công', 'Commit 43991dd'),
    ('8', 'Giới tính chỉ Nam/Nữ, mặc định Vui lòng chọn giới tính, bỏ Khác', 'Form và bộ đọc CV không còn mặc định Khác', 'Thành công', 'Commit c307016'),
    ('9', 'Sắp xếp lịch phỏng vấn theo ngày+giờ (sắp tới trước, đã qua sau); sửa trùng ID khi tạo nhiều lịch cùng mili-giây', 'Danh sách lịch đúng thứ tự thời gian', 'Thành công', 'Commit 8db99d2'),
    ('10', 'Màu trạng thái, nút quay lại từ Tổng quan, đánh giá 1-5, điểm tổng tự tính', 'Màu badge đúng trạng thái; điểm đánh giá kẹp 1-5', 'Thành công', 'Commit 0e8b9c9'),
    ('11', 'Thất bại 1: Test test-auth-guard ban đầu giả định Giám đốc vào được #/users', 'Test FAIL do ma trận PAGE_ACCESS cho phép Giám đốc vào Users', 'Thất bại — sai giả định quyền hạn', 'Sửa PAGE_ACCESS: loại settings, users khỏi danh sách Giám đốc; commit df1b7dd'),
    ('12', 'Thất bại 2: Test test-email-flow ban đầu kỳ vọng đổi lịch không gửi mail', 'Test FAIL vì đặc tả đã đổi (đổi lịch phải gửi mail)', 'Thất bại — sai ước lượng yêu cầu negocio', 'Cập nhật đặc tả và test: đổi lịch gửi mail, chốt tuyển dụng không gửi; commit cd1780e'),
]
add_table(['#', 'Prompt (tóm tắt)', 'Kết quả', 'Đánh giá', 'Điều chỉnh'], table_rows, col_widths=[0.8, 4.6, 4.2, 3.4, 4.0])

doc.add_paragraph()
add_para('Phân tích mẫu thất bại:', bold=True, size=11)
add_bullet('Lỗi ước lượng ngữ cảnh (lượt 11): suy nghĩ theo vai trò quản lý tổng thể thay vào vai trò giám sát phê duyệt theo yêu cầu ban đầu. Nguyên nhân: không đồng bộ ma trận quyền trước khi viết test.')
add_bullet('Lỗi sai ước lượng yêu cầu (lượt 12): dựa trên đặc tả cũ chỉ gửi mail khi hẹn lịch mà không cập nhật khi yêu cầu mới về đổi/hủy lịch. Nguyên nhân: đặc tả thay đổi giữa chừng mà không sync lại bộ kiểm thử.')

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 7: 4.3 Kiểm thử và bảo mật
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
add_heading('7. Kiểm thử và bảo mật', 1)

add_para('7.1 Kết quả kiểm thử theo 6 nhóm tiêu chí hoàn thành', bold=True, size=12)
table_rows = [
    ('1. Chức năng chính', 'Tạo yêu cầu, sàng lọc CV, hẹn phỏng vấn, đánh giá, chốt tuyển dụng', 'test-suite.js 69/69 PASS'),
    ('2. Ngoại lệ BPMN', 'Nhắc JD 480p, lỗi đăng tin+đăng lại, hủy yêu cầu ngắt quy trình', 'test-exceptions.js PASS'),
    ('3. Phân quyền & auth', '12 trang quản trị bị chặn khi chưa đăng nhập, phiên 12h, token API, vai trò director/hr/dept_head', 'test-auth-guard.js PASS'),
    ('4. Giao diện & UX', 'Nút × tìm kiếm tự gắn lại, bắt buộc CV, giới tính Nam/Nữ, sắp xếp lịch', 'test-ui-fixes.js, test-interviews-order.js PASS'),
    ('5. Email thật SMTP', 'Gửi 3 thư mời/đổi/hủy qua Gmail SMTP thật, trạng thái sent', 'test-email-flow.js PASS (status sent, provider smtp)'),
    ('6. API Serverless Vercel', '/api/health, /api/state, /api/login, /api/sync chạy trên Vercel', 'test-vercel-api.js PASS'),
]
add_table(['Nhóm tiêu chí', 'Nội dung kiểm tra', 'Kết quả'], table_rows, col_widths=[3.4, 5.4, 4.4])

doc.add_paragraph()
add_para('7.2 Checklist bảo mật (đã ký xác nhận)', bold=True, size=12)
table_rows = [
    ('1', 'Xác thực trước khi vào khu vực quản trị', 'Hoàn thành', 'Auth Guard chặn trước render'),
    ('2', 'Phiên đăng nhập có hạn (12 giờ)', 'Hoàn thành', 'SESSION_TTL_MS, token HMAC-SHA256'),
    ('3', 'Token gửi kèm header Authorization: Bearer cho API nhạy cảm', 'Hoàn thành', '/api/state, /api/sync, /api/emails, /api/mail/process'),
    ('4', 'Bật AUTH_REQUIRED=true trên Vercel → request thiếu token trả 401', 'Sẵn sàng', 'Chưa bật mặc định'),
    ('5', 'Mật khẩu không trả về trong phản hồi API', 'Hoàn thành', 'Trường password bị loại bỏ'),
    ('6', 'File .env không commit lên Git', 'Hoàn thành', 'Có trong .gitignore'),
    ('7', 'Mật số produktion lưu trên Vercel Environment Variables', 'Hoàn thành', 'DATABASE_URL, SMTP_*, AUTH_SECRET'),
    ('8', 'Truy vấn DB dùng tham số hóa ($1, $2) → chống SQL injection', 'Hoàn thành', 'Thư viện pg'),
    ('9', 'Xoá toàn bộ localStorage khi logout (user, session, store, pending, snapshot)', 'Hoàn thành', 'Hàm logout()'),
    ('10', 'SMTP App Password đã rò rỉ trong chat trước đó → cần xoá/tạo mới', 'Cảnh báo', 'Cảnh báo nghiêm trọng, cần rotate ngay'),
]
add_table(['#', 'Mục kiểm tra', 'Trạng thái', 'Ghi chú'], table_rows, col_widths=[0.8, 5.0, 2.8, 5.0])

# ════════════════════════════════════════════════════════════════════════════
# PHẦN 8: 4.4 Đánh giá hiệu quả
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
add_heading('8. Đánh giá hiệu quả (As-is vs To-be)', 1)
table_rows = [
    ('Thời gian chu trình yêu cầu → đăng tin', 'Thủ công qua Zalo/Email, khoảng 2–3 ngày', 'Tự động trong hệ thống, < 30 phút'),
    ('Số bàn giao (HR ↔ Giám đốc ↔ Trưởng phòng)', '5–6 lần qua kênh ngoài hệ thống', '1–2 lần trong hệ thống (nút Duyệt/Từ chối, Đăng tin)'),
    ('Nút cổ chai 1: Phê duyệt JD', 'Không theo dõi, dễ quên', 'Cảnh báo tự động sau 480 phút, không gián đoạn phê duyệt'),
    ('Nút cổ chai 2: Đọc CV sàng lọc', 'Thủ công đọc từng file', 'AI trích xuất + điểm sàng lọc tự động ngay khi nộp'),
    ('Nút cổ chai 3: Lịch phỏng vấn', 'Gọi điện/Zalo để đổi/hủy', 'Email tự động mời/đổi/hủy kèm giờ-ngày-địa điểm'),
]
add_table(['Chỉ số', 'As-is (trước)', 'To-be (sau)'], table_rows, col_widths=[4.4, 4.6, 4.4])

doc.add_paragraph()
add_para('Hạn chế còn lại:', bold=True, size=11)
for item in [
    'PDF scan/ảnh: Hệ thống chưa đọc được PDF không có lớp văn bản (cần OCR như Tesseract).',
    'API chưa RESTful thuần: Hiện tại tập trung vào /api/state + /api/sync (bulk upsert), chưa có PATCH/DELETE từng tài nguyên chuẩn REST.',
    'Phân trang API: /api/state trả toàn bộ dữ liệu, chưa phân trang cho danh sách lớn.',
    'Xác thực production: Hiện dùng token HMAC tùy chỉnh; chưa tích hợp JWT/OAuth2/SSO doanh nghiệp.',
]:
    add_bullet(item)

add_para('Đề xuất tiếp theo:', bold=True, size=11)
for item in [
    'Bổ sung OCR (Tesseract.js) cho PDF scan.',
    'Xây dựng lớp API chuẩn /api/v1/* (tài nguyên, phân trang, lọc) song song với hệ thống hiện tại.',
    'Bật AUTH_REQUIRED=true + AUTH_SECRET trên Vercel và rotate SMTP_PASS ngay.',
    'Triển khai JWT/OAuth2 cho quản trị doanh nghiệp lớn.',
]:
    add_bullet(item)

# ── Footer ──
doc.add_paragraph()
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run('--- Hết báo cáo ---')
run.italic = True
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

out_path = 'D:\\tuyendungnhansu\\Bao_Cao_Kien_Truc_SmartATS_PhuL.docx'
doc.save(out_path)
print('DA TAO: ' + out_path)
