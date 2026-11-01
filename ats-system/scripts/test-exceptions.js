/**
 * scripts/test-exceptions.js
 * Kiểm thử 3 cơ chế xử lý ngoại lệ (BPMN) + sửa lỗi nút cờ "cần kiểm tra thủ công".
 *
 *   Ngoại lệ 1: Non-interrupting Boundary Timer — nhắc phê duyệt JD quá hạn (480 phút)
 *   Ngoại lệ 2: Boundary Error Event — lỗi đăng tin, ghi nhận + thông báo HR + đăng lại
 *   Ngoại lệ 3: Event Sub-Process — hủy yêu cầu, ngắt quy trình ngay, không cần duyệt
 *
 * Chạy: node scripts/test-exceptions.js
 */
const fs = require('fs');
const path = require('path');

// ── Mock môi trường trình duyệt ────────────────────────────────────────────
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};
global.window = {
  location: { hash: '#/dashboard', origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  scrollTo: () => {},
};
global.document = {
  createElement: () => ({
    tagName: 'DIV', textContent: '', innerHTML: '',
    appendChild: () => {}, setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  getElementById: () => null,
  querySelectorAll: () => [],
};

const ROOT = path.join(__dirname, '..');
function loadModule(relPath, globalName) {
  let code = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
  code = code.replace(new RegExp(`^const ${globalName} =`, 'm'), `global.${globalName} =`);
  (0, eval)(code);
}
loadModule('src/utils/helpers.js', 'Helpers');
loadModule('src/data/store.js', 'ATSStore');

let failed = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  [PASS] ${label}`);
  else { failed += 1; console.log(`  [FAIL] ${label}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}

ATSStore.login('hr1', '123456');
const hr = ATSStore.getCurrentUser();

function makeRequisition(title) {
  return ATSStore.createRequisition({
    title,
    department: 'Công nghệ thông tin',
    quantity: 1,
    reason: 'Kiểm thử xử lý ngoại lệ',
    description: 'Mô tả công việc kiểm thử',
    requirements: 'Yêu cầu kiểm thử',
    skills: ['React'],
    education: 'Đại học',
    minExperience: 2,
    salary: '20.000.000 VNĐ',
    workType: 'Toàn thời gian',
    location: 'Hà Nội',
    deadline: '2026-12-31',
    creatorId: 'usr_hr1',
    creatorName: 'Nguyễn Thu Hà'
  });
}

// ══════════════════════════════════════════════════════════════════════════
console.log('='.repeat(72));
console.log(' KIỂM THỬ XỬ LÝ NGOẠI LỆ (BPMN) + NÚT CỜ KIỂM TRA THỦ CÔNG');
console.log('='.repeat(72));

// ── 0. Sửa lỗi nút cờ "cần kiểm tra thủ công" ──────────────────────────────
console.log('\n[0] Nút cờ "cần kiểm tra thủ công" — bật/tắt 2 chiều');
const app = ATSStore.getApplications().find(a => a.status !== 'reviewing') || ATSStore.getApplications()[0];
const appId = app.id;
const originalStatus = app.status;

const on1 = ATSStore.toggleManualReview(appId, 'Đánh dấu kiểm tra thủ công');
check('Bật cờ: manualReview = true', on1 && on1.manualReview === true, on1 && on1.manualReview);
check('Bật cờ: có người đánh dấu', !!on1.manualReviewBy && on1.manualReviewBy === (hr.fullName || hr.username), on1.manualReviewBy);
check('Bật cờ: trạng thái chuyển sang "reviewing"', on1.status === 'reviewing', on1.status);

const off1 = ATSStore.toggleManualReview(appId, 'Bỏ đánh dấu');
check('Tắt cờ: manualReview = false', off1 && off1.manualReview === false, off1 && off1.manualReview);
check('Tắt cờ: xóa người đánh dấu', !off1.manualReviewBy, off1.manualReviewBy);
check('Tắt cờ: trạng thái được khôi phục', off1.status === originalStatus, { restored: off1.status, expected: originalStatus });

const on2 = ATSStore.toggleManualReview(appId);
const markedAgain = ATSStore.getApplicationById(appId).manualReview;
const off2 = ATSStore.toggleManualReview(appId);
const unmarkedAgain = ATSStore.getApplicationById(appId).manualReview;
check('Bật/tắt lặp lại vẫn đúng (không kẹt một chiều)',
  on2 && on2.id === appId && markedAgain === true && off2 && unmarkedAgain === false,
  { markedAgain, unmarkedAgain });

// ── Ngoại lệ 1: nhắc nhở phê duyệt JD quá hạn (480 phút) ───────────────────
console.log('\n[1] Ngoại lệ 1 — Nhắc nhở phê duyệt JD quá hạn (non-interrupting timer)');
check('Ngưỡng mặc định = 480 phút', ATSStore.getApprovalReminderMinutes() === 480, ATSStore.getApprovalReminderMinutes());

const req1 = makeRequisition('Kiểm thử nhắc nhở phê duyệt');
// Giả lập yêu cầu đã chờ 9 giờ (> 480 phút).
const T0 = Date.now();
const nineHoursAgo = new Date(T0 - 9 * 60 * 60 * 1000).toISOString();
req1.approvalHistory[0].date = nineHoursAgo;
req1.createdAt = nineHoursAgo;

check('Nhận diện quá hạn (9 giờ > 8 giờ)', ATSStore.isApprovalOverdue(req1, new Date(T0)) === true);
check('Số phút chờ > 480', ATSStore.getApprovalWaitingMinutes(req1, new Date(T0)) > 480, ATSStore.getApprovalWaitingMinutes(req1, new Date(T0)));

const notifiedBefore = ATSStore.getNotifications().length;
const reminded1 = ATSStore.checkApprovalReminders(new Date(T0));
const reqAfter1 = ATSStore.getRequisitionById(req1.id);
const remindedIds1 = reminded1.map(r => r.id);

// Lưu ý: dữ liệu mẫu cũng có yêu cầu "Chờ phê duyệt" quá hạn nên có thể được nhắc
// cùng lúc — chỉ cần xác nhận yêu cầu kiểm thử nằm trong danh sách được nhắc.
check('Có gửi nhắc nhở cho yêu cầu kiểm thử', remindedIds1.includes(req1.id), remindedIds1);
check('NON-INTERRUPTING: trạng thái vẫn "pending"', reqAfter1.status === 'pending', reqAfter1.status);
check('Ghi nhận số lần nhắc = 1', reqAfter1.reminderCount === 1, reqAfter1.reminderCount);
check('Có mốc lastReminderAt', !!reqAfter1.lastReminderAt);
check('Có thông báo mới', ATSStore.getNotifications().length > notifiedBefore,
  ATSStore.getNotifications().length - notifiedBefore);
const notif = ATSStore.getNotifications().find(n => String(n.message).includes(reqAfter1.code));
check('Có thông báo chứa mã yêu cầu kiểm thử', !!notif, reqAfter1.code);
check('Thông báo đúng người nhận (director)', notif && notif.role === 'director', notif && notif.role);
check('Lịch sử phê duyệt có bản ghi "reminder"', (reqAfter1.approvalHistory || []).some(h => h.status === 'reminder'));

// Gọi lại ngay → yêu cầu kiểm thử không bị nhắc trùng.
const remindedAgain = ATSStore.checkApprovalReminders(new Date(T0 + 60 * 1000));
check('Không nhắc trùng trong cùng chu kỳ',
  !remindedAgain.some(r => r.id === req1.id),
  remindedAgain.map(r => r.id));

// Sau một chu kỳ nữa → nhắc lần 2.
ATSStore.checkApprovalReminders(new Date(T0 + 481 * 60 * 1000));
check('Chu kỳ sau nhắc tiếp lần 2', ATSStore.getRequisitionById(req1.id).reminderCount === 2,
  ATSStore.getRequisitionById(req1.id).reminderCount);

// Phê duyệt → hết quá hạn.
ATSStore.approveRequisition(req1.id, true, 'Duyệt sau nhắc nhở');
const reqApproved = ATSStore.getRequisitionById(req1.id);
check('Sau khi duyệt: trạng thái "approved"', reqApproved.status === 'approved', reqApproved.status);
check('Sau khi duyệt: cờ quá hạn được xóa', !ATSStore.isApprovalOverdue(reqApproved, new Date(T0)));

// ── Ngoại lệ 2: lỗi đăng tin (boundary error) ──────────────────────────────
console.log('\n[2] Ngoại lệ 2 — Lỗi kỹ thuật khi đăng tin (Boundary Error Event)');
const req2 = makeRequisition('Kiểm thử lỗi đăng tin');
ATSStore.approveRequisition(req2.id, true, 'Duyệt để đăng tin');

const postingCountBefore = ATSStore.getPostings().length;
const notifBefore2 = ATSStore.getNotifications().length;
const failedPublish = ATSStore.publishPosting(req2.id, { title: 'Tiêu đề kiểm thử lỗi' }, { simulateError: true });
const req2AfterFail = ATSStore.getRequisitionById(req2.id);

check('Trả về success = false', failedPublish.success === false);
check('Ghi nhận lỗi trên yêu cầu (publishStatus = error)', req2AfterFail.publishStatus === 'error', req2AfterFail.publishStatus);
check('Lưu chi tiết lỗi', !!req2AfterFail.publishError && !!req2AfterFail.publishError.message, req2AfterFail.publishError);
check('Không tạo tin tuyển dụng khi lỗi', ATSStore.getPostings().length === postingCountBefore, ATSStore.getPostings().length);
check('Thông báo cho phòng nhân sự', ATSStore.getNotifications().length === notifBefore2 + 1);
check('Thông báo lỗi gửi đúng role hr', ATSStore.getNotifications()[0].role === 'hr', ATSStore.getNotifications()[0].role);
check('Lịch sử có bản ghi publish_error', (req2AfterFail.approvalHistory || []).some(h => h.status === 'publish_error'));
check('Yêu cầu vẫn ở trạng thái approved (có thể đăng lại)', req2AfterFail.status === 'approved', req2AfterFail.status);

// Khắc phục xong → đăng lại thành công.
const retried = ATSStore.retryPublish(req2.id, { title: 'Tiêu đề sau khi khắc phục' });
const req2AfterRetry = ATSStore.getRequisitionById(req2.id);
check('Đăng lại thành công', retried.success === true, retried.error);
check('Tạo được tin tuyển dụng', !!(retried.posting && retried.posting.code), retried.posting && retried.posting.code);
check('Xóa lỗi sau khi đăng lại', req2AfterRetry.publishStatus === 'published' && !req2AfterRetry.publishError,
  { publishStatus: req2AfterRetry.publishStatus, publishError: req2AfterRetry.publishError });
check('Yêu cầu chuyển sang "recruiting"', req2AfterRetry.status === 'recruiting', req2AfterRetry.status);

// ── Ngoại lệ 3: hủy yêu cầu tuyển dụng ────────────────────────────────────
console.log('\n[3] Ngoại lệ 3 — Hủy yêu cầu tuyển dụng (Event Sub-Process, ngắt ngay)');
const req3 = makeRequisition('Kiểm thử hủy yêu cầu');
ATSStore.approveRequisition(req3.id, true, 'Duyệt trước khi hủy');
ATSStore.publishPosting(req3.id, { title: 'Tin sẽ bị đóng khi hủy' });

// Tạo 1 lịch phỏng vấn đang chờ cho yêu cầu này (qua ứng viên có sẵn).
const candidate = ATSStore.getCandidates()[0];
ATSStore.createInterview({
  candidateId: candidate.id,
  candidateName: candidate.fullName,
  requisitionId: req3.id,
  positionTitle: req3.title,
  round: 'Vòng 1 - Kiểm thử',
  date: '2026-12-10',
  startTime: '09:00',
  endTime: '10:00',
  type: 'online',
  location: 'https://meet.google.com/exception-test',
  interviewers: ['Lê Văn Hùng']
});

const notifBefore3 = ATSStore.getNotifications().length;
const postingsBefore3 = ATSStore.getPostings().filter(p => p.requisitionId === req3.id && p.status === 'published').length;

const invalidCancel = ATSStore.cancelRequisition(req3.id, { reason: 'ngắn' });
check('Từ chối lý do hủy quá ngắn (<5 ký tự)', invalidCancel.success === false, invalidCancel.message);

const cancelled = ATSStore.cancelRequisition(req3.id, {
  reason: 'Ngân sách quý 4 bị cắt, chưa thể tuyển bổ sung',
  requestedBy: hr
});
const req3After = ATSStore.getRequisitionById(req3.id);

check('Hủy thành công', cancelled.success === true, cancelled.message);
check('Trạng thái = "cancelled"', req3After.status === 'cancelled', req3After.status);
check('Lưu lý do hủy', /ngân sách/i.test(req3After.cancelReason || ''), req3After.cancelReason);
check('Lưu người hủy + thời điểm', !!req3After.cancelledBy && !!req3After.cancelledAt);
check('Đóng tin tuyển dụng đang mở', cancelled.closedPostings >= 1 && postingsBefore3 >= 1, cancelled.closedPostings);
check('Hủy lịch phỏng vấn đang chờ', cancelled.cancelledInterviews >= 1, cancelled.cancelledInterviews);
check('Thông báo cho HR và giám đốc', ATSStore.getNotifications().length >= notifBefore3 + 2,
  ATSStore.getNotifications().length - notifBefore3);
check('Lịch sử ghi nhận hủy', (req3After.approvalHistory || []).some(h => h.status === 'cancelled'));

// Không cần giám đốc phê duyệt: duyệt sau khi hủy phải bị chặn.
const approveAfterCancel = ATSStore.approveRequisition(req3.id, true, 'Cố duyệt sau khi hủy');
check('KHÔNG cần/không cho phê duyệt sau khi hủy',
  approveAfterCancel && approveAfterCancel.success === false,
  approveAfterCancel && approveAfterCancel.message);
check('Trạng thái giữ nguyên "cancelled"', ATSStore.getRequisitionById(req3.id).status === 'cancelled');

// Quyền hạn: trưởng phòng khác phòng ban không được hủy.
const otherReq = makeRequisition('Yêu cầu phòng CNTT');
const salesHead = ATSStore.getUsers().find(u => u.username === 'head_sales');
const denied = ATSStore.cancelRequisition(otherReq.id, {
  reason: 'Trưởng phòng khác xin hủy',
  requestedBy: salesHead
});
check('Chặn trưởng phòng khác phòng ban hủy yêu cầu', denied.success === false, denied.message);

// Không thể hủy khi đã kết thúc.
const again = ATSStore.cancelRequisition(req3.id, { reason: 'Hủy lần hai', requestedBy: hr });
check('Không thể hủy lại yêu cầu đã hủy', again.success === false, again.message);

// ── Tổng kết ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(72));
console.log(failed === 0
  ? ' KẾT QUẢ: CẢ 3 NGOẠI LỆ + NÚT CỜ HOẠT ĐỘNG ĐÚNG'
  : ` KẾT QUẢ: ${failed} kiểm tra KHÔNG ĐẠT`);
console.log('='.repeat(72) + '\n');
process.exitCode = failed === 0 ? 0 : 1;
