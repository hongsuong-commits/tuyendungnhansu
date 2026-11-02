/**
 * notifications.js - Trung tâm thông báo nội bộ
 * Hiển thị toàn bộ thông báo, đánh dấu đã đọc và điều hướng tới đối tượng liên quan.
 */

const NotificationsPage = (() => {
  let _filter = 'all';

  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const all = (ATSStore.getNotificationsForUser)
        ? ATSStore.getNotificationsForUser(user.role)
        : ATSStore.getNotifications();
      const unreadCount = all.filter(n => !n.read).length;
      const notifications = _filter === 'unread' ? all.filter(n => !n.read) : all;

      const sorted = [...notifications].sort((a, b) => {
        const da = new Date(a.date || a.createdAt || 0).getTime();
        const db = new Date(b.date || b.createdAt || 0).getTime();
        return db - da;
      });

      return `
        <div class="page-container">
          <div class="page-header mb-4">
            <div>
              <h1 class="page-title">Trung tâm thông báo</h1>
              <p class="page-subtitle">Theo dõi hồ sơ mới, lịch phỏng vấn, kết quả sàng lọc AI và các cập nhật tuyển dụng</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-outline" id="btn-mark-all-notifications" ${unreadCount === 0 ? 'disabled' : ''}>
                <i data-lucide="check-check" class="icon-sm"></i> Đánh dấu tất cả đã đọc
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">${notifications.length} thông báo</span>
                ${unreadCount > 0 ? `<span class="badge badge-primary text-xs">${unreadCount} chưa đọc</span>` : '<span class="badge badge-secondary text-xs">Đã đọc tất cả</span>'}
              </div>
              <div class="filter-group">
                <label class="filter-label">Hiển thị:</label>
                <select id="notification-filter" class="form-select">
                  <option value="all" ${_filter === 'all' ? 'selected' : ''}>Tất cả thông báo</option>
                  <option value="unread" ${_filter === 'unread' ? 'selected' : ''}>Chỉ chưa đọc</option>
                </select>
              </div>
            </div>
            <div class="card-body card-body-no-padding">
              ${sorted.length === 0 ? `
                <div class="empty-state">
                  <i data-lucide="inbox" class="empty-state-icon"></i>
                  <h3 class="empty-state-title">Không có thông báo</h3>
                  <p class="empty-state-description">${_filter === 'unread' ? 'Bạn đã đọc hết thông báo.' : 'Các cập nhật tuyển dụng mới sẽ xuất hiện tại đây.'}</p>
                </div>
              ` : `
                <div class="notification-page-list">
                  ${sorted.map(n => `
                    <div class="notification-page-item ${n.read ? '' : 'notification-page-unread'}" data-notification-id="${n.id}" data-link="${n.link || ''}">
                      <div class="notification-icon-wrap">
                        <i data-lucide="${n.icon || 'bell'}"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="text-sm font-semibold">${n.title || 'Thông báo'}</div>
                            <div class="text-xs text-muted mt-0.5 leading-relaxed">${n.message || ''}</div>
                          </div>
                          <div class="text-2xs text-muted whitespace-nowrap">${Helpers.formatRelativeTime(n.date || n.createdAt)}</div>
                        </div>
                        <div class="flex items-center gap-2 mt-2">
                          ${n.read ? '<span class="badge badge-secondary text-2xs">Đã đọc</span>' : '<span class="badge badge-primary text-2xs">Chưa đọc</span>'}
                          ${n.link ? `<button class="btn btn-xs btn-outline btn-open-notification" data-id="${n.id}" data-link="${n.link}">Xem chi tiết</button>` : ''}
                          ${!n.read ? `<button class="btn btn-xs btn-secondary btn-read-notification" data-id="${n.id}">Đánh dấu đã đọc</button>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    },

    init() {
      document.getElementById('notification-filter')?.addEventListener('change', (e) => {
        _filter = e.target.value;
        this.refresh();
      });

      document.getElementById('btn-mark-all-notifications')?.addEventListener('click', () => {
        ATSStore.markAllNotificationsRead();
        UI.toast({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.', type: 'success' });
        this.refresh();
      });

      document.querySelectorAll('.btn-read-notification').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          ATSStore.markNotificationRead(btn.getAttribute('data-id'));
          this.refresh();
        });
      });

      document.querySelectorAll('.btn-open-notification').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const link = btn.getAttribute('data-link') || '';
          ATSStore.markNotificationRead(id);
          if (link) {
            window.location.hash = link.replace(/^#/, '');
          } else {
            this.refresh();
          }
        });
      });

      document.querySelectorAll('.notification-page-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          const id = item.getAttribute('data-notification-id');
          const link = item.getAttribute('data-link');
          ATSStore.markNotificationRead(id);
          if (link) {
            window.location.hash = link.replace(/^#/, '');
          } else {
            this.refresh();
          }
        });
      });

      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = this.render();
        this.init();
      }
    }
  };
})();
