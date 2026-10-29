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
                <table class="data-table table-sticky-actions">
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
        this.showAddUserModal();
      });
    },

    showAddUserModal() {
      const departments = ATSStore.getDepartments();
      const modalHtml = `
        <div class="modal active" id="modal-add-user">
          <div class="modal-dialog modal-md">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title flex items-center gap-2">
                  <i data-lucide="user-plus" class="icon-md text-primary"></i>
                  Thêm tài khoản mới
                </h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-add-user')">&times;</button>
              </div>
              <form id="form-add-user">
                <div class="modal-body">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="form-group">
                      <label class="form-label required">Họ và tên</label>
                      <input type="text" name="fullName" class="form-input" placeholder="Ví dụ: Nguyễn Văn An" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Tên đăng nhập</label>
                      <input type="text" name="username" class="form-input" placeholder="Ví dụ: hr2" autocomplete="off" required>
                      <small class="text-2xs text-muted">Chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.</small>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Mật khẩu</label>
                      <input type="password" name="password" class="form-input" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Email liên hệ</label>
                      <input type="email" name="email" class="form-input" placeholder="ten.nhanvien@smartats.vn" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Số điện thoại</label>
                      <input type="tel" name="phone" class="form-input" placeholder="09xx xxx xxx">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Vai trò</label>
                      <select name="role" class="form-select" required>
                        <option value="hr">Nhân viên nhân sự (HR)</option>
                        <option value="department_head">Trưởng phòng (HOD)</option>
                        <option value="director">Giám đốc (Director)</option>
                        <option value="candidate">Ứng viên (Candidate)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Phòng ban</label>
                      <select name="department" class="form-select" required>
                        ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Chức danh</label>
                      <input type="text" name="title" class="form-input" placeholder="Ví dụ: Chuyên viên tuyển dụng">
                    </div>
                  </div>

                  <div class="alert alert-info mt-3 text-xs">
                    <i data-lucide="info" class="icon-xs"></i>
                    <span>Tài khoản được tạo sẽ hoạt động ngay và có thể đăng nhập bằng tên đăng nhập/mật khẩu vừa nhập. Ứng viên sau khi đăng nhập sẽ được chuyển tới Cổng tuyển dụng.</span>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-add-user')">Hủy</button>
                  <button type="submit" class="btn btn-primary">
                    <i data-lucide="save" class="icon-xs"></i> Tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('user-modals-container');
      if (!container) return;
      container.innerHTML = modalHtml;
      UI.openModal('modal-add-user');
      if (typeof lucide !== 'undefined') lucide.createIcons();

      document.getElementById('form-add-user')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const result = ATSStore.createUser({
          fullName: fd.get('fullName'),
          username: fd.get('username'),
          password: fd.get('password'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          role: fd.get('role'),
          department: fd.get('department'),
          title: fd.get('title')
        });

        if (!result.success) {
          UI.toast({ message: result.message, type: 'warning' });
          return;
        }

        UI.closeModal('modal-add-user');
        UI.toast({ message: `Đã tạo tài khoản “${result.user.username}” cho ${result.user.fullName}.`, type: 'success' });
        this.refresh();
      });
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = this.render();
        this.init();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }
    }
  };
})();
