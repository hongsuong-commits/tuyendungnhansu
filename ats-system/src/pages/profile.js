/**
 * profile.js - Trang hồ sơ cá nhân của người dùng nội bộ
 * Cho phép cập nhật thông tin liên hệ cơ bản và xem quyền hạn theo vai trò.
 */

const ProfilePage = (() => {
  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const department = user.department || '—';
      const roleLabel = Helpers.getRoleLabel(user.role);
      const isCandidate = user.role === 'candidate';

      return `
        <div class="page-container">
          <div class="page-header mb-4">
            <div>
              <h1 class="page-title">Hồ sơ cá nhân</h1>
              <p class="page-subtitle">Quản lý thông tin liên hệ và kiểm tra quyền truy cập của tài khoản đang đăng nhập</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Thông tin tài khoản -->
            <div class="card lg:col-span-1">
              <div class="card-body text-center">
                <div class="avatar-initials mx-auto" style="width: 72px; height: 72px; font-size: 24px;">${user.avatar || 'USR'}</div>
                <h2 class="text-lg font-bold mt-3">${user.fullName}</h2>
                <p class="text-sm text-muted">${user.title || roleLabel}</p>
                <div class="mt-2 flex items-center justify-center gap-2">
                  <span class="badge badge-primary font-semibold">${roleLabel}</span>
                  <span class="badge badge-success">Hoạt động</span>
                </div>

                <div class="border-t mt-4 pt-3 text-left text-xs space-y-2">
                  <div class="flex justify-between gap-3"><span class="text-muted">Tài khoản</span><strong class="font-mono">@${user.username}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-muted">Phòng ban</span><strong class="text-right">${department}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-muted">Email</span><strong class="text-right break-all">${user.email || '—'}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-muted">Điện thoại</span><strong>${user.phone || '—'}</strong></div>
                </div>

                ${isCandidate ? `
                  <a href="#/portal" class="btn btn-outline w-full mt-4">
                    <i data-lucide="briefcase" class="icon-sm"></i> Về Cổng tuyển dụng
                  </a>
                ` : ''}
              </div>
            </div>

            <!-- Form cập nhật -->
            <div class="card lg:col-span-2">
              <div class="card-header py-3">
                <h3 class="card-title text-sm flex items-center gap-2">
                  <i data-lucide="user-cog" class="icon-sm text-primary"></i>
                  Cập nhật thông tin liên hệ
                </h3>
              </div>
              <div class="card-body">
                <form id="form-profile-update">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="form-group">
                      <label class="form-label required">Họ và tên</label>
                      <input type="text" name="fullName" class="form-input" value="${user.fullName || ''}" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Chức danh</label>
                      <input type="text" name="title" class="form-input" value="${user.title || ''}">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Email liên hệ</label>
                      <input type="email" name="email" class="form-input" value="${user.email || ''}" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Số điện thoại</label>
                      <input type="tel" name="phone" class="form-input" value="${user.phone || ''}">
                    </div>
                  </div>

                  <div class="alert alert-info text-xs mt-2">
                    <i data-lucide="shield-check" class="icon-xs"></i>
                    <span>Tên đăng nhập, vai trò và phòng ban được quản lý bởi HR/Quản trị viên. Liên hệ bộ phận nhân sự nếu cần thay đổi.</span>
                  </div>

                  <div class="flex justify-end gap-2 mt-3">
                    <button type="submit" class="btn btn-primary">
                      <i data-lucide="save" class="icon-sm"></i> Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init() {
      document.getElementById('form-profile-update')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = ATSStore.getCurrentUser();
        if (!user) return;

        const fd = new FormData(e.target);
        const result = ATSStore.updateUser(user.id, {
          fullName: fd.get('fullName'),
          title: fd.get('title'),
          email: fd.get('email'),
          phone: fd.get('phone')
        });

        if (!result.success) {
          UI.toast({ message: result.message, type: 'warning' });
          return;
        }

        UI.toast({ message: 'Đã cập nhật hồ sơ cá nhân.', type: 'success' });
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
          mainContent.innerHTML = this.render();
          this.init();
          if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
      });

      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }
  };
})();
