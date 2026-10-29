/**
 * users.js - Module Quản lý người dùng & Ma trận phân quyền (RBAC)
 * Quản lý 4 vai trò: Giám đốc, Trưởng phòng, Nhân viên nhân sự, Ứng viên
 */

const UsersPage = (() => {
  return {
    render() {
      const currentUser = ATSStore.getCurrentUser();
      if (!currentUser) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const users = ATSStore.getUsers();

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Quản lý người dùng & Phân quyền</h1>
              <p class="page-subtitle">Kiểm soát quyền truy cập hệ thống theo 4 vai trò chức năng bảo đảm an toàn dữ liệu</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-add-user">
                <i data-lucide="user-plus" class="icon-sm"></i> Thêm tài khoản mới
              </button>
            </div>
          </div>

          <!-- Role Permissions Matrix Card -->
          <div class="card mb-4">
            <div class="card-header py-3">
              <h3 class="card-title text-sm flex items-center gap-2">
                <i data-lucide="shield" class="icon-sm text-primary"></i>
                Ma trận phân quyền chi tiết (Access Control Matrix)
              </h3>
            </div>
            <div class="card-body card-body-no-padding">
              <div class="table-responsive">
                <table class="data-table data-table-compact text-xs">
                  <thead>
                    <tr>
                      <th>Chức năng hệ thống</th>
                      <th class="text-center">Giám đốc (Director)</th>
                      <th class="text-center">Trưởng phòng (HOD)</th>
                      <th class="text-center">Nhân viên nhân sự (HR)</th>
                      <th class="text-center">Ứng viên (Candidate)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Dashboard tổng quan</strong></td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Xem toàn bộ</td>
                      <td class="text-center text-info"><i data-lucide="check" class="icon-xs inline"></i> Xem phòng ban mình</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Đầy đủ quyền</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Không truy cập</td>
                    </tr>
                    <tr>
                      <td><strong>Yêu cầu tuyển dụng</strong></td>
                      <td class="text-center text-primary"><i data-lucide="check" class="icon-xs inline"></i> Phê duyệt / Từ chối</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Tạo & theo dõi phòng ban</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Quản lý & tạo tin</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Không truy cập</td>
                    </tr>
                    <tr>
                      <td><strong>Đăng tin & Kênh tuyển dụng</strong></td>
                      <td class="text-center text-muted"><i data-lucide="eye" class="icon-xs inline"></i> Xem tin đăng</td>
                      <td class="text-center text-muted"><i data-lucide="eye" class="icon-xs inline"></i> Xem tin phòng ban</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Toàn quyền xuất bản</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Chỉ xem trên Cổng Portal</td>
                    </tr>
                    <tr>
                      <td><strong>Đọc CV & Sàng lọc tự động</strong></td>
                      <td class="text-center text-muted"><i data-lucide="eye" class="icon-xs inline"></i> Xem kết quả</td>
                      <td class="text-center text-muted"><i data-lucide="eye" class="icon-xs inline"></i> Xem kết quả phòng ban</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Thiết lập tiêu chí & Duyệt</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Không truy cập</td>
                    </tr>
                    <tr>
                      <td><strong>Lịch phỏng vấn & Đánh giá</strong></td>
                      <td class="text-center text-info"><i data-lucide="check" class="icon-xs inline"></i> Phỏng vấn Vòng 3 (Final)</td>
                      <td class="text-center text-info"><i data-lucide="check" class="icon-xs inline"></i> Phỏng vấn Vòng 2 (Chuyên môn)</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Điều phối, tạo lịch, gửi email</td>
                      <td class="text-center text-muted">Nhận thư mời phỏng vấn</td>
                    </tr>
                    <tr>
                      <td><strong>Quyết định tuyển dụng cuối cùng</strong></td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Phê duyệt tuyển dụng chính thức</td>
                      <td class="text-center text-info"><i data-lucide="check" class="icon-xs inline"></i> Đề xuất tuyển dụng</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Gửi đề xuất & Phát hành Offer</td>
                      <td class="text-center text-muted">Nhận kết quả tuyển dụng</td>
                    </tr>
                    <tr>
                      <td><strong>Báo cáo & Thống kê</strong></td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Toàn quyền xem báo cáo</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Không có quyền</td>
                      <td class="text-center text-success"><i data-lucide="check" class="icon-xs inline"></i> Báo cáo nghiệp vụ & xuất CSV</td>
                      <td class="text-center text-danger"><i data-lucide="x" class="icon-xs inline"></i> Không truy cập</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Users List Table -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <h3 class="card-title text-sm">Danh sách tài khoản hệ thống (${users.length} tài khoản)</h3>
            </div>
            <div class="card-body card-body-no-padding">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 45px;">STT</th>
                      <th>Họ tên & Tài khoản</th>
                      <th>Vai trò</th>
                      <th>Phòng ban</th>
                      <th>Email liên hệ</th>
                      <th>Số điện thoại</th>
                      <th>Trạng thái</th>
                      <th class="text-right">Chuyển vai trò test</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${users.map((u, i) => `
                      <tr>
                        <td class="text-center font-medium">${i + 1}</td>
                        <td>
                          <strong>${u.fullName}</strong>
                          <div class="text-xs text-muted font-mono">@${u.username}</div>
                        </td>
                        <td>
                          <span class="badge ${u.role === 'director' ? 'badge-primary' : (u.role === 'hr' ? 'badge-success' : 'badge-info')} font-bold">
                            ${Helpers.getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td>${u.department}</td>
                        <td class="text-xs font-mono">${u.email}</td>
                        <td class="text-xs font-mono">${u.phone || '—'}</td>
                        <td><span class="badge badge-success">Hoạt động</span></td>
                        <td class="text-right">
                          <button class="btn btn-xs ${currentUser.username === u.username ? 'btn-secondary disabled' : 'btn-outline'} btn-switch-user" data-username="${u.username}" title="Đăng nhập nhanh vai trò này">
                            <i data-lucide="log-in" class="icon-xs"></i> ${currentUser.username === u.username ? 'Đang dùng' : 'Chuyển sang'}
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Modals Container -->
          <div id="user-modals-container"></div>
        </div>
      `;
    },

    init() {
      // Switch User Buttons
      document.querySelectorAll('.btn-switch-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const username = e.currentTarget.getAttribute('data-username');
          const res = ATSStore.login(username, '123456');
          if (res.success) {
            UI.toast({ message: `Đã chuyển sang tài khoản: ${res.user.fullName} (${Helpers.getRoleLabel(res.user.role)})`, type: 'success' });
            setTimeout(() => {
              window.location.reload();
            }, 400);
          }
        });
      });

      // Add user button
      document.getElementById('btn-add-user')?.addEventListener('click', () => {
        UI.toast({ message: 'Tính năng thêm người dùng: bạn có thể cấu hình tài khoản qua file mock store hoặc form.', type: 'info' });
      });
    }
  };
})();
