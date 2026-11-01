/**
 * users.js - Module Quản lý người dùng & Ma trận phân quyền (RBAC)
 * Quản lý 3 vai trò nội bộ: Giám đốc, Trưởng phòng, Nhân viên nhân sự
 */

const UsersPage = (() => {
  return {
    render() {
      const currentUser = ATSStore.getCurrentUser();
      if (!currentUser) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      // Ứng viên không có tài khoản nội bộ: họ chỉ dùng cổng tuyển dụng công khai.
      const users = ATSStore.getUsers().filter(u => u.role !== 'candidate');

      /* Quyền đọc trong một dòng: full = toàn bộ, act = thao tác, read = chỉ xem, none = không có */
      const matrix = [
        { feature: 'Tổng quan tuyển dụng', director: ['full', 'Toàn bộ'], hod: ['act', 'Phòng ban'], hr: ['full', 'Đầy đủ'] },
        { feature: 'Yêu cầu tuyển dụng', director: ['act', 'Duyệt'], hod: ['act', 'Tạo · phòng ban'], hr: ['act', 'Toàn quyền'] },
        { feature: 'Tin đăng & kênh tuyển', director: ['read', 'Xem'], hod: ['read', 'Xem phòng ban'], hr: ['act', 'Xuất bản'] },
        { feature: 'Đọc CV & sàng lọc', director: ['read', 'Xem'], hod: ['read', 'Xem phòng ban'], hr: ['act', 'Thiết lập'] },
        { feature: 'Phỏng vấn & đánh giá', director: ['act', 'Vòng 3'], hod: ['act', 'Vòng 2'], hr: ['act', 'Điều phối'] },
        { feature: 'Quyết định tuyển', director: ['act', 'Phê duyệt'], hod: ['act', 'Đề xuất'], hr: ['act', 'Gửi offer'] },
        { feature: 'Báo cáo & thống kê', director: ['full', 'Toàn bộ'], hod: ['none', '—'], hr: ['act', 'Nghiệp vụ'] }
      ];
      const roleKeys = ['director', 'hod', 'hr'];

      return `
        <div class="page-container">
          <div class="page-header">
            <div class="page-heading">
              <h1 class="page-title">Người dùng & phân quyền</h1>
              <p class="page-subtitle">Bốn vai trò chức năng và phạm vi truy cập của từng vai trò trên hệ thống</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-add-user">
                <i data-lucide="user-plus" class="icon-sm"></i> Thêm tài khoản
              </button>
            </div>
          </div>

          <!-- Ma trận phân quyền -->
          <div class="card mb-4">
            <div class="card-header">
              <div>
                <h3 class="card-title">Ma trận phân quyền</h3>
                <p class="card-subtitle">Phạm vi của từng vai trò trên bảy nhóm chức năng</p>
              </div>
            </div>
            <div class="card-body card-body-no-padding">
              <div class="table-responsive">
                <table class="data-table data-table-compact matrix-table">
                  <thead>
                    <tr>
                      <th>Chức năng</th>
                      <th class="text-center">Giám đốc</th>
                      <th class="text-center">Trưởng phòng</th>
                      <th class="text-center">Nhân sự</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${matrix.map(m => `
                      <tr>
                        <td>${m.feature}</td>
                        ${roleKeys.map(k => {
                          const [kind, label] = m[k];
                          const cls = kind === 'none' ? ' is-none' : (kind === 'full' ? ' is-full' : '');
                          return `<td class="text-center"><span class="perm${cls}">${label}</span></td>`;
                        }).join('')}
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
                    <span>Tài khoản được tạo sẽ hoạt động ngay và có thể đăng nhập bằng tên đăng nhập/mật khẩu vừa nhập. Ứng viên không có tài khoản nội bộ — họ nộp và tra cứu hồ sơ tại cổng tuyển dụng công khai.</span>
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
