# SMARTATS - HỆ THỐNG QUẢN LÝ TUYỂN DỤNG THÔNG MINH (APPLICANT TRACKING SYSTEM)

SmartATS là giải pháp phần mềm quản lý tuyển dụng toàn diện (SaaS Applicant Tracking System) được thiết kế hiện đại, chuyên nghiệp, tối ưu trải nghiệm người dùng và tự động hóa quy trình tuyển dụng từ đầu đến cuối: từ tạo nhu cầu nhân sự, đăng tin đa kênh, tiếp nhận hồ sơ, trích xuất đọc CV tự động, sàng lọc ứng viên, lên lịch phỏng vấn, chấm điểm hội đồng đến báo cáo phân tích chuyên sâu.

---

## 1. DANH SÁCH TÀI KHOẢN TRẢI NGHIỆM DEMO

Hệ thống đã chuẩn bị sẵn 4 vai trò nội bộ với dữ liệu thực tế:

| Vai trò | Tên đăng nhập | Mật khẩu | Họ và tên | Chức danh / Phòng ban | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giám đốc** | `director` | `123456` | Trần Đình Long | Tổng Giám Đốc | Xem toàn bộ Dashboard, Báo cáo; Phê duyệt/Từ chối yêu cầu tuyển dụng; Phê duyệt quyết định tuyển dụng cuối cùng |
| **Trưởng phòng** | `head_it` | `123456` | Lê Văn Hùng | Giám đốc Công nghệ (CTO) | Xem & tạo yêu cầu tuyển dụng phòng CNTT; Theo dõi & chấm điểm phỏng vấn ứng viên phòng mình |
| **Trưởng phòng** | `head_sales` | `123456` | Phạm Thị Mai | Trưởng phòng Kinh doanh | Tạo yêu cầu vị trí B2B Sales; Phỏng vấn chuyên môn và đề xuất tuyển dụng |
| **Nhân sự (HR)** | `hr1` | `123456` | Nguyễn Thu Hà | Senior Talent Acquisition | Toàn quyền nghiệp vụ tuyển dụng: Đăng tin, thiết lập tiêu chí, duyệt CV, xếp lịch phỏng vấn, cấu hình cài đặt |
> Ứng viên **không có tài khoản nội bộ**. Họ nộp hồ sơ và tra cứu tiến độ tại Cổng tuyển dụng công khai `#/portal` bằng email/số điện thoại đã dùng khi nộp CV.

> *Gợi ý:* Tại màn hình Đăng nhập `#/login`, bạn có thể bấm vào mục **"Tài khoản demo"** để tự động điền nhanh tài khoản và mật khẩu chỉ bằng 1 cú nhấp chuột.

---

## 2. TỔNG QUAN CÁC CHỨC NĂNG HỆ THỐNG

### 2.1. Thiết kế Giao diện Tổng thể & Responsive
- Thiết kế SaaS Dashboard chuẩn phong cách quốc tế với bảng màu nhận diện: Xanh dương chủ đạo (`#1e40af`, `#3b82f6`), Xanh lá cho trạng thái Đạt (`#16a34a`), Vàng cam cho trạng thái Đang xử lý (`#d97706`), Đỏ cho trạng thái Từ chối (`#dc2626`).
- Font chữ tiếng Việt hiện đại Inter, bố cục Sidebar có thể thu gọn, Header điều hướng thông minh với chuông thông báo và menu hồ sơ.
- **Thông báo theo vai trò:** mỗi người chỉ thấy thông báo chung và thông báo đúng vai trò của mình (HR không thấy nhắc nhở riêng của giám đốc). Mở chuông xem thông báo sẽ **tự đánh dấu đã đọc** và lưu vào database, nên lần đăng nhập sau không báo lại tin cũ.
- **Ô tìm kiếm trên mọi trang** (việc làm, hồ sơ đã ứng tuyển, ứng viên, yêu cầu, tin tuyển dụng, lịch phỏng vấn, tìm kiếm nhanh ở header) đều có nút **×** để xoá nhanh toàn bộ nội dung — thuận tiện khi nhập sai trên điện thoại. Nút này **tự gắn lại sau mỗi lần tìm kiếm/lọc** (trang render lại vẫn còn nút).
- **Lịch phỏng vấn sắp theo lịch**, không theo lúc tạo: lịch sắp tới đứng trước (gần nhất lên đầu, cùng ngày thì giờ sớm trước), lịch đã qua xếp cuối danh sách.
- **Màu trạng thái rõ ràng:** mỗi trạng thái có màu riêng dễ nhận biết — Đang tuyển (xanh dương), Đã tuyển/Đạt (xanh lá), Chờ phê duyệt/Đang xử lý (vàng cam), Từ chối/Hủy (đỏ), Đã đóng/Nháp (xám).
- **Tổng quan → Mở hồ sơ:** mở thẳng hồ sơ ứng viên tương ứng, có nút **Quay lại Tổng quan**; nút “Xem hồ sơ ứng viên đầy đủ” ở trang Sàng lọc CV cũng mở đúng hồ sơ từ mọi trang.
- **Đánh giá ứng viên theo thang 1–5:** 4 tiêu chí chỉ nhận giá trị 1–5 (chặn cả ở giao diện lẫn tầng dữ liệu); **điểm tổng kết tự tính** = trung bình 4 tiêu chí × 20, không cho nhập tay.
- Đáp ứng tốt mọi kích thước màn hình: Desktop (1440px), Laptop/Tablet (1024px, 768px) và Mobile (640px, 375px) với Drawer menu và table cuộn mượt mà.

### 2.2. Phân quyền Người dùng theo 3 Vai trò Nội bộ (RBAC)
- **Giám đốc:** Quyền giám sát chiến lược, chỉ xem số liệu tổng quan toàn công ty, phê duyệt yêu cầu và quyết định tuyển dụng; không can thiệp sửa đổi dữ liệu nghiệp vụ tác nghiệp.
- **Trưởng phòng:** Quyền hạn giới hạn theo phạm vi phòng ban mình quản lý, tạo yêu cầu tuyển dụng, tham gia phỏng vấn chuyên môn và gửi đánh giá.
- **Nhân viên Nhân sự (HR):** Đầy đủ quyền tác nghiệp tuyển dụng đa kênh, cấu hình trọng số, chạy bộ lọc, điều phối lịch phỏng vấn và xuất dữ liệu báo cáo.
- **Ứng viên:** Không có tài khoản đăng nhập nội bộ; sử dụng Cổng tuyển dụng công khai để tìm việc, nộp hồ sơ và tra cứu tình trạng xử lý bằng email/số điện thoại.

### 2.3. Dashboard Tổng quan Động
- 6 thẻ chỉ số KPI tổng hợp: Vị trí đang tuyển, Tổng hồ sơ ứng viên, Chờ nhân sự duyệt, Đạt tiêu chí sàng lọc, Lịch phỏng vấn sắp tới, Đã tuyển.
- Biểu đồ Bar Chart: Số lượng ứng viên theo từng giai đoạn trong pipeline tuyển dụng.
- Biểu đồ Doughnut Chart: Hiệu quả tỷ trọng các nguồn thu hút ứng viên (Website, TopCV, LinkedIn, Giới thiệu nội bộ,...).
- Bảng danh sách lịch phỏng vấn sắp tới và hồ sơ mới cần xử lý kèm nút truy cập nhanh.

### 2.4. Quản lý Yêu cầu Tuyển dụng & Đăng tin Đa kênh
- Quản lý quy trình yêu cầu nhân sự: Mã yêu cầu tự sinh (`YCTD-YYYYMMDD-xxx`), Tên vị trí, Phòng ban, Số lượng, Lý do, JD, Yêu cầu chuyên môn, Kỹ năng bắt buộc, Mức lương, Hạn nộp.
- Theo dõi lịch sử phê duyệt: Chờ phê duyệt, Đã phê duyệt, Từ chối, Đang tuyển, Đã đóng.
- Tạo tin tuyển dụng (`TND-YYYYMMDD-xxx`) từ yêu cầu đã duyệt chỉ bằng 1 thao tác.
- Quản lý nguồn đăng tin tuyển dụng: Website công ty, TopCV, LinkedIn, VietnamWorks (lưu URL, trạng thái đồng bộ, lượt xem và số lượng hồ sơ thu được).
- **Kênh đăng tin thật:** Cổng tuyển dụng SmartATS (Website) — tin đăng và hồ sơ được tạo trực tiếp trong ứng dụng.
- **Kênh mô phỏng:** TopCV, LinkedIn Jobs, VietnamWorks — chỉ minh họa luồng đa kênh, chưa gọi API đối tác và chưa có dữ liệu đồng bộ thật. Giao diện quản lý nguồn ghi rõ nhãn “Mô phỏng”.

### 2.5. Tự động đọc CV & Đối chiếu Tiêu chí Tuyển dụng (CV Parsing & AI Screening)
- **Tiếp nhận hồ sơ:** Nhận đơn trực tuyến từ cổng Portal hoặc HR tải CV lên thủ công.
- **Bộ máy bóc tách thông tin:** Tự động trích xuất Họ tên, Email, Số điện thoại, Học vấn, Số năm kinh nghiệm làm việc, Kỹ năng chuyên môn và Chứng chỉ.
- **Đối chiếu tiêu chuẩn & Tính điểm:**
  - Kỹ năng chuyên môn bắt buộc: 40% trọng số.
  - Số năm kinh nghiệm làm việc: 30% trọng số.
  - Trình độ học vấn & Bằng cấp: 15% trọng số.
  - Chứng chỉ chuyên môn & Ngoại ngữ: 15% trọng số.
- **Phân loại kết quả:** Đạt tiêu chí (`pass`), Cần kiểm tra thủ công (`manual_check`), Không đạt (`fail`).
- **Duyệt tự động bằng AI:** Khi bật tùy chọn trong Cài đặt, hồ sơ được chuyển thẳng sang **Đạt – Chờ phỏng vấn** nếu tổng điểm ≥ ngưỡng Đạt (mặc định 80) **và** không còn tiêu chí bắt buộc nào chưa đáp ứng. Hồ sơ dưới ngưỡng vẫn vào hàng chờ HR; AI **không tự động loại** ứng viên. Mỗi lần duyệt tự động đều ghi vào lịch sử trạng thái với tác nhân “AI Screening”.
- **Minh bạch & Đạo đức tuyển dụng:** Hiển thị rõ danh sách các tiêu chí đạt (xanh lá), chưa đạt (đỏ) và thông tin còn thiếu (vàng). Hệ thống chỉ đóng vai trò trợ lý hỗ trợ quyết định, không tự động loại bỏ ứng viên và không sử dụng các đặc điểm nhạy cảm (tuổi, giới tính, tôn giáo).
- **Công cụ Live Scanner:** Cho phép dán hoặc nạp CV mẫu để chạy kiểm thử trích xuất và tính điểm ngay lập tức.

### 2.6. Danh sách Ứng viên & Quy trình Duyệt Hồ sơ
- Bảng danh sách ứng viên đầy đủ thông tin: STT, Họ tên, Vị trí, Email, SĐT, Nguồn, Ngày nộp, Kết quả sàng lọc, Điểm phù hợp, Trạng thái, Thao tác.
- Tìm kiếm tức thì theo Tên, Email, SĐT; mọi ô tìm kiếm đều có nút **×** xoá nhanh nội dung (tiện trên điện thoại); Bộ lọc theo Vị trí, Nguồn, Trạng thái, Kết quả sàng lọc và Sắp xếp theo ngày/điểm.
- Màn hình Chi tiết Ứng viên đa tab:
  - Tab 1: Tổng quan liên hệ, kinh nghiệm, kỹ năng và xem nội dung tệp CV gốc.
  - Tab 2: Kết quả đối chiếu sàng lọc tự động chi tiết.
  - Tab 3: Lịch phỏng vấn và các phiếu đánh giá của hội đồng.
  - Tab 4: Lịch sử thay đổi trạng thái (Audit Log) và ghi chú nội bộ.
- Bộ 7 trạng thái hồ sơ chuẩn:
  1. Chờ nhân sự duyệt
  2. Đang xem xét
  3. Đạt – Chờ phỏng vấn
  4. Đã lên lịch phỏng vấn
  5. Đã đề xuất tuyển dụng
  6. Đã tuyển
  7. Không đạt / Cần bổ sung thông tin
- Hộp thoại xác nhận trước thao tác quan trọng (Từ chối kèm lý do).

### 2.7. Quản lý Lịch Phỏng vấn (Phong cách Tanca ATS)
- Đa chế độ hiển thị: Dạng danh sách (List view) và Lịch tuần trực quan (Week view) có nút chuyển tuần trước/sau/về tuần hiện tại.
- Quản lý đầy đủ: Mã lịch (`LPV-YYYYMMDD-xxx`), Ứng viên, Vị trí, Vòng phỏng vấn (Vòng 1 - HR Sơ loại, Vòng 2 - Đánh giá Chuyên môn, Vòng 3 - Phỏng vấn Giám đốc), Ngày giờ bắt đầu/kết thúc, Hình thức (Trực tiếp hoặc Online Google Meet), Hội đồng phỏng vấn.
- **Thuật toán kiểm tra trùng lịch (Conflict Detection):** Tự động phát hiện và cảnh báo người phỏng vấn nếu bị trùng lịch trong cùng khung giờ.
- **Mô phỏng gửi Email:** Xem trước nội dung thư mời phỏng vấn tự động điền thông tin chi tiết.
- Đánh dấu hoàn thành và điều hướng nhanh sang phiếu chấm điểm.

### 2.8. Đánh giá Ứng viên & Quyết định Tuyển dụng
- Mẫu phiếu đánh giá chấm điểm đa tiêu chí (Thang điểm 1 - 5 ⭐ kèm nhận xét):
  1. Kiến thức chuyên môn
  2. Kỹ năng liên quan đến công việc
  3. Kinh nghiệm làm việc thực chiến
  4. Giao tiếp & Làm việc nhóm
- Tính điểm tổng hợp quy đổi (thang 100), khuyến nghị (Tiếp tục, Cân nhắc, Dừng lại).
- Cho phép nhiều người phỏng vấn nộp nhiều phiếu đánh giá cho cùng 1 ứng viên qua các vòng.
- Luồng quyết định: Đề xuất tuyển dụng -> Phê duyệt tuyển dụng chính thức -> Chuyển trạng thái "Đã tuyển".

### 2.9. Báo cáo & Thống kê Tuyển dụng Chuyên sâu (5 Phân hệ)
- **Bộ lọc:** Khoảng thời gian (tháng/quý/năm/toàn bộ) và phòng ban; mọi số liệu bên dưới đều tính lại theo bộ lọc.
- **9.1 Tổng quan chỉ số:** Số hồ sơ, đang duyệt, đã phỏng vấn, đề xuất nhận việc, đã tuyển, tỷ lệ tuyển thành công.
- **9.2 Phễu tuyển dụng (Recruitment Funnel):** Đo lường tỷ lệ chuyển đổi (%) và tỷ lệ rơi rụng qua 5 nấc: Tiếp nhận -> Đạt sàng lọc -> Mời PV -> Đề xuất -> Tuyển dụng thành công. Số “Đạt sàng lọc” đếm cả hồ sơ đã đi tiếp, không chỉ hồ sơ đang dừng ở bước này.
- **9.3 Thời gian & Chi phí tuyển dụng:** Thời gian tuyển dụng trung bình (chỉ tính khi đã có hồ sơ chuyển sang “Đã tuyển”; nếu chưa đủ dữ liệu sẽ ghi rõ), tổng chi phí, chi phí trung bình trên 1 nhân sự trúng tuyển (Cost-per-Hire) và chi phí theo từng vị trí. Chi phí hiện là **số liệu ước tính demo**, sẽ thay bằng ngân sách thật khi có backend.
- **9.4 Hiệu quả nguồn tuyển dụng:** So sánh số hồ sơ, tỷ lệ đạt sàng lọc, số lượng phỏng vấn/trúng tuyển, tỷ lệ chuyển đổi và chi phí giữa Website, TopCV, LinkedIn, VietnamWorks và Giới thiệu nội bộ.
- **9.5 Trạng thái & Thời gian đăng tin:** Đếm số ngày tin đã xuất bản, cảnh báo tin sắp hết hạn (25–30 ngày) và tin tồn đọng (>30 ngày) để tối ưu ngân sách.
- Hỗ trợ xuất toàn bộ 5 phân hệ ra file CSV tương thích Microsoft Excel.

### 2.10. Cổng Thông tin Tuyển dụng Ứng viên (Career Portal)
- Giao diện người dùng công khai độc lập, không hiển thị thanh quản trị nội bộ.
- Tìm kiếm việc làm, lọc theo phòng ban, xem mô tả công việc (JD), yêu cầu và phúc lợi.
- Biểu mẫu nộp CV trực tuyến với tính năng tự động nhận diện thông tin cá nhân từ văn bản CV.
- Phân hệ **Tra cứu hồ sơ**: Ứng viên chỉ cần nhập Email hoặc SĐT để theo dõi tiến độ hồ sơ qua sơ đồ Stepper và xem lịch phỏng vấn của mình.

---

## 3. CÔNG NGHỆ SỬ DỤNG & CẤU TRÚC THƯ MỤC

### 3.1. Công nghệ Sử dụng
- **HTML5 & Modern CSS3:** Thiết kế hệ thống Design Tokens (CSS Variables), Layout Flexbox & CSS Grid, Responsive Breakpoints (1440, 1024, 768, 640, 375px).
- **Vanilla JavaScript (ES6+):** Xây dựng theo kiến trúc Single Page Application (SPA) dạng Component Module hóa cao, không phụ thuộc framework cồng kềnh, tải trang tức thì.
- **Hash-based Client-side Router:** Hỗ trợ Dynamic Route Params (`/candidates/:id`, `/portal/job/:id`), Route Guards bảo vệ quyền truy cập.
- **Chart.js 4.4:** Vẽ biểu đồ cột, biểu đồ tròn, biểu đồ phễu chuyển đổi dữ liệu động.
- **Lucide Icons:** Hệ thống hơn 50 biểu tượng giao diện trực quan.
- **Node.js HTTP Server (`server.js`):** Phục vụ giao diện tĩnh và REST API `/api/*`.
- **PostgreSQL 17 trên Supabase (`pg`):** Nơi lưu dữ liệu thật của toàn hệ thống; mỗi collection của `ATSStore` là một bảng có cột `id`, `doc jsonb`, `seq`, `updated_at`.
- **Nodemailer 10:** Gửi thư điện tử tự động tới ứng viên (SMTP thật hoặc hộp thư thử nghiệm Ethereal).
- **Storage & State Management (`ATSStore`):** Giữ một bản sao dữ liệu trong bộ nhớ để giao diện đọc đồng bộ, đồng thời đẩy mọi thay đổi lên PostgreSQL qua `/api/sync` (debounce 250 ms).

### 3.2. Kiến trúc Full-stack

```
Trình duyệt (SPA Vanilla JS)
  ATSStore (bộ nhớ)  ──saveState()──►  POST /api/sync  ──►  PostgreSQL (Supabase)
        ▲                                                        │
        └────────── GET /api/state (khi khởi động) ◄──────────────┘
                                                                 │
                     email_log (pending)  ──►  Nodemailer  ──►  Ứng viên
```

- Giao diện vẫn đọc dữ liệu đồng bộ như trước; việc ghi đi qua API nên không phải chờ mạng.
- Khi HR hẹn / đổi / hủy lịch phỏng vấn, `ATSStore` tạo bản ghi trong `emailLog`; máy chủ nhận bản ghi qua `/api/sync` và gửi thư ngay, sau đó đánh dấu `sent` / `preview` / `failed` trong bảng `email_log`.

### 3.2.1. Lưu trữ: PostgreSQL là nguồn chính, localStorage chỉ là bản đệm

| Thành phần | Vai trò |
| :--- | :--- |
| **PostgreSQL / Supabase** | Nguồn dữ liệu chính thức, bền vững. Đọc bằng `GET /api/state`, ghi bằng `POST /api/sync`. |
| **localStorage** | Bản đệm để giao diện đọc/ghi tức thì (không chờ mạng) và giữ thay đổi chưa gửi được. |
| **`getSyncStatus()`** | Trả về `{ mode: 'server' \| 'local', pending, lastError }` — hiển thị trên thanh tiêu đề. |

Cơ chế chắc chắn:

- Khi tải trang: `GET /api/state` lấy toàn bộ dữ liệu từ database, ghi đè bản đệm.
- Mỗi thao tác ghi: chỉ phần thay đổi được gửi đi (`/api/sync`, debounce 250ms).
- Nếu database/mạng lỗi: thay đổi được lưu vào `smart_ats_sync_pending_v1` (không mất dữ liệu) và **tự thử lại** (mỗi 3 giây cho lần gửi, mỗi 5 giây cho kết nối — tối đa 12 lần).
- Thanh tiêu đề hiển thị **“CSDL đã lưu”** (xanh) khi đã ghi vào PostgreSQL, **“Chưa kết nối CSDL”** (đỏ) khi đang dùng bản đệm; bấm vào để kiểm tra/đồng bộ lại ngay.

Kiểm chứng bằng lệnh:

```bash
npm run test:db    # ghi dữ liệu qua API rồi truy vấn TRỰC TIẾP PostgreSQL
```

### 3.3. Cấu trúc Thư mục

```
ats-system/
├── index.html                   # File HTML chính khởi động ứng dụng
├── server.js                    # Máy chủ HTTP: giao diện tĩnh + REST API + vòng gửi thư
├── package.json                 # Thông tin cấu hình dự án
├── .env / .env.example          # Chuỗi kết nối PostgreSQL và cấu hình SMTP
├── test-suite.js                # Bộ kịch bản kiểm thử tự động 13 luồng nghiệp vụ
├── README.md                    # Tài liệu hướng dẫn sử dụng tiếng Việt
├── scripts/
│   ├── db-check.js              # Kiểm tra kết nối PostgreSQL và liệt kê bảng
│   └── export-seed.js           # Kết xuất dữ liệu mẫu ra src/server/seed.json
├── mail-outbox/                 # Thư .eml khi chạy ở chế độ file (không commit)
└── src/
    ├── app.js                   # Điểm khởi tạo ứng dụng, đăng ký Routes & Auth Guard
    ├── server/
    │   ├── env.js               # Đọc tệp .env không cần thư viện ngoài
    │   ├── db.js                # Pool PostgreSQL, lược đồ, đọc/ghi trạng thái, đăng nhập
    │   ├── schema.sql           # Lược đồ các bảng và chỉ mục
    │   ├── seed.json            # Dữ liệu mẫu nạp lần đầu
    │   ├── mailer.js            # Soạn HTML/thư văn bản và gửi thư cho ứng viên
    │   └── api.js               # Các tuyến /api/health, /api/state, /api/sync, /api/login
    ├── components/
    │   ├── layout.js            # Sidebar điều hướng phân quyền, Header, Notifications
    │   └── ui.js                # Thư viện UI Components (Modal, Toast, Badges, Table)
    ├── data/
    │   └── store.js             # Dữ liệu mẫu, LocalStorage State, CV Parsing Engine
    ├── pages/
    │   ├── login.js             # Màn hình đăng nhập & chọn tài khoản demo
    │   ├── dashboard.js         # Màn hình Tổng quan tuyển dụng
    │   ├── requisitions.js      # Quản lý Yêu cầu tuyển dụng
    │   ├── postings.js          # Quản lý Vị trí & Tin tuyển dụng đa kênh
    │   ├── candidates.js        # Danh sách Ứng viên & Duyệt hồ sơ
    │   ├── screening.js         # Sàng lọc CV & Live Scanner
    │   ├── interviews.js        # Lịch phỏng vấn (Tanca style) & Cảnh báo trùng lịch
    │   ├── evaluations.js       # Phiếu đánh giá chấm điểm & Quyết định tuyển dụng
    │   ├── reports.js           # Báo cáo tuyển dụng chuyên sâu 5 phân hệ
    │   ├── users.js             # Quản lý người dùng, tạo tài khoản & Ma trận phân quyền
    │   ├── settings.js          # Cấu hình trọng số, ngưỡng điểm, duyệt AI & Reset dữ liệu
    │   ├── profile.js           # Hồ sơ cá nhân & cập nhật thông tin liên hệ
    │   ├── notifications.js     # Trung tâm thông báo nội bộ
    │   └── portal.js            # Cổng tuyển dụng ứng viên công khai & Tra cứu hồ sơ
    ├── styles/
    │   ├── design.css           # Design system gốc: token, layout, component, responsive
    │   ├── utilities.css        # Utility classes & breakpoint helpers
    │   └── main.css             # Bổ sung style nghiệp vụ & tương thích component cũ
    └── utils/
        ├── helpers.js           # Hàm tiện ích format tiền tệ, ngày tháng, validate, quyền
        └── router.js            # Client-side Hash Router
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Cách 1: Chạy bản full-stack (gửi thư tự động) — khuyên dùng
Yêu cầu: [Node.js](https://nodejs.org/) 16 trở lên. Cơ sở dữ liệu PostgreSQL (Supabase) là **tùy chọn**: nếu chưa điền `DATABASE_URL`, máy chủ tự dùng backend tệp `data/store.json` để mọi tính năng (kể cả hàng đợi email) vẫn chạy.

1. Cài thư viện:
   ```bash
   cd "d:\Quản lý quy trình\Tuyển dụng nhân sự\ats-system"
   npm install
   ```
2. Tạo tệp `.env` từ `.env.example`:
   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>   # bỏ trống nếu chưa có DB
   DB_SSL=true
   EMAIL_TRANSPORT=ethereal   # auto | smtp | ethereal | file
   SMTP_HOST=                 # để trống nếu dùng ethereal/file
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   MAIL_FROM=hr@smartats.vn
   ```
   > Với Supabase, dùng chuỗi **Session pooler** và `DB_SSL=true`; cổng trực tiếp `5432` thường không truy cập được từ mạng IPv4.
   > Không có `DATABASE_URL` → dữ liệu lưu tại `data/store.json` (tự tạo, đã nằm trong `.gitignore`).
3. Kiểm tra kết nối cơ sở dữ liệu (nếu đã điền):
   ```bash
   npm run db:check
   ```
4. Khởi động máy chủ:
   ```bash
   npm start
   ```
   Lần chạy đầu, máy chủ tự tạo bảng (`src/server/schema.sql`) và nạp dữ liệu mẫu từ `src/server/seed.json`.
5. Mở trình duyệt:
   - **Hệ thống Quản trị ATS:** `http://localhost:3000`
   - **Cổng Tuyển dụng Ứng viên:** `http://localhost:3000/#/portal`
   - **Kiểm tra API:** `http://localhost:3000/api/health`

#### Gửi thư tự động — 3 tình huống phỏng vấn
Hệ thống tự gửi email tới **đúng địa chỉ ứng viên đã đăng ký lúc nộp CV** ở ba thời điểm:

| Tình huống | Loại thư | Nội dung chính |
| :--- | :--- | :--- |
| HR hẹn phỏng vấn (tạo lịch) | `interview_invite` | Giờ – ngày – hình thức – địa điểm/liên kết – hội đồng |
| Đổi giờ/ngày/địa điểm lịch đã thông báo | `interview_reschedule` | Lịch **mới** (giờ, ngày, địa điểm, hội đồng) |
| Hủy lịch đã thông báo | `interview_cancel` | Lịch dự kiến + lý do hủy |

Các thao tác khác (đổi trạng thái hồ sơ, chấm điểm, chốt tuyển dụng) **không** tự gửi thư.
Chống gửi trùng: mỗi lần đổi lịch/hủy chỉ sinh **một** thư; hủy lần hai và hủy lịch chưa từng thông báo thì không gửi.

| Chế độ | Hành vi |
| :--- | :--- |
| `smtp` | Gửi thật qua máy chủ SMTP của doanh nghiệp (Gmail App Password, Brevo, Resend...). Dùng khi triển khai thật. |
| `ethereal` | Gửi thật tới hộp thư thử nghiệm của Nodemailer; mỗi thư có `preview_url` để mở lại đúng nội dung ứng viên sẽ nhận. |
| `auto` | Dùng SMTP nếu có `SMTP_HOST`, ngược lại ghi tệp. |
| `file` | Chỉ ghi tệp `.eml` vào `mail-outbox/` để kiểm tra nội dung. |

Kiểm tra thư đã gửi: `GET http://localhost:3000/api/health` → trường `mail.recent[].previewUrl`.

### Cách 2: Chạy khi chưa cấu hình gì
Chỉ cần `npm install && npm start`. Máy chủ dùng backend tệp `data/store.json`, nạp sẵn dữ liệu mẫu, và gửi thư thật qua Ethereal (nếu có mạng) — không cần PostgreSQL.

### 5.1. Kiểm chứng bộ quét CV bằng CV giả định
Đã kèm sẵn CV mẫu `sample-data/cv-mau-tran-thi-minh-thu.txt`. Chạy:
```bash
npm run test:cv
```
Lệnh này trích xuất họ tên, email, điện thoại, học vấn, số năm kinh nghiệm, kỹ năng, chứng chỉ từ CV rồi đối chiếu với vị trí tuyển dụng mẫu và in điểm sàng lọc.

### 5.2. Kiểm chứng luồng email tự động
```bash
npm start            # cửa sổ 1
npm run test:email   # cửa sổ 2
```
Kiểm tra: duyệt CV không gửi thư · hẹn phỏng vấn gửi đúng 1 thư tới email đã đăng ký, có giờ giấc/địa điểm · đổi lịch gửi thư đổi lịch có giờ mới · hủy lịch gửi thư hủy kèm lý do · chốt tuyển dụng không gửi thêm · máy chủ gửi thật và trả `preview_url`.

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống đi kèm bộ kiểm thử tự động `test-suite.js` kiểm tra toàn bộ 13 luồng nghiệp vụ yêu cầu:
Chạy lệnh:
```bash
node test-suite.js
```
Kết quả thực tế:
- **Luồng 1:** Đăng nhập & Xác minh phân quyền 4 vai trò: `PASSED` (8/8 tests)
- **Luồng 2:** Tạo yêu cầu tuyển dụng mới và sinh mã `YCTD-`: `PASSED` (2/2 tests)
- **Luồng 3:** Phê duyệt yêu cầu & Tạo tin đăng tuyển `TND-`: `PASSED` (3/3 tests)
- **Luồng 4:** Nộp CV từ Cổng ứng viên trực tuyến: `PASSED` (3/3 tests)
- **Luồng 5:** Tự động đọc CV & Trích xuất thông tin: `PASSED` (4/4 tests)
- **Luồng 6:** Đối chiếu tiêu chí & Chấm điểm sàng lọc AI: `PASSED` (3/3 tests)
- **Luồng 7:** Thao tác duyệt hồ sơ & Ghi nhận lịch sử (Audit Log): `PASSED` (2/2 tests)
- **Luồng 8:** Tìm kiếm và lọc đa tiêu chí: `PASSED` (2/2 tests)
- **Luồng 9:** Lên lịch phỏng vấn & Thuật toán phát hiện trùng lịch: `PASSED` (3/3 tests)
- **Luồng 9B:** Email tự động khi hẹn / đổi lịch / hủy lịch phỏng vấn (đúng người nhận, có giờ giấc, không gửi trùng): `PASSED`
- **Luồng 10:** Nhập phiếu đánh giá & Quyết định tuyển dụng: `PASSED` (3/3 tests)
- **Luồng 11:** Thống kê Dashboard & Tính toán báo cáo động: `PASSED` (5/5 tests)
- **Luồng 12:** Kiểm thử các trường hợp dữ liệu lỗi & Validation: `PASSED` (5/5 tests)
- **Luồng 13:** Quản lý tài khoản người dùng & chống trùng tên đăng nhập: `PASSED` (2/2 tests)
- **Tổng kết:** **69/69 Bài kiểm thử Thành công (100% ĐẠT)**.
- **Kiểm chứng bổ sung:** `npm run test:cv` (quét CV giả định), `npm run test:interview-mails` (email hẹn/đổi/hủy lịch) và `npm run test:email` (luồng gửi thư thật) đều đạt.

---

## 6. GIỚI HẠN NỀN TẢNG PROTOTYPE & HƯỚNG MỞ RỘNG PRODUCTION

1. **Lưu trữ dữ liệu:** Mặc định dữ liệu lưu ở `data/store.json` (hoặc PostgreSQL khi điền `DATABASE_URL`). Để dùng thật cho doanh nghiệp nhiều chi nhánh, chỉ cần điền chuỗi kết nối Supabase/PostgreSQL — không phải sửa mã nguồn.
2. **Xác thực bảo mật:** Kiểm tra phiên làm việc hiện tại sử dụng Mock Session. Trong môi trường thực tế, hệ thống sẽ tích hợp JWT (JSON Web Token), OAuth2 hoặc SSO nội bộ (Google Workspace / Microsoft Azure AD).
3. **Dịch vụ Email:** Hệ thống gửi thư thật qua `nodemailer` (SMTP hoặc Ethereal). Hiện gửi 3 loại thư gắn với lịch phỏng vấn: mời phỏng vấn, đổi lịch và hủy lịch (kèm lý do). Muốn gửi tới hộp thư ứng viên thật, điền `SMTP_HOST/SMTP_USER/SMTP_PASS` trong `.env` và đặt `EMAIL_TRANSPORT=smtp`.
4. **Đồng bộ sàn việc làm bên ngoài (đang mô phỏng):** Các nguồn TopCV, LinkedIn, VietnamWorks hiện chỉ có giao diện quản trị nguồn và dữ liệu demo, **không gọi API thật**. Muốn đăng tin tự động thật cần: (1) tài khoản doanh nghiệp/đối tác và API key của từng nền tảng, (2) backend trung gian giữ bí mật key và xử lý webhook/đồng bộ trạng thái, (3) ánh xạ schema tin đăng và hồ sơ ứng viên giữa SmartATS và từng sàn. Khi có các điều kiện trên, module tích hợp đã sẵn sàng để cắm adapter mà không phải đổi luồng nghiệp vụ.

---

## 7. TRIỂN KHAI LÊN VERCEL (có API + database + gửi mail)

Vercel chỉ phục vụ file tĩnh, **không chạy `server.js`**. Vì vậy dự án có thêm thư mục `api/` gồm các Serverless Function tương ứng:

| Endpoint | File | Chức năng |
| :--- | :--- | :--- |
| `GET /api/state` | `api/state.js` | Đọc toàn bộ dữ liệu từ PostgreSQL |
| `POST /api/sync` | `api/sync.js` | Ghi thay đổi + gửi thư đang chờ |
| `GET /api/health` | `api/health.js` | Kiểm tra kết nối DB, hàng đợi email |
| `POST /api/login` | `api/login.js` | Đăng nhập nhân sự |
| `GET /api/emails` | `api/emails.js` | Danh sách thư đã soạn/gửi |
| `POST /api/mail/process` | `api/mail/process.js` | Xử lý lại hàng đợi email |

### Các bước bắt buộc

1. **Khai báo biến môi trường** trong Vercel → Project → Settings → Environment Variables (không commit `.env`):

```
DATABASE_URL        = postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
DB_SSL              = true
EMAIL_TRANSPORT     = smtp
SMTP_HOST           = smtp.gmail.com
SMTP_PORT           = 587
SMTP_SECURE         = false
SMTP_USER           = <gmail-của-bạn>@gmail.com
SMTP_PASS           = <App Password 16 ký tự>
MAIL_FROM           = <gmail-của-bạn>@gmail.com
```

2. **Redeploy** (Deployments → Redeploy, hoặc push commit mới).

3. **Kiểm tra**: mở `https://<tên-miền>/api/health` — phải thấy `ok: true`, `database: "postgres"` và số bản ghi. Nếu thấy `ok: false` + thông báo `DATABASE_URL` nghĩa là chưa khai báo biến môi trường.

4. Mở lại trang web: chỉ báo trên thanh tiêu đề chuyển sang **“CSDL đã lưu”** (xanh) và dữ liệu đọc/ghi trực tiếp từ Supabase.

### Lưu ý riêng cho Vercel

- Function ghi tệp tạm vào `/tmp` (ổ đĩa chỉ-đọc), đã tự cấu hình khi phát hiện `VERCEL`.
- Dùng **Session Pooler** của Supabase; giới hạn pool được hạ xuống 3 kết nối/instance để tránh vượt hạn mức.
- Thư viện đọc PDF/DOCX (`pdfjs-dist`, `mammoth`) được nạp từ `node_modules` khi chạy local và **tự chuyển sang CDN** khi deploy (Vercel không phục vụ `node_modules` tĩnh).
- Kiểm thử nhanh các function ngay trên máy: `npm run test:vercel`

---

## 8. XỬ LÝ NGOẠI LỆ TRONG QUY TRÌNH (BPMN)

Ba cơ chế ngoại lệ đã được cài đặt ở tầng nghiệp vụ (`ATSStore`) và hiển thị trên giao diện.

### 8.1. Ngoại lệ 1 — Nhắc nhở khi quá hạn phê duyệt JD
**Mô hình:** *Non-interrupting Boundary Timer Event* gắn vào hoạt động “Xem xét và phê duyệt JD”.

- Ngưỡng mặc định **480 phút** (8 giờ), cấu hình tại **Cài đặt → Ngưỡng nhắc nhở (phút)**.
- Khi yêu cầu ở trạng thái `pending` quá ngưỡng, hệ thống:
  - gửi **thông báo nhắc nhở cho giám đốc** (Trung tâm thông báo),
  - ghi lịch sử `reminder` kèm số lần nhắc,
  - **không thay đổi trạng thái** yêu cầu → hoạt động phê duyệt không bị gián đoạn.
- Mỗi chu kỳ ngưỡng chỉ nhắc một lần (tránh spam). Bộ quét chạy nền mỗi 60 giây và ngay khi mở trang Yêu cầu tuyển dụng.
- Trên danh sách hiển thị huy hiệu **“Quá hạn duyệt N phút”** + số lần đã nhắc.

### 8.2. Ngoại lệ 2 — Xử lý lỗi đăng tin tuyển dụng
**Mô hình:** *Boundary Error Event* gắn vào Sub-Process “Đăng tin tuyển dụng”.

- Đăng tin đi qua `ATSStore.publishPosting()`; mọi lỗi kỹ thuật/validate được bắt:
  - ghi `publishStatus = 'error'` + `publishError {message, at, by}` trên yêu cầu,
  - thêm lịch sử `publish_error`,
  - **thông báo cho phòng nhân sự** kèm nguyên nhân.
- Yêu cầu vẫn ở trạng thái `approved` → sau khi khắc phục, HR bấm **“Đăng lại”** (`retryPublish`) để chạy lại sub-process; thành công thì xóa lỗi và chuyển `recruiting`.
- Giao diện: huy hiệu **“Lỗi đăng tin”** ở danh sách yêu cầu, banner cảnh báo + nút Đăng lại ở trang **Vị trí & Tin tuyển dụng**.

### 8.3. Ngoại lệ 3 — Hủy yêu cầu tuyển dụng
**Mô hình:** *Event Sub-Process* ngắt quy trình (interrupting), không cần giám đốc phê duyệt.

- Quyền: trưởng phòng **đúng phòng ban** của yêu cầu, hoặc HR/Giám đốc.
- Bắt buộc nhập lý do (≥ 5 ký tự). Khi hủy:
  - trạng thái → **`cancelled` (Đã hủy)**, lưu `cancelledBy`, `cancelledAt`, `cancelReason`,
  - **ngắt ngay** các bước đang chạy: đóng tin tuyển dụng đang mở, hủy lịch phỏng vấn đang chờ,
  - ghi lịch sử `cancelled` và **thông báo cho HR + giám đốc**.
- Các hành động sau đó bị chặn: không thể phê duyệt/từ chối/hủy lại yêu cầu đã hủy.
- Giao diện: nút **Hủy yêu cầu** (biểu tượng cấm) ở danh sách và trong chi tiết; bộ lọc trạng thái có **“Đã hủy”**.

### 8.4. Kiểm thử
```bash
npm run test:exceptions
```

---

## 9. PHÂN QUYỀN & BẢO MẬT ĐIỀU HƯỚNG

### 9.1. Auth Guard (bắt buộc đăng nhập)
Mỗi lần chuyển trang, `Helpers.resolveRouteAccess(path, user)` quyết định trước khi render:

| Tình huống | Hành vi |
| :--- | :--- |
| **Chưa đăng nhập** vào trang quản trị (kể cả dán link `#/interviews`) | Chặn, hiện thông báo, chuyển về **`#/portal`** |
| Chưa đăng nhập vào `#/portal`, `#/login` | Cho phép |
| **Đã đăng nhập** vào `#/login` | Chuyển về `#/dashboard` (ứng viên → `#/portal`) |
| Vai trò **không có quyền** với trang | Chặn, chuyển `#/dashboard` |
| **Ứng viên** | Chỉ `#/portal` |
| **Đã đăng nhập** | Vào khu vực quản trị theo đúng ma trận quyền |

Đăng xuất sẽ: xoá người dùng hiện tại, **token phiên**, mốc phiên và **bản đệm dữ liệu** trong localStorage, sau đó về `#/portal`.

> Lỗi cũ đã sửa: khi không có phiên, `loadState()` tự gán tài khoản `hr1` khiến đăng xuất xong dán link vẫn vào được. Nay **không bao giờ tự đăng nhập**.

### 9.2. Phiên đăng nhập
- Thời hạn **12 giờ** (`SESSION_TTL_MS`); hết hạn coi như chưa đăng nhập.
- Đăng nhập đi qua **`POST /api/login`** (kiểm tra trong PostgreSQL), trả **token HMAC-SHA256**; dự phòng kiểm tra cục bộ khi máy chủ không phản hồi.
- Token được gửi kèm header `Authorization: Bearer …` cho `/api/state`, `/api/sync`, `/api/emails`, `/api/mail/process`.

### 9.3. Bật cưỡng chế token ở máy chủ (khuyến nghị cho production)
Mặc định API vẫn mở để tương thích. Khi triển khai thật, thêm biến môi trường:

```
AUTH_REQUIRED = true
AUTH_SECRET   = <chuỗi bí mật dài, ngẫu nhiên>
```

Khi đó mọi request thiếu/sai/hết hạn token đều bị trả **401**, kể cả gọi trực tiếp bằng Postman/curl.

### 9.4. Kiểm thử
```bash
npm run test:auth
```
