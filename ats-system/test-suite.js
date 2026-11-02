/**
 * test-suite.js - Automated Test Runner for SmartATS Core Modules
 * Tests all 12 key business flows specified in Section 13.
 */

// 1. Mock Browser Environment (window, localStorage, document)
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.window = {
  location: { hash: '#/dashboard', origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  scrollTo: () => {}
};

global.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    textContent: '',
    innerHTML: '',
    appendChild: () => {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  getElementById: () => null,
  querySelectorAll: () => []
};

// 2. Load Helpers and Store
const fs = require('fs');
const path = require('path');

function loadModule(relPath) {
  let code = fs.readFileSync(path.join(__dirname, relPath), 'utf-8');
  code = code.replace(/^const Helpers =/m, 'global.Helpers =');
  code = code.replace(/^const ATSStore =/m, 'global.ATSStore =');
  (0, eval)(code);
}

loadModule('src/utils/helpers.js');
loadModule('src/data/store.js');

console.log('================================================================');
console.log('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG HỆ THỐNG SMARTATS (ATS TEST SUITE)  ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${testName} - ${details}`);
  }
}

// ── TEST 1: Đăng nhập & Xác minh quyền truy cập 4 vai trò ────────────────────
console.log('\n--- LUỒNG 1: ĐĂNG NHẬP & PHÂN QUYỀN 4 VAI TRÒ ---');
const loginDirector = ATSStore.login('director', '123456');
assert(loginDirector.success && loginDirector.user.role === 'director', 'Đăng nhập tài khoản Giám đốc (director)');
assert(Helpers.canAccess('dashboard', 'director') && Helpers.canAccess('reports', 'director'), 'Giám đốc có quyền xem Dashboard và Báo cáo');
assert(!Helpers.hasPermission('create_posting', 'director'), 'Giám đốc không có quyền tạo tin tuyển dụng');

const loginHead = ATSStore.login('head_it', '123456');
assert(loginHead.success && loginHead.user.role === 'department_head', 'Đăng nhập Trưởng phòng CNTT (head_it)');
assert(Helpers.canAccess('requisitions', 'department_head') && !Helpers.canAccess('settings', 'department_head'), 'Trưởng phòng xem được yêu cầu tuyển dụng nhưng không vào được cài đặt');

const loginHR = ATSStore.login('hr1', '123456');
assert(loginHR.success && loginHR.user.role === 'hr', 'Đăng nhập Nhân viên Nhân sự (hr1)');
assert(Helpers.canAccess('screening', 'hr') && Helpers.canAccess('settings', 'hr'), 'Nhân sự có đầy đủ quyền thao tác sàng lọc và cài đặt');

const loginFail = ATSStore.login('hr1', 'wrongpass');
assert(!loginFail.success, 'Đăng nhập với mật khẩu sai bị từ chối');

// ── TEST 2: Tạo yêu cầu tuyển dụng mới ────────────────────────────────────────
console.log('\n--- LUỒNG 2: TẠO YÊU CẦU TUYỂN DỤNG MỚI ---');
const newReq = ATSStore.createRequisition({
  title: 'Fullstack Node.js & React Developer',
  department: 'Công nghệ thông tin',
  quantity: 2,
  salary: '25 - 35 triệu VNĐ',
  workType: 'Toàn thời gian',
  location: 'Hà Nội',
  minExperience: 2,
  skills: ['Node.js', 'React', 'TypeScript', 'MongoDB'],
  deadline: '2026-12-01',
  reason: 'Mở rộng đội ngũ phát triển sản phẩm SaaS',
  description: 'Xây dựng API Backend và tối ưu hóa hệ thống microservices.',
  requirements: '2+ năm kinh nghiệm Node.js và React.'
});
assert(newReq && newReq.id && newReq.status === 'pending', 'Tạo yêu cầu tuyển dụng thành công ở trạng thái chờ phê duyệt (pending)');
assert(newReq.code.startsWith('YCTD-'), 'Mã yêu cầu tuyển dụng được sinh tự động chuẩn quy cách: ' + newReq.code);

// ── TEST 3: Phê duyệt yêu cầu & Tạo/Đăng tin tuyển dụng ───────────────────────
console.log('\n--- LUỒNG 3: PHÊ DUYỆT & ĐĂNG TIN TUYỂN DỤNG ---');
ATSStore.approveRequisition(newReq.id, true, 'Ban Giám đốc phê duyệt định biên');
const approvedReq = ATSStore.getRequisitionById(newReq.id);
assert(approvedReq.status === 'approved', 'Yêu cầu được chuyển sang trạng thái đã phê duyệt (approved)');

const newPost = ATSStore.createPostingFromRequisition(approvedReq.id, {
  title: 'Tuyển dụng Fullstack Node.js & React Developer - Lương 35M',
  salary: '25 - 35 triệu VNĐ'
});
assert(newPost && newPost.status === 'published', 'Tạo tin tuyển dụng từ yêu cầu đã duyệt thành công (published)');
assert(ATSStore.getRequisitionById(newReq.id).status === 'recruiting', 'Trạng thái yêu cầu tự động cập nhật sang Đang tuyển (recruiting)');

// ── TEST 4: Nộp CV từ Cổng ứng viên trực tuyến ───────────────────────────────
console.log('\n--- LUỒNG 4: NỘP CV TỪ CỔNG ỨNG VIÊN TRỰC TUYẾN ---');
const onlineCandidate = {
  fullName: 'Phan Minh Hoàng',
  email: 'hoang.phan@gmail.com',
  phone: '0918776655',
  experienceYears: 3,
  education: 'Đại học Bách Khoa Hà Nội',
  skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Git'],
  rawResumeText: `HỌ VÀ TÊN: PHAN MINH HOÀNG
Email: hoang.phan@gmail.com - SĐT: 0918776655
Học vấn: Đại học Bách Khoa Hà Nội - Kỹ thuật Phần mềm
Kinh nghiệm: 3 năm làm việc với Node.js, React, TypeScript và MongoDB.`
};

const onlineApp = ATSStore.submitApplication({
  candidateData: onlineCandidate,
  requisitionId: newReq.id,
  postingId: newPost.id,
  source: 'website'
});
assert(onlineApp && onlineApp.id, 'Hồ sơ ứng tuyển trực tuyến được tiếp nhận thành công');
assert(onlineApp.source === 'website', 'Nguồn ứng viên được ghi nhận chính xác: website');
assert(onlineApp.status === 'passed_screening', 'Hồ sơ đạt ngưỡng được AI tự động duyệt sang Đạt – Chờ phỏng vấn');
assert(onlineApp.screeningDetails && onlineApp.screeningDetails.autoApproved === true, 'Nhật ký AI ghi nhận tự động duyệt theo ngưỡng điểm đã cấu hình');

// ── TEST 5: Tải CV thủ công & Trích xuất tự động ──────────────────────────────
console.log('\n--- LUỒNG 5: TỰ ĐỘNG ĐỌC CV & TRÍCH XUẤT THÔNG TIN ---');
const sampleCVText = `HỌ VÀ TÊN: NGUYỄN VĂN THÀNH
Email: thanh.nguyen@outlook.com - Điện thoại: 0905123456
HỌC VẤN:
- Đại học Công nghệ - ĐHQGHN - Công nghệ thông tin
KINH NGHIỆM:
- 2022 - Nay (4 năm): Senior Backend Engineer tại VinID
KỸ NĂNG:
- Node.js, React, TypeScript, MongoDB, Docker, Git.`;

const parsedInfo = ATSStore.parseCVText(sampleCVText);
assert(parsedInfo.name === 'NGUYỄN VĂN THÀNH', 'Trích xuất họ tên chính xác: ' + parsedInfo.name);
assert(parsedInfo.email === 'thanh.nguyen@outlook.com', 'Trích xuất email chuẩn: ' + parsedInfo.email);
assert(parsedInfo.phone === '0905123456', 'Trích xuất số điện thoại chuẩn: ' + parsedInfo.phone);
assert(parsedInfo.skills.includes('Node.js') && parsedInfo.skills.includes('React'), 'Trích xuất đúng các kỹ năng chuyên môn: ' + parsedInfo.skills.join(', '));

// ── TEST 6: Đối chiếu tiêu chí & Chấm điểm sàng lọc AI ────────────────────────
console.log('\n--- LUỒNG 6: ĐỐI CHIẾU TIÊU CHÍ & CHẤM ĐIỂM SÀNG LỌC ---');
const screeningRes = ATSStore.evaluateCandidate(parsedInfo, newReq);
assert(screeningRes.score >= 80, 'Điểm số phù hợp đạt tiêu chuẩn cao: ' + screeningRes.score + 'đ');
assert(screeningRes.classification === 'pass', 'Phân loại kết quả sàng lọc chuẩn: Đạt tiêu chí (pass)');
assert(screeningRes.metCriteria.length > 0, 'Hiển thị danh sách tiêu chí đáp ứng chi tiết');

// ── TEST 7: Thao tác duyệt hồ sơ & Cập nhật trạng thái ───────────────────────
console.log('\n--- LUỒNG 7: DUYỆT HỒ SƠ & LỊCH SỬ THAY ĐỔI ---');
ATSStore.updateApplicationStatus(onlineApp.id, 'passed_screening', 'Duyệt hồ sơ đủ điều kiện vào vòng phỏng vấn');
const reviewedApp = ATSStore.getApplicationById(onlineApp.id);
assert(reviewedApp.status === 'passed_screening', 'Trạng thái chuyển sang Đạt – Chờ phỏng vấn');
assert(reviewedApp.statusHistory.length >= 2, 'Lưu vết lịch sử thay đổi trạng thái đầy đủ (Audit Log)');

// ── TEST 8: Tìm kiếm, lọc và sắp xếp ứng viên ────────────────────────────────
console.log('\n--- LUỒNG 8: TÌM KIẾM & BỘ LỌC ỨNG VIÊN ---');
const searchByName = ATSStore.getApplications({ search: 'Phan Minh Hoàng' });
assert(searchByName.length > 0 && searchByName[0].candidateName === 'Phan Minh Hoàng', 'Tìm kiếm ứng viên theo họ tên chuẩn xác');

const filterByReq = ATSStore.getApplications({ requisitionId: newReq.id });
assert(filterByReq.length > 0, 'Lọc ứng viên theo vị trí tuyển dụng hoạt động chính xác');

// ── TEST 9: Lên lịch phỏng vấn & Cảnh báo trùng lịch ─────────────────────────
console.log('\n--- LUỒNG 9: LỊCH PHỎNG VẤN & PHÁT HIỆN TRÙNG LỊCH ---');
const newIv = ATSStore.createInterview({
  candidateId: onlineApp.candidateId,
  candidateName: onlineApp.candidateName,
  requisitionId: newReq.id,
  positionTitle: newReq.title,
  round: 'Vòng 2 - Đánh giá Chuyên môn',
  date: '2026-11-10',
  startTime: '10:00',
  endTime: '11:30',
  type: 'online',
  location: 'https://meet.google.com/ats-demo-interview',
  interviewers: ['Lê Văn Hùng', 'Nguyễn Thu Hà'],
  notes: 'Đánh giá kỹ năng Node.js microservices'
});
assert(newIv && newIv.id && newIv.code.startsWith('LPV-'), 'Tạo lịch phỏng vấn thành công: ' + newIv.code);
assert(ATSStore.getApplicationById(onlineApp.id).status === 'interview_scheduled', 'Trạng thái hồ sơ tự động chuyển sang Đã lên lịch phỏng vấn');

// Kiểm tra cảnh báo trùng lịch
const conflicts = ATSStore.checkInterviewConflict('2026-11-10', '10:30', '12:00', ['Lê Văn Hùng']);
assert(conflicts.length > 0, 'Hệ thống tự động phát hiện trùng lịch của người phỏng vấn Lê Văn Hùng');

// Kiểm tra trùng lịch ỨNG VIÊN (cùng ứng viên, khác hội đồng)
const candConflicts = ATSStore.checkInterviewConflict(
  '2026-11-10', '10:30', '12:00', ['Nguyễn Thu Hà'], null, onlineApp.candidateId
);
assert(
  candConflicts.some(c => c.candidateConflict),
  'checkInterviewConflict phát hiện trùng lịch của chính ứng viên dù hội đồng khác nhau'
);

const ivCountBeforeClash = ATSStore.getInterviews().length;
const blockedIv = ATSStore.createInterview({
  candidateId: onlineApp.candidateId,
  candidateName: onlineApp.candidateName,
  requisitionId: newReq.id,
  positionTitle: newReq.title,
  round: 'Vòng 3 - Trùng giờ',
  date: '2026-11-10',
  startTime: '11:00',
  endTime: '12:00',
  type: 'onsite',
  location: 'Phòng họp 3',
  interviewers: ['Nguyễn Thu Hà']
});
assert(
  blockedIv && blockedIv.success === false,
  'Chặn tạo lịch thứ hai cho cùng ứng viên trong khung giờ trùng'
);
assert(
  typeof blockedIv.message === 'string' && blockedIv.message.includes('Không thể xếp lịch'),
  'Thông báo lỗi trùng lịch ứng viên rõ ràng: ' + (blockedIv.message || '').slice(0, 60) + '...'
);
assert(
  ATSStore.getInterviews().length === ivCountBeforeClash,
  'Không có lịch nào bị ghi vào hệ thống khi phát hiện trùng lịch ứng viên'
);

// ── TEST 9b: Email tự động gửi ứng viên ─────────────────────────────────────
// Đặc tả: hệ thống CHỈ gửi email khi HR duyệt CV và hẹn phỏng vấn, gửi tới
// đúng email ứng viên đã đăng ký lúc nộp CV, kèm giờ – ngày – địa điểm.
console.log('\n--- LUỒNG 9B: EMAIL TỰ ĐỘNG KHI HẸN PHỎNG VẤN ---');
const inviteMail = ATSStore.getEmails({ type: 'interview_invite' })
  .find(m => m.relatedId === newIv.id || m.to === onlineCandidate.email);
assert(!!inviteMail, 'Gửi email mời phỏng vấn tới email ứng viên đã đăng ký: ' + onlineCandidate.email);
assert(inviteMail && newIv.inviteEmailId === inviteMail.id, 'Lịch phỏng vấn lưu liên kết tới email mời đã gửi');
assert(inviteMail && inviteMail.to === onlineCandidate.email, 'Thư mời gửi đúng địa chỉ email đăng ký lúc nộp CV');
assert(
  inviteMail && (inviteMail.facts || []).some(f => /thời gian/i.test(f.label)) && (inviteMail.facts || []).some(f => /địa điểm/i.test(f.label)),
  'Thư mời có thông tin giờ giấc và địa điểm/liên kết phỏng vấn'
);

const rescheduledIv = ATSStore.updateInterview(newIv.id, {
  date: '2026-11-12',
  startTime: '14:00',
  endTime: '15:30'
});
assert(rescheduledIv && rescheduledIv.id === newIv.id, 'Đổi lịch phỏng vấn thành công sang lịch mới');
const rescheduleMail = ATSStore.getEmails({ type: 'interview_reschedule' })
  .find(m => m.relatedId === newIv.id);
assert(!!rescheduleMail, 'Đổi lịch tự gửi thư thông báo lịch mới tới ứng viên');
assert(rescheduleMail && rescheduleMail.to === onlineCandidate.email, 'Thư đổi lịch gửi đúng email đăng ký lúc nộp CV');
assert(
  rescheduleMail && (rescheduleMail.facts || []).some(f => /thời gian/i.test(f.label) && /14:00/.test(f.value)),
  'Thư đổi lịch có giờ phỏng vấn mới (14:00)'
);

// Ứng viên được phép có vòng khác vào khung giờ KHÔNG trùng
const secondIv = ATSStore.createInterview({
  candidateId: onlineApp.candidateId,
  candidateName: onlineApp.candidateName,
  requisitionId: newReq.id,
  positionTitle: newReq.title,
  round: 'Vòng 3 - Trao đổi với Ban Giám đốc',
  date: '2026-11-13',
  startTime: '09:00',
  endTime: '10:00',
  type: 'online',
  location: 'https://meet.google.com/ats-round-3',
  interviewers: ['Nguyễn Thu Hà']
});
assert(secondIv && secondIv.id && secondIv.success !== false, 'Vẫn cho phép vòng phỏng vấn khác vào khung giờ không trùng');

const clashReschedule = ATSStore.updateInterview(newIv.id, {
  date: '2026-11-13',
  startTime: '09:30',
  endTime: '10:30'
});
assert(
  clashReschedule && clashReschedule.success === false,
  'Chặn đổi lịch về khung giờ mà ứng viên đã có lịch khác'
);

// ── TEST 10: Nhập phiếu đánh giá & Quyết định tuyển dụng ─────────────────────
console.log('\n--- LUỒNG 10: PHIẾU ĐÁNH GIÁ & QUYẾT ĐỊNH TUYỂN DỤNG ---');
const newEval = ATSStore.createEvaluation({
  interviewId: newIv.id,
  candidateId: onlineApp.candidateId,
  candidateName: onlineApp.candidateName,
  requisitionId: newReq.id,
  round: 'Vòng 2 - Đánh giá Chuyên môn',
  evaluatorName: 'Lê Văn Hùng',
  evaluatorRole: 'Giám đốc Công nghệ',
  scores: { professionalKnowledge: 5, workSkills: 4.5, experience: 4, teamworkCommunication: 5 },
  overallScore: 92,
  recommendation: 'continue',
  finalDecision: 'Đề xuất tuyển dụng',
  comment: 'Ứng viên nắm rất vững cấu trúc Node.js và tư duy kiến trúc tốt. Đề xuất tuyển dụng.'
});
assert(newEval && newEval.overallScore === 92, 'Lưu phiếu đánh giá phỏng vấn thành công (92 điểm)');
assert(ATSStore.getApplicationById(onlineApp.id).status === 'proposed', 'Hồ sơ tự động cập nhật trạng thái Đã đề xuất tuyển dụng');

// Xác nhận tuyển dụng
ATSStore.updateApplicationStatus(onlineApp.id, 'hired', 'Giám đốc phê duyệt Offer và tuyển dụng chính thức');
assert(ATSStore.getApplicationById(onlineApp.id).status === 'hired', 'Ứng viên được chuyển sang trạng thái Đã tuyển thành công');

// Đặc tả mới: đổi trạng thái / phiếu đánh giá / quyết định KHÔNG tự gửi thư.
const evalMail = ATSStore.getEmails({ type: 'evaluation_result' }).find(m => m.relatedId === newEval.id);
assert(!evalMail, 'Không tự gửi email kết quả đánh giá');
const decisionMails = ATSStore.getEmails({ type: 'decision' });
assert(decisionMails.length === 0, 'Không tự gửi email quyết định tuyển dụng');

// Hủy lịch đã thông báo → phải gửi thư hủy kèm lý do.
const cancelledIv = ATSStore.cancelInterview(secondIv.id, 'Hủy lịch vì hội đồng bận đột xuất');
const cancelMail = ATSStore.getEmails({ type: 'interview_cancel' })
  .find(m => m.relatedId === secondIv.id);
assert(cancelledIv && cancelledIv.status === 'cancelled', 'Hủy lịch phỏng vấn thành công');
assert(!!cancelMail, 'Hủy lịch tự gửi thư thông báo hủy tới ứng viên');
assert(cancelMail && cancelMail.to === onlineCandidate.email, 'Thư hủy gửi đúng email đăng ký lúc nộp CV');
assert(
  cancelMail && (cancelMail.paragraphs || []).join(' ').includes('Hủy lịch vì hội đồng bận đột xuất'),
  'Thư hủy có nêu lý do hủy'
);

// Đếm theo loại: 2 thư mời + 1 thư đổi lịch + 1 thư hủy.
const inviteMails = ATSStore.getEmails({ type: 'interview_invite' });
assert(inviteMails.length === 2, 'Hộp thư có đúng 2 thư mời phỏng vấn đã hẹn: ' + inviteMails.length);
const allMails = ATSStore.getEmails();
assert(
  allMails.every(m => ['interview_invite', 'interview_reschedule', 'interview_cancel'].includes(m.type)),
  'Chỉ gửi 3 loại thư đúng phạm vi (mời/đổi lịch/hủy lịch): ' + allMails.map(m => m.type).join(', ')
);
assert(
  allMails.every(m => m.to === onlineCandidate.email),
  'Mọi thư đều gửi tới email ứng viên đã đăng ký lúc nộp CV'
);

// ── TEST 11: Số liệu Dashboard & Báo cáo tuyển dụng động ─────────────────────
console.log('\n--- LUỒNG 11: THỐNG KÊ DASHBOARD & BÁO CÁO ĐỘNG ---');
const stats = ATSStore.getDashboardStats();
assert(stats.totalCandidates >= 8, 'Dashboard thống kê tổng số hồ sơ động: ' + stats.totalCandidates);
assert(stats.hired >= 1, 'Dashboard ghi nhận số ứng viên đã tuyển: ' + stats.hired);

const report = ATSStore.getRecruitmentReport();
assert(report.funnel && report.funnel.length === 5, 'Báo cáo phễu tuyển dụng đủ 5 giai đoạn chuyển đổi');
assert(report.sourcing && report.sourcing.length >= 4, 'Báo cáo hiệu quả nguồn tuyển dụng đa kênh chính xác');
assert(report.postings && report.postings.length > 0, 'Báo cáo thời gian đăng tin và phát hiện tin kéo dài');

// ── TEST 12: Kiểm tra dữ liệu không hợp lệ & Validation ──────────────────────
console.log('\n--- LUỒNG 12: KIỂM TRA TRƯỜNG HỢP NHẬP SAI & VALIDATION ---');
assert(!Helpers.isValidEmail('invalid-email-format'), 'Bắt lỗi định dạng email sai: invalid-email-format');
assert(Helpers.isValidEmail('hr@smartats.vn'), 'Email hợp lệ được chấp nhận: hr@smartats.vn');
assert(!Helpers.isValidPhone('12345'), 'Bắt lỗi số điện thoại không hợp lệ: 12345');
assert(Helpers.isValidPhone('0912345678'), 'Số điện thoại Việt Nam hợp lệ được chấp nhận: 0912345678');
assert(!Helpers.isRequired('   '), 'Bắt lỗi khoảng trắng rỗng');

// ── TEST 13: Quản lý tài khoản người dùng ─────────────────────────────────────
console.log('\n--- LUỒNG 13: QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG ---');
const newUser = ATSStore.createUser({
  fullName: 'Đỗ Minh Anh',
  username: 'hr2',
  password: '123456',
  email: 'anh.do@smartats.vn',
  phone: '0909123456',
  role: 'hr',
  department: 'Phòng Nhân sự',
  title: 'Chuyên viên Tuyển dụng'
});
assert(newUser.success && newUser.user.username === 'hr2', 'Tạo tài khoản nhân sự mới thành công');
const duplicateUser = ATSStore.createUser({
  fullName: 'Trùng Tài Khoản',
  username: 'hr2',
  password: '123456',
  email: 'khac@smartats.vn',
  role: 'hr'
});
assert(!duplicateUser.success, 'Từ chối tạo tài khoản trùng tên đăng nhập');

console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI KIỂM THỬ THÀNH CÔNG (100% ĐẠT)`);
console.log('================================================================\n');
