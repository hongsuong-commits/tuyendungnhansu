from docx import Document
from docx.shared import Pt, RGBColor, Cm
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
run = title.add_run('MÔ TẢ ĐẦU VÀO – XỬ LÝ – ĐẦU RA (IPO)\nHỆ THỐNG QUẢN LÝ TUYỂN DỤNG THÔNG MINH (SmartATS)')
run.bold = True
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(0x1F, 0x3B, 0x63)

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub.add_run('Môn học: Công nghệ phần mềm / Kiến trúc hệ thống\nMã sinh viên: ... | Ngày nộp: ...')
run.font.size = Pt(11)
run.italic = True

doc.add_paragraph()

# ── 1. Mô tả tổng quan ──
add_heading('1. Mô tả tổng quan', 1)
add_para(
    'SmartATS là ứng dụng web đơn trang (SPA, không cần trình đóng gói) chạy trên Vercel, '
    'dùng PostgreSQL qua Supabase làm nguồn dữ liệu chính, và Node.js làm máy chủ API. '
    'Người dùng tương tác qua trình duyệt; các dữ liệu được truyền qua JSON và giao tiếp qua '
    'REST API (/api/state, /api/sync, /api/login, /api/mail/process, /api/emails).'
)

# ── 2. Bảng chi tiết theo chức năng ──
add_heading('2. Đầu vào – Xử lý – Đầu ra theo từng chức năng', 1)

rows = [
    ('Đăng nhập nhân sự',
     'Tên đăng nhập, mật khẩu',
     'Kiểm tra tra cứu trong cơ sở dữ liệu; tạo token phiên HMAC-SHA256 (hiệu lực 12 giờ)',
     'Token phiên, thông tin người dùng (không trả về mật khẩu); chuyển hướng sang trang quản trị nếu thành công'),
    ('Tạo yêu cầu tuyển dụng (JD)',
     'Tên vị trí, phòng ban, số lượng, lương, hình thức, địa điểm, hạn nộp, lý do, kỹ năng bắt buộc, mô tả, yêu cầu',
     'Kiểm tra quyền HR/Trưởng phòng; chuẩn hoá kinh nghiệm tối thiểu (0–60 năm); lưu vào bảng yêu cầu; trạng thái mặc định: Chờ phê duyệt',
     'Bản ghi yêu cầu trong cơ sở dữ liệu; thông báo thành công hoặc lỗi (vủa quyền, thiếu trường)'),
    ('Phê duyệt/Từ chối yêu cầu',
     'ID yêu cầu, phê duyệt/từ chối, ghi chú',
     'Kiểm tra quyền Giám đốc/HR; chặn nếu yêu cầu đã hủy/đóng; ghi lịch sử duyệt',
     'Cập nhật trạng thái yêu cầu (approved/rejected); thông báo vào hồ sơ'),
    ('Đăng tin tuyển dụng',
     'ID yêu cầu, tiêu đề tin, lương, hạn nộp, phúc lợi, kênh đăng',
     'Kiểm tra yêu cầu đã được phê duyệt; mô phỏng lỗi kết nối sàn bên ngoài nếu bật tùy chọn thử nghiệm; tạo bản tin trên bảng postings; nếu lỗi → chuyển sang nhánh xử lý ngoại lệ (publish_status = error)',
     'Tin tuyển dụng được xuất bản (published) hoặc lỗi (publish_error); thông báo HR khi lỗi; nút “Đăng lại” sau khi khắc phục'),
    ('Ứng tuyển qua cổng công khai',
     'Họ tên, email, SĐT, giới tính, ngày sinh, kinh nghiệm, học vấn, file CV (.pdf/.docx/.txt)',
     'Bắt buộc nộp CV (không CV thì không gửi); đọc văn bản CV bằng pdf.js/mammoth; trích xuất tên, email, SĐT, giới tính, ngày sinh, kinh nghiệm, học vấn, kỹ năng, chứng chỉ; tự điền các ô còn trống (không ghi đè dữ liệu người dùng đã nhập)',
     'Bản ứng viên (candidates) và bản hồ sơ ứng tuyển (applications) trong CSDL; email mời phỏng vấn nếu được lên lịch ngay'),
    ('Sàng lọc CV',
     'Skill bắt buộc, kinh nghiệm tối thiểu, học vấn tối thiểu, trọng số kỹ năng/kinh nghiệm/học vấn/chứng chỉ',
     'Đánh giá ứng viên theo điểm số (kỹ năng 40%, kinh nghiệm 30%, học vấn 15%, chứng chỉ 15%); phân loại: Đạt / Cần kiểm tra thủ công / Không đạt',
     'Điểm sàng lọc, tiêu chí đạt/thiếu, ghi chú tự động; cập nhật trạng thái hồ sơ (pending_review / passed_screening / need_info)'),
    ('Lên lịch phỏng vấn',
     'ID ứng viên, vòng phỏng vấn, ngày, giờ bắt đầu/kết thúc, hình thức (online/onsite), địa điểm/liên kết, hội đồng',
     'Kiểm tra trùng lịch (ứng viên và hội đồng); tạo bản phỏng vấn (interviews); gửi email mời kèm giờ–ngày–địa điểm; nếu thay đổi giờ/ngày → gửi email thay đổi lịch',
     'Bản ghi phỏng vấn; email mời phỏng vấn / email thay đổi lịch; cập nhật trạng thái ứng viên thành Đã lên lịch phỏng vấn'),
    ('Đánh giá phỏng vấn',
     'ID phỏng vấn, điểm 4 tiêu chí (1–5), nhận xét từng tiêu chí, nhận xét tổng hợp, đề xuất (Đề xuất/Cân nhắc/Không tiếp tục)',
     'Chặn điểm ngoài 1–5; tính điểm tổng = trung bình 4 tiêu chí × 20 (tự động, không nhập tay); ghi nhận đánh giá vào bảng evaluations',
     'Phiếu đánh giá lưu trong CSDL; cập nhật trạng thái ứng viên (Đề xuất tuyển dụng / Cân nhắc / Không đạt)'),
    ('Hủy lịch phỏng vấn',
     'ID lịch, lý do hủy',
     'Chặn nếu chưa từng gửi thông báo; ghi lý do, thời gian hủy; gửi email hủy kèm lý do; đóng tin tuyển dụng liên quan; hủy các lịch phỏng vấn đang chờ của yêu cầu đó (nếu yêu cầu bị hủy)',
     'Email hủy lịch; cập nhật trạng thái phỏng vấn (cancelled); thông báo HR và Giám đốc'),
    ('Hủy yêu cầu tuyển dụng',
     'ID yêu cầu, lý do hủy (tối thiểu 5 ký tự)',
     'Kiểm tra quyền (Trưởng phòng đúng phòng ban, hoặc HR/ĐG); nếu yêu cầu đã chờ > 480 phút vẫn có thể hủy; ngắt quy trình ngay (không cần duyệt); đóng tin đang đăng; hủy lịch đang chờ; ghi lịch sử hủy',
     'Email thông báo hủy cho HR và Giám đốc; trạng thái yêu cầu = cancelled; chặn phê duyệt sau khi hủy'),
    ('Quét nhắc nhở quá hạn phê duyệt',
     '(Chạy nền mỗi 60 giây)',
     'Tìm yêu cầu pending chờ > 480 phút (cấu hình được); gửi nhắc nhở cho Giám đốc mỗi chu kỳ; không gián đoạn hoạt động phê duyệt',
     'Thông báo nhắc nhở vào bảng thông báo; ghi lịch sử reminder; cờ overdue trên yêu cầu'),
]
add_table(['Chức năng', 'Đầu vào (Input)', 'Xử lý (Process)', 'Đầu ra (Output)'], rows, col_widths=[2.8, 3.4, 4.0, 3.2])

# ── 3. Luồng dữ liệu CV ──
doc.add_paragraph()
add_heading('3. Luồng dữ liệu CV (từ file đến hồ sơ ứng tuyển)', 1)
add_para(
    '[File CV: .pdf / .docx / .txt]  →  [Trình duyệt đọc file bằng pdf.js / mammoth]  →  '
    '[Văn bản thô (raw text)]  →  [CVEngine.parseText() trong store.js]  →  '
    '[Trích xuất Email, SĐT, Họ tên, Giới tính, Ngày sinh, Học vấn, Kinh nghiệm, Kỹ năng, Chứng chỉ]  →  '
    '[Cơ sở dữ liệu: candidates + applications]  →  [Đánh giá sàng lọc AI]  →  [Điểm số + Phân loại]'
)

doc.add_paragraph()
add_para(
    'Chi tiết trích xuất CV: HỌ TÊN / NAME / ỨNG VIÊN; GIỚI TÍNH / GENDER (chỉ lưu Nam hoặc Nữ); '
    'NGÀY SINH / DOB; SĐT (hỗ trợ +84, số 10 số, số cũ 11 số, máy bàn, số trong ngoặc); '
    'HỌC VẤN, KINH NGHIỆM (số năm), KỸ NĂNG, CHỨNG CHỈ.'
)

# ── 4. Đầu vào / Đầu ra theo vai trò ──
add_heading('4. Đầu vào / Đầu ra theo vai trò người dùng', 1)
rows = [
    ('Ứng viên (cổng công khai)', 'File CV, thông tin cá nhân, chọn vị trí ứng tuyển', 'Xác nhận đã gửi, email mời phỏng vấn (nếu được lên lịch), tra cứu tiến độ qua Email/SĐT'),
    ('Nhân sự (HR)', 'Tạo yêu cầu, duyệt tin, sàng lọc CV, lên lịch, đánh giá, cài đặt hệ thống', 'Danh sách ứng viên, điểm sàng lọc, email mời/thay đổi/hủy lịch, báo cáo'),
    ('Trưởng phòng', 'Tạo yêu cầu của phòng ban, hủy yêu cầu của phòng mình', 'Yêu cầu của phòng, thông báo khi yêu cầu bị hủy hoặc quá hạn'),
    ('Giám đốc', 'Phê duyệt/từ chối yêu cầu, xem báo cáo', 'Thông báo nhắc nhở quá hạn, báo cáo phễu tuyển dụng'),
]
add_table(['Vai trò', 'Đầu vào chính', 'Đầu ra chính'], rows, col_widths=[2.8, 3.6, 4.0])

# ── 5. Sơ đồ IPO đơn giản ──
add_heading('5. Sơ đồ IPO đơn giản', 1)
add_para(
    '┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐'
)
add_para(
    '│   NGƯỜI DÙNG │─────►│   ỨNG DỤNG WEB   │─────►│   KẾT QUẢ       │'
)
add_para(
    '│ (Ứng viên/  │      │   (SPA, Vercel)  │      │   (Hiển thị,    │'
)
add_para(
    '│  HR, ĐG, TP) │      │   HTML/JS/CSS    │      │   Email, CSDL)  │'
)
add_para(
    '└─────────────┘      └──────────────────┘      └─────────────────┘'
)
add_para(
    '        │                   │                   ▲'
)
add_para(
    '        │                   │                   │'
)
add_para(
    '        ▼                   ▼                   │'
)
add_para(
    '   [NHẬP]           [XỬ LÝ BÊN TRONG]        │'
)
add_para(
    '   - File CV         - parseText (pdf.js/   - Bản ứng viên'
)
add_para(
    '   - Thông tin         mammoth)               & hồ sơ'
)
add_para(
    '   - Phê duyệt/hủy   - Điểm sàng lọc AI     & điểm số'
)
add_para(
    '   - Lên lịch         - Gửi email (nodemailer)& lịch phỏng vấn'
)
add_para(
    '                     - Lưu PostgreSQL       & thông báo'
)

# ── 6. Lưu ý lưu trữ và đồng bộ ──
add_heading('6. Lưu ý về lưu trữ và đồng bộ', 1)
for item in [
    'Nguồn chính (source of truth): PostgreSQL trên Supabase (biến môi trường DATABASE_URL).',
    'Bản đệm phía client: localStorage (smart_ats_store_v1) lưu cache dữ liệu + payload thay đổi chưa gửi; hệ thống diff và gửi lên server theo khoảng thời gian (/api/sync).',
    'Fallback: Nếu thiếu DATABASE_URL, hệ thống tự dùng tệp cục bộ data/store.json để ứng dụng vẫn hoạt động.',
    'Email: Hàng đợi email_log trong PostgreSQL (pending → sending → sent | preview | failed); gửi thật qua Gmail SMTP (App Password); hỗ trợ chế độ xem trước (Ethereal) và lưu file tạm khi chưa cấu hình SMTP.',
]:
    add_bullet(item)

# ── Footer ──
doc.add_paragraph()
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run('--- Hết báo cáo IPO ---')
run.italic = True
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

out_path = 'D:\\tuyendungnhansu\\IPO_SmartATS.docx'
doc.save(out_path)
print('DA TAO: ' + out_path)
