# SMARTATS - HỆ THỐNG QUẢN LÝ TUYỂN DỤNG THÔNG MINH (APPLICANT TRACKING SYSTEM)

SmartATS là giải pháp phần mềm quản lý tuyển dụng toàn diện (SaaS Applicant Tracking System) được thiết kế hiện đại, chuyên nghiệp, tối ưu trải nghiệm người dùng và tự động hóa quy trình tuyển dụng từ đầu đến cuối: từ tạo nhu cầu nhân sự, đăng tin đa kênh, tiếp nhận hồ sơ, trích xuất đọc CV tự động, sàng lọc ứng viên, lên lịch phỏng vấn, chấm điểm hội đồng đến báo cáo phân tích chuyên sâu.

---

## 1. DANH SÁCH TÀI KHOẢN TRẢI NGHIỆM DEMO

Hệ thống đã chuẩn bị sẵn 4 vai trò với dữ liệu thực tế:

| Vai trò | Tên đăng nhập | Mật khẩu | Họ và tên | Chức danh / Phòng ban | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giám đốc** | `director` | `123456` | Trần Đình Long | Tổng Giám Đốc | Xem toàn bộ Dashboard, Báo cáo; Phê duyệt/Từ chối yêu cầu tuyển dụng; Phê duyệt quyết định tuyển dụng cuối cùng |
| **Trưởng phòng** | `head_it` | `123456` | Lê Văn Hùng | Giám đốc Công nghệ (CTO) | Xem & tạo yêu cầu tuyển dụng phòng CNTT; Theo dõi & chấm điểm phỏng vấn ứng viên phòng mình |
| **Trưởng phòng** | `head_sales` | `123456` | Phạm Thị Mai | Trưởng phòng Kinh doanh | Tạo yêu cầu vị trí B2B Sales; Phỏng vấn chuyên môn và đề xuất tuyển dụng |
| **Nhân sự (HR)** | `hr1` | `123456` | Nguyễn Thu Hà | Senior Talent Acquisition | Toàn quyền nghiệp vụ tuyển dụng: Đăng tin, thiết lập tiêu chí, duyệt CV, xếp lịch phỏng vấn, cấu hình cài đặt |
| **Ứng viên** | `candidate` | `123456` | Vũ Hoàng Nam | Ứng viên IT | Truy cập Cổng tuyển dụng công khai, nộp hồ sơ, tra cứu tiến độ ứng tuyển |

> *Gợi ý:* Tại màn hình Đăng nhập `#/login`, bạn có thể bấm vào mục **"Tài khoản demo"** để tự động điền nhanh tài khoản và mật khẩu chỉ bằng 1 cú nhấp chuột.

---

## 2. TỔNG QUAN CÁC CHỨC NĂNG HỆ THỐNG

### 2.1. Thiết kế Giao diện Tổng thể & Responsive
- Thiết kế SaaS Dashboard chuẩn phong cách quốc tế với bảng màu nhận diện: Xanh dương chủ đạo (`#1e40af`, `#3b82f6`), Xanh lá cho trạng thái Đạt (`#16a34a`), Vàng cam cho trạng thái Đang xử lý (`#d97706`), Đỏ cho trạng thái Từ chối (`#dc2626`).
- Font chữ tiếng Việt hiện đại Inter, bố cục Sidebar có thể thu gọn, Header điều hướng thông minh với chuông thông báo và menu hồ sơ.
- Đáp ứng tốt mọi kích thước màn hình: Desktop (1440px), Laptop/Tablet (1024px, 768px) và Mobile (640px, 375px) với Drawer menu và table cuộn mượt mà.

### 2.2. Phân quyền Người dùng theo 4 Vai trò (RBAC)
- **Giám đốc:** Quyền giám sát chiến lược, chỉ xem số liệu tổng quan toàn công ty, phê duyệt yêu cầu và quyết định tuyển dụng; không can thiệp sửa đổi dữ liệu nghiệp vụ tác nghiệp.
- **Trưởng phòng:** Quyền hạn giới hạn theo phạm vi phòng ban mình quản lý, tạo yêu cầu tuyển dụng, tham gia phỏng vấn chuyên môn và gửi đánh giá.
- **Nhân viên Nhân sự (HR):** Đầy đủ quyền tác nghiệp tuyển dụng đa kênh, cấu hình trọng số, chạy bộ lọc, điều phối lịch phỏng vấn và xuất dữ liệu báo cáo.
- **Ứng viên:** Không hiển thị thanh Sidebar nội bộ; sử dụng Cổng tuyển dụng trực tuyến riêng biệt để tìm việc, nộp hồ sơ và tra cứu tình trạng xử lý.

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

### 2.5. Tự động đọc CV & Đối chiếu Tiêu chí Tuyển dụng (CV Parsing & AI Screening)
- **Tiếp nhận hồ sơ:** Nhận đơn trực tuyến từ cổng Portal hoặc HR tải CV lên thủ công.
- **Bộ máy bóc tách thông tin:** Tự động trích xuất Họ tên, Email, Số điện thoại, Học vấn, Số năm kinh nghiệm làm việc, Kỹ năng chuyên môn và Chứng chỉ.
- **Đối chiếu tiêu chuẩn & Tính điểm:**
  - Kỹ năng chuyên môn bắt buộc: 40% trọng số.
  - Số năm kinh nghiệm làm việc: 30% trọng số.
  - Trình độ học vấn & Bằng cấp: 15% trọng số.
  - Chứng chỉ chuyên môn & Ngoại ngữ: 15% trọng số.
- **Phân loại kết quả:** Đạt tiêu chí (`pass`), Cần kiểm tra thủ công (`manual_check`), Không đạt (`fail`).
- **Minh bạch & Đạo đức tuyển dụng:** Hiển thị rõ danh sách các tiêu chí đạt (xanh lá), chưa đạt (đỏ) và thông tin còn thiếu (vàng). Hệ thống chỉ đóng vai trò trợ lý hỗ trợ quyết định, không tự động loại bỏ ứng viên và không sử dụng các đặc điểm nhạy cảm (tuổi, giới tính, tôn giáo).
- **Công cụ Live Scanner:** Cho phép dán hoặc nạp CV mẫu để chạy kiểm thử trích xuất và tính điểm ngay lập tức.

### 2.6. Danh sách Ứng viên & Quy trình Duyệt Hồ sơ
- Bảng danh sách ứng viên đầy đủ thông tin: STT, Họ tên, Vị trí, Email, SĐT, Nguồn, Ngày nộp, Kết quả sàng lọc, Điểm phù hợp, Trạng thái, Thao tác.
- Tìm kiếm tức thì theo Tên, Email, SĐT; Bộ lọc theo Vị trí, Nguồn, Trạng thái, Kết quả sàng lọc và Sắp xếp theo ngày/điểm.
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
- Đa chế độ hiển thị: Dạng danh sách (List view) và Lịch trực quan theo tháng (Month Calendar).
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
- **9.1 Tổng quan chỉ số:** Số hồ sơ, đang duyệt, đã phỏng vấn, đề xuất nhận việc, đã tuyển, tỷ lệ lấp đầy vị trí.
- **9.2 Phễu tuyển dụng (Recruitment Funnel):** Đo lường tỷ lệ chuyển đổi (%) và tỷ lệ rơi rụng qua 5 nấc: Tiếp nhận -> Đạt sàng lọc -> Mời PV -> Đề xuất -> Tuyển dụng thành công.
- **9.3 Thời gian & Chi phí tuyển dụng:** Thời gian tuyển dụng trung bình (Time-to-Hire = 24 ngày), tổng chi phí, chi phí trung bình trên 1 nhân sự trúng tuyển (Cost-per-Hire) và chi phí theo từng vị trí.
- **9.4 Hiệu quả nguồn tuyển dụng:** So sánh số hồ sơ, tỷ lệ đạt, số lượng trúng tuyển và chi phí đầu tư giữa Website, TopCV, LinkedIn, VietnamWorks và Giới thiệu nội bộ.
- **9.5 Trạng thái & Thời gian đăng tin:** Đếm số ngày tin đã xuất bản, tự động cảnh báo các tin đăng kéo dài (>30 ngày) chưa tuyển đủ chỉ tiêu để tối ưu ngân sách.
- Hỗ trợ xuất dữ liệu ra file CSV tương thích Microsoft Excel.

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
- **Storage & State Management (`ATSStore`):** Lưu trữ Single Source of Truth trên `localStorage`, tự động seed dữ liệu mẫu ban đầu và hỗ trợ khôi phục cài đặt gốc.

### 3.2. Cấu trúc Thư mục

```
ats-system/
├── index.html                   # File HTML chính khởi động ứng dụng
├── server.js                    # Web server Node.js (thuần, zero-dependency)
├── package.json                 # Thông tin cấu hình dự án
├── test-suite.js                # Bộ kịch bản kiểm thử tự động 12 luồng nghiệp vụ
├── README.md                    # Tài liệu hướng dẫn sử dụng tiếng Việt
└── src/
    ├── app.js                   # Điểm khởi tạo ứng dụng, đăng ký Routes & Auth Guard
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
    │   ├── users.js             # Quản lý người dùng & Ma trận phân quyền
    │   ├── settings.js          # Cấu hình trọng số, ngưỡng điểm & Reset dữ liệu
    │   └── portal.js            # Cổng tuyển dụng ứng viên công khai & Tra cứu hồ sơ
    ├── styles/
    │   └── main.css             # Hệ thống Style SaaS Dashboard & Responsive hoàn chỉnh
    └── utils/
        ├── helpers.js           # Hàm tiện ích format tiền tệ, ngày tháng, validate, quyền
        └── router.js            # Client-side Hash Router
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Cách 1: Chạy bằng máy chủ Node.js (Khuyên dùng)
Yêu cầu: Máy tính đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 16 trở lên).
1. Mở terminal tại thư mục dự án `ats-system`:
   ```bash
   cd "d:\Quản lý quy trình\Tuyển dụng nhân sự\ats-system"
   ```
2. Khởi động máy chủ:
   ```bash
   npm start
   # Hoặc: node server.js
   ```
3. Mở trình duyệt web và truy cập địa chỉ:
   - **Hệ thống Quản trị ATS:** `http://localhost:3000`
   - **Cổng Tuyển dụng Ứng viên:** `http://localhost:3000/#/portal`

### Cách 2: Mở trực tiếp bằng trình duyệt (Không cần cài đặt)
Do hệ thống được phát triển theo kiến trúc Client-side độc lập hoàn chỉnh, bạn có thể nhấp đúp trực tiếp vào tệp `index.html` trong thư mục `ats-system` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari) để trải nghiệm toàn bộ tính năng.

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống đi kèm bộ kiểm thử tự động `test-suite.js` kiểm tra toàn bộ 12 luồng nghiệp vụ yêu cầu:
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
- **Luồng 10:** Nhập phiếu đánh giá & Quyết định tuyển dụng: `PASSED` (3/3 tests)
- **Luồng 11:** Thống kê Dashboard & Tính toán báo cáo động: `PASSED` (5/5 tests)
- **Luồng 12:** Kiểm thử các trường hợp dữ liệu lỗi & Validation: `PASSED` (5/5 tests)
- **Tổng kết:** **43/43 Bài kiểm thử Thành công (100% ĐẠT)**.

---

## 6. GIỚI HẠN NỀN TẢNG PROTOTYPE & HƯỚNG MỞ RỘNG PRODUCTION

1. **Lưu trữ dữ liệu:** Phiên bản hiện tại sử dụng `localStorage` trên trình duyệt để lưu giữ dữ liệu mượt mà giữa các lần tải lại trang mà không cần cài đặt cơ sở dữ liệu phức tạp. Để đưa vào sử dụng thực tế cho doanh nghiệp nhiều chi nhánh, cần kết nối với Backend API (Node.js/NestJS/Spring Boot) và Cơ sở dữ liệu tập trung (PostgreSQL/MySQL).
2. **Xác thực bảo mật:** Kiểm tra phiên làm việc hiện tại sử dụng Mock Session. Trong môi trường thực tế, hệ thống sẽ tích hợp JWT (JSON Web Token), OAuth2 hoặc SSO nội bộ (Google Workspace / Microsoft Azure AD).
3. **Dịch vụ Email & Lịch ngoại vi:** Tính năng thông báo email và lịch họp Google Meet hiện hiển thị bản xem trước mẫu thư thông báo. Khi triển khai chính thức, chỉ cần cấu hình thông số máy chủ SMTP hoặc kết nối Google Calendar API tại trang Cài đặt.
4. **Đồng bộ sàn việc làm bên ngoài:** Các nguồn TopCV, LinkedIn, VietnamWorks được xây dựng sẵn giao diện quản trị nguồn và cơ chế đón nhận dữ liệu mô phỏng. Khi doanh nghiệp ký hợp đồng tài khoản doanh nghiệp với các nền tảng trên, có thể cắm trực tiếp API Key vào module tích hợp để đồng bộ tự động.
