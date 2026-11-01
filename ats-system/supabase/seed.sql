-- ============================================================================
-- SmartATS - Supabase Seed Data (dữ liệu mẫu)
-- Chạy sau schema.sql trong SQL Editor của Supabase.
-- ============================================================================

-- 1. Departments
insert into public.departments (id, name, description) values
  ('d1', 'Công nghệ thông tin', 'Phát triển phần mềm, DevOps, IT infra'),
  ('d2', 'Kinh doanh & Phát triển', 'Bán hàng B2B,Care, 확장 thị trường'),
  ('d3', 'Marketing & Truyền thông', 'Brand, content, truyền thông'),
  ('d4', 'Tài chính - Kế toán', 'Kế toán, thuế, báo cáo tài chính'),
  ('d5', 'Phòng Nhân sự', 'Tuyển dụng, đào tạo, lương thưởng'),
  ('d6', 'Vận hành & Dịch vụ Khách hàng', 'CSKH, vận hành trực tuyến')
on conflict (id) do nothing;

-- 2. Users (mật khẩu đã hash đơn giản; trong thực tế hãy dùng bcrypt/argon2)
insert into public.users (id, username, password_hash, full_name, email, phone, role, department, title, status, avatar) values
  ('u1','director','$2b$10$placeholder','Trần Đình Long','director@smartats.vn','0903123456','director','Ban Giám Đốc','Tổng Giám Đốc','active','TDL'),
  ('u2','hr1','$2b$10$placeholder','Nguyễn Thu Hà','ha.nguyen@smartats.vn','0912345678','hr','Phòng Nhân sự','Trưởng nhóm Tuyển dụng','active','NTH'),
  ('u3','head_it','$2b$10$placeholder','Lê Văn Hùng','hung.le@smartats.vn','0987654321','department_head','Công nghệ thông tin','Giám đốc Công nghệ (CTO)','active','LVH'),
  ('u4','head_sales','$2b$10$placeholder','Phạm Thị Mai','mai.pham@smartats.vn','0934567890','department_head','Kinh doanh & Phát triển','Trưởng phòng Kinh doanh Toàn quốc','active','PTM'),
  ('u5','candidate','$2b$10$placeholder','Vũ Hoàng Nam','nam.vu@gmail.com','0978123456','candidate','Ứng viên','Kỹ sư Phần mềm','active','VHN')
on conflict (id) do nothing;

-- 3. Requisitions
insert into public.requisitions (id, code, title, department_id, department, quantity, reason, description, requirements, skills, education, min_experience, salary, work_type, location, start_date, deadline, creator_id, creator_name, status, created_at, updated_at) values
  ('r1','YCTD-2026-001','Senior Frontend Developer (React / TypeScript)','d1','Công nghệ thông tin',2,'Mở rộng dự án phát triển hệ thống ERP thế hệ mới cho doanh nghiệp','Chịu trách nhiệm thiết kế kiến trúc UI/UX phía client, xây dựng các module phức tạp sử dụng React 18, Next.js và TypeScript. Phối hợp chặt chẽ với đội Backend và UI Designer.','- Tối thiểu 3 năm kinh nghiệm lập trình React.js, TypeScript.
- Thành thạo Redux Toolkit / Zustand, Tailwind CSS.
- Có hiểu biết về CI/CD, hiệu năng web và responsive design.
- Tốt nghiệp Đại học chuyên ngành CNTT hoặc liên quan.','{React,TypeScript,JavaScript,Tailwind CSS,Redux,Next.js}','Đại học',3,'28.000.000 - 40.000.000 VNĐ','Toàn thời gian','Hà Nội (Hybrid)','2026-10-01','2026-11-20','u1','Lê Văn Hùng','recruiting','2026-10-02T08:30:00Z','2026-10-04T09:00:00Z'),
  ('r2','YCTD-2026-002','Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)','d2','Kinh doanh & Phát triển',3,'Đẩy mạnh doanh số quý 4 và khai thác thị trường khách hàng khối sản xuất','Tìm kiếm, tiếp cận và đàm phán hợp đồng cung cấp giải pháp chuyển đổi số cho các doanh nghiệp vừa và lớn. Tham gia hội thảo, triển lãm ngành.','- Tối thiểu 2 năm kinh nghiệm kinh doanh B2B ngành phần mềm, dịch vụ CNTT.
- Kỹ năng đàm phán, thuyết trình tốt.
- Tốt nghiệp Đại học khối Kinh tế, QTKD hoặc Ngoại thương.
- Tiếng Anh giao tiếp tốt là lợi thế.','{B2B Sales,Đàm phán,Kỹ năng thuyết trình,CRM,Quản lý khách hàng}','Đại học',2,'15.000.000 - 25.000.000 VNĐ + Hoa hồng','Toàn thời gian','TP. Hồ Chí Minh','2026-10-05','2026-11-30','u1','Phạm Thị Mai','recruiting','2026-10-05T09:00:00Z','2026-10-07T08:30:00Z')
on conflict (id) do nothing;

-- Requisition approval history
insert into public.requisition_approval_history (id, requisition_id, status, by_user, note, created_at) values
  ('ah1','r1','pending','Lê Văn Hùng','Gửi yêu cầu tuyển dụng mới','2026-10-02T08:30:00Z'),
  ('ah2','r1','approved','Trần Đình Long','Phê duyệt ngân sách tuyển dụng','2026-10-03T10:15:00Z'),
  ('ah3','r1','recruiting','Nguyễn Thu Hà','Đã xuất bản tin tuyển dụng','2026-10-04T09:00:00Z')
on conflict (id) do nothing;

-- 4. Postings
insert into public.postings (id, code, requisition_id, title, department, salary, location, work_type, deadline, status, published_at, views, applicants_count, description, requirements, benefits, created_at, updated_at) values
  ('p1','TND-2026-001','r1','Tuyển dụng Senior Frontend Developer (React / TypeScript) - Lương lên tới 40M','Công nghệ thông tin','28 - 40 triệu VNĐ','Hà Nội (Hybrid: 2 ngày WFH)','Toàn thời gian','2026-11-20','published','2026-10-04T09:00:00Z',524,6,'Tham gia xây dựng nền tảng cốt lõi với hàng trăm nghìn người dùng doanh nghiệp. Môi trường công nghệ hiện đại, trang thiết bị Macbook Pro M-series, review lương 2 lần/năm.','- Tối thiểu 3 năm kinh nghiệm thực chiến với React.js & TypeScript
- Làm chủ State Management (Redux Toolkit, Zustand)
- Hiểu sâu về tối ưu hoá hiệu năng Web Vitals
- Kỹ năng làm việc nhóm, viết code sạch (Clean Code), Unit Test','- Thưởng tháng 13 + thưởng hiệu quả kinh doanh dự án (2-4 tháng lương)
- Bảo hiểm sức khỏe PVI cao cấp dành riêng cho CBNV
- Nghỉ phép 14 ngày/năm, du lịch nghỉ dưỡng chuẩn 5 sao hàng năm
- Được tài trợ 100% chi phí thi các chứng chỉ công nghệ','2026-10-04T09:00:00Z','2026-10-04T09:00:00Z')
on conflict (id) do nothing;

-- 5. Candidates
insert into public.candidates (id, full_name, email, phone, gender, dob, address, education, experience_years, skills, certifications, current_company, current_title, raw_resume_text, created_at, updated_at) values
  ('c1','Vũ Hoàng Nam','nam.vu@gmail.com','0978123456','Nam','1996-05-14','Cầu Giấy, Hà Nội','Đại học Bách Khoa Hà Nội - Kỹ thuật Phần mềm (Khá)',4.5,'{React,TypeScript,JavaScript,Tailwind CSS,Redux,Next.js,Node.js,Git,HTML/CSS}','{AWS Certified Cloud Practitioner,IELTS 6.5}','FPT Software','Senior Frontend Developer','HỌ VÀ TÊN: VŨ HOÀNG NAM
Email: nam.vu@gmail.com - SĐT: 0978123456 - Địa chỉ: Cầu Giấy, Hà Nội
HỌC VẤN:
- Cử nhân Kỹ sư Kỹ thuật Phần mềm - Đại học Bách Khoa Hà Nội (2014 - 2019)
KINH NGHIỆM LÀM VIỆC:
- 2021 - Nay: Senior Frontend Developer tại FPT Software (3.5 năm)
  + Phát triển kiến trúc webapp SaaS trên nền tảng React 18, TypeScript, Tailwind CSS.
  + Tối ưu Core Web Vitals, giảm bundle size 35%, cải thiện LCP từ 3.2s xuống 1.4s.
  + Áp dụng Zustand và React Query để đồng bộ cache dữ liệu phía client.
- 2019 - 2021: Frontend Developer tại VNG Corporation (2 năm)
  + Xây dựng giao diện tính năng thanh toán với JavaScript, ReactJS, Redux.
KỸ NĂNG CHUYÊN MÔN:
- React, TypeScript, Next.js, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Redux Toolkit, RESTful API, Git, CI/CD cơ bản.
CHỨNG CHỈ:
- AWS Certified Cloud Practitioner (2023)
- IELTS 6.5','2026-10-01T00:00:00Z','2026-10-01T00:00:00Z'),
  ('c2','Trần Minh Anh','minhanh.tran@outlook.com','0912456789','Nữ','1998-08-22','Đống Đa, Hà Nội','Đại học Công nghệ - ĐHQGHN - Công nghệ thông tin (Giỏi)',3,'{React,JavaScript,HTML/CSS,Vue.js,Git,Bootstrap}','{TOEIC 780}','VCCorp','Frontend Developer','TRẦN MINH ANH
Email: minhanh.tran@outlook.com | SĐT: 0912456789 | Đống Đa, Hà Nội
HỌC VẤN:
- Đại học Công nghệ - ĐHQGHN (2016 - 2020) - Tốt nghiệp loại Giỏi
KINH NGHIỆM:
- 2021 - Hiện tại: Frontend Developer tại VCCorp (3 năm kinh nghiệm)
  + Phát triển các portal nội bộ với ReactJS, Vue.js, JavaScript, HTML5/CSS3.
  + Làm việc với RESTful API, Git version control.
KỸ NĂNG:
- React, JavaScript, Vue.js, HTML/CSS, Git, Responsive Web Design.','2026-10-01T00:00:00Z','2026-10-01T00:00:00Z')
on conflict (id) do nothing;

-- 6. Applications
insert into public.applications (id, candidate_id, candidate_name, requisition_id, posting_id, position_title, source, applied_date, status, assigned_to, assignee_name, screening_score, screening_result, screening_details, status_history, internal_notes, decision_email_id, invite_email_id, created_at, updated_at) values
  ('a1','c1','Vũ Hoàng Nam','r1','p1','Senior Frontend Developer (React / TypeScript)','website','2026-10-06T10:15:00Z','interview_scheduled','u2','Nguyễn Thu Hà',92,'pass','{"score":92,"classification":"pass","summary":"Hồ sơ xuất sắc, đáp ứng toàn diện cả kỹ năng bắt buộc và số năm kinh nghiệm.","metCriteria":["Kỹ năng bắt buộc: React, TypeScript, JavaScript, Tailwind CSS (Đạt 100%)","Kinh nghiệm: 4.5 năm (Yêu cầu tối thiểu 3 năm - Vượt yêu cầu)","Học vấn: Đại học Bách Khoa Hà Nội (Đạt yêu cầu bằng cấp)","Kỹ năng ưu tiên: Redux Toolkit, Next.js, Git (Đạt)"],"unmetCriteria":[],"missingInfo":[],"extractedData":{"name":"Vũ Hoàng Nam","email":"nam.vu@gmail.com","phone":"0978123456","experienceYears":4.5,"education":"Đại học Bách Khoa Hà Nội","skillsCount":9},"processedAt":"2026-10-06T10:16:00Z","autoApproved":true,"autoApproveThreshold":80}','[{"status":"pending_review","changedBy":"Hệ thống ATS","timestamp":"2026-10-06T10:15:00Z","note":"Ứng viên nộp hồ sơ từ Cổng tuyển dụng website"},{"status":"passed_screening","changedBy":"Nguyễn Thu Hà","timestamp":"2026-10-07T09:30:00Z","note":"AI sàng lọc 92đ - Duyệt hồ sơ vào vòng phỏng vấn"},{"status":"interview_scheduled","changedBy":"Nguyễn Thu Hà","timestamp":"2026-10-08T14:00:00Z","note":"Đã lên lịch phỏng vấn Vòng 2 chuyên môn"}]','[{"author":"Nguyễn Thu Hà","timestamp":"2026-10-07T09:35:00Z","content":"Ứng viên có profile rất tốt, đã phỏng vấn sơ loại qua điện thoại: thái độ cầu tiến, tiếng Anh khá."}]',null,null,'2026-10-06T10:15:00Z','2026-10-08T14:00:00Z')
on conflict (id) do nothing;

-- 7. Interviews
insert into public.interviews (id, code, candidate_id, candidate_name, requisition_id, position_title, round, date, start_time, end_time, type, location, interviewers, status, notes, invite_email_id, reschedule_email_id, cancel_email_id, cancel_reason, created_at, updated_at) values
  ('iv1','LPV-2026-001','c1','Vũ Hoàng Nam','r1','Senior Frontend Developer (React / TypeScript)','Vòng 2 - Đánh giá Chuyên môn','2026-11-03','09:30','11:00','online','https://meet.google.com/ats-react-tech','{Lê Văn Hùng,Nguyễn Thu Hà}','confirmed','Trọng tâm phỏng vấn: Kiến trúc state management, performance profiling và live-coding React hook tùy chỉnh.',null,null,null,null,'2026-10-08T14:00:00Z','2026-10-08T14:00:00Z')
on conflict (id) do nothing;

-- 8. Evaluations
insert into public.evaluations (id, interview_id, candidate_id, candidate_name, requisition_id, round, evaluator_name, evaluator_role, scores, criteria_comments, overall_score, recommendation, final_decision, comment, result_email_id, created_at) values
  ('eval1','iv1','c1','Vũ Hoàng Nam','r1','Vòng 2 - Đánh giá Chuyên môn','Lê Văn Hùng','Giám đốc Công nghệ','{"professionalKnowledge":5,"workSkills":4.5,"experience":4,"teamworkCommunication":5}','{"professionalKnowledge":"Nắm rất rõ chu kỳ bán hàng B2B, hiểu cách tính ROI giải pháp cho khách hàng.","workSkills":"Kỹ năng thuyết trình trực quan, xử lý từ chối chuyên nghiệp.","experience":"Đã có 5 năm làm việc thực tế và thành tích doanh số xuất sắc tại MISA.","teamworkCommunication":"Giao tiếp lịch thiệp, giọng nói truyền cảm hứng."}',92,'continue','Đề xuất tuyển dụng','Ứng viên nắm rất vững cấu trúc Node.js và tư duy kiến trúc tốt. Đề xuất tuyển dụng.',null,'2026-10-16T15:00:00Z')
on conflict (id) do nothing;

-- 9. Notifications
insert into public.notifications (id, title, message, date, read, icon, link, created_at) values
  ('n1','Hồ sơ mới cần xử lý','Ứng viên Phạm Đức Trung vừa ứng tuyển vị trí DevOps / Cloud Engineer qua LinkedIn.','2026-10-13T10:30:00Z',false,'user-plus','#/candidates/c6','2026-10-13T10:30:00Z'),
  ('n2','Đề xuất tuyển dụng mới','Trưởng phòng Phạm Thị Mai vừa gửi đề xuất tuyển dụng cho ứng viên Đoàn Quang Huy.','2026-10-16T15:30:00Z',false,'check-square','#/evaluations','2026-10-16T15:30:00Z')
on conflict (id) do nothing;

-- 10. Settings
insert into public.settings (id, screening_weights, score_thresholds, auto_approve_enabled, company_name, company_email, company_address, hotline, integrations, created_at, updated_at) values
  (1,'{"skills":40,"experience":30,"education":15,"certifications":15}','{"pass":80,"manual_check":60}',true,'SmartATS Solutions Việt Nam','hr@smartats.vn','Tòa nhà Landmark, Cầu Giấy, Hà Nội','1900 xxxx','{"websitePortal":{"active":true,"name":"Cổng tuyển dụng Doanh nghiệp"},"topcv":{"active":true,"name":"TopCV Open API (Mô phỏng)"},"linkedin":{"active":true,"name":"LinkedIn Jobs Integration (Mô phỏng)"},"vietnamworks":{"active":false,"name":"VietnamWorks API"},"googleMeet":{"active":true,"name":"Google Meet Auto Link"},"smtpEmail":{"active":true,"name":"Hệ thống gửi Email tự động"}}','2026-10-01T00:00:00Z','2026-10-01T00:00:00Z')
on conflict (id) do nothing;

-- ============================================================================
-- Kết thúc seed.sql
-- ============================================================================
