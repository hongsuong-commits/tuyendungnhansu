/**
 * Layout - Main application layout for ATS System
 * Provides sidebar navigation, header with notifications/user dropdown,
 * and responsive mobile support.
 */
const Layout = (() => {
  // ─── Navigation Configuration ───────────────────────────────────────
  const NAV_ITEMS = [
    { id: 'dashboard', icon: 'home', label: 'Tổng quan', href: '#/dashboard' },
    { id: 'requisitions', icon: 'file-text', label: 'Yêu cầu tuyển dụng', href: '#/requisitions' },
    { id: 'postings', icon: 'briefcase', label: 'Vị trí & tin tuyển dụng', href: '#/postings' },
    { id: 'candidates', icon: 'users', label: 'Danh sách ứng viên', href: '#/candidates' },
    { id: 'screening', icon: 'scan-search', label: 'Sàng lọc CV', href: '#/screening' },
    { id: 'interviews', icon: 'calendar', label: 'Lịch phỏng vấn', href: '#/interviews' },
    { id: 'evaluations', icon: 'clipboard-check', label: 'Đánh giá ứng viên', href: '#/evaluations' },
    { id: 'reports', icon: 'bar-chart-3', label: 'Báo cáo tuyển dụng', href: '#/reports' },
    { id: 'users', icon: 'shield', label: 'Quản lý người dùng', href: '#/users', roles: ['hr'] },
    { id: 'settings', icon: 'settings', label: 'Cài đặt', href: '#/settings' },
  ];

  // ─── Role-based visible items ───────────────────────────────────────
  const ROLE_NAV_MAP = {
    director: ['dashboard', 'requisitions', 'postings', 'candidates', 'screening', 'interviews', 'evaluations', 'reports'],
    department_head: ['dashboard', 'requisitions', 'candidates', 'interviews', 'evaluations', 'reports'],
    hr: ['dashboard', 'requisitions', 'postings', 'candidates', 'screening', 'interviews', 'evaluations', 'reports', 'users', 'settings'],
  };

  let _sidebarCollapsed = false;
  let _mobileMenuOpen = false;

  /**
   * Get navigation items filtered by current user's role
   */
  function getNavItemsForRole(role) {
    const allowedIds = ROLE_NAV_MAP[role];
    if (!allowedIds) return [];
    return NAV_ITEMS.filter(item => allowedIds.includes(item.id));
  }

  /**
   * Get user initials from full name for avatar
   */
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get active route from current hash
   */
  function getActiveRoute() {
    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace(/^#\/?/, '').split('/')[0];
    return path || 'dashboard';
  }

  return {
    /**
     * Render the full application layout
     * If user is not logged in, just returns the content without layout wrapper
     */
    render(contentHtml) {
      const currentUser = typeof ATSStore !== 'undefined' ? ATSStore.getCurrentUser() : null;

      if (!currentUser) {
        return contentHtml;
      }

      // Candidates use portal, not the main layout
      if (currentUser.role === 'candidate') {
        return contentHtml;
      }

      const collapsedClass = _sidebarCollapsed ? 'sidebar-collapsed' : '';
      const mobileClass = _mobileMenuOpen ? 'mobile-menu-open' : '';

      return `
        <div class="app-layout ${collapsedClass} ${mobileClass}">
          <aside class="sidebar" id="sidebar">
            ${this.renderSidebar(currentUser)}
          </aside>
          <div class="sidebar-overlay" id="sidebarOverlay"></div>
          <div class="main-wrapper">
            <header class="app-header" id="appHeader">
              ${this.renderHeader(currentUser)}
            </header>
            <main class="main-content" id="mainContent">
              ${contentHtml}
            </main>
          </div>
        </div>
      `;
    },

    /**
     * Render sidebar with navigation items filtered by role
     */
    renderSidebar(currentUser) {
      const role = currentUser.role;
      const navItems = getNavItemsForRole(role);
      const activeRoute = getActiveRoute();
      const roleLabel = Helpers.getRoleLabel(role);
      const initials = getInitials(currentUser.fullName || currentUser.username);

      const navHtml = navItems.map(item => {
        const isActive = activeRoute === item.id;
        const activeClass = isActive ? 'nav-item-active' : '';
        return `
          <li class="nav-item ${activeClass}">
            <a href="${item.href}" class="nav-link" data-nav-id="${item.id}" title="${item.label}">
              <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
              <span class="nav-label">${item.label}</span>
            </a>
          </li>
        `;
      }).join('');

      return `
        <div class="sidebar-header">
          <a href="#/dashboard" class="sidebar-logo">
            <span class="logo-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="4.2" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.8" cy="10" r="1.5" /><path d="M5.9 10h2.6M11.7 10h2.6" /></svg>
            </span>
            <span class="logo-text">SmartATS<span class="logo-scope">Tuyển dụng</span></span>
          </a>
        </div>

        <nav class="sidebar-nav">
          <ul class="nav-list">
            ${navHtml}
          </ul>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user-info">
            <div class="sidebar-user-avatar" title="${currentUser.fullName || currentUser.username}">
              ${initials}
            </div>
            <div class="sidebar-user-details">
              <div class="sidebar-user-name">${Helpers.truncate(currentUser.fullName || currentUser.username, 20)}</div>
              <div class="sidebar-user-role">${roleLabel}</div>
            </div>
          </div>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="${_sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'} thanh bên">
            <i data-lucide="${_sidebarCollapsed ? 'chevrons-right' : 'chevrons-left'}"></i>
          </button>
        </div>
      `;
    },

    /**
     * Render header with search, notifications, and user dropdown
     */
    renderHeader(currentUser) {
      const roleLabel = Helpers.getRoleLabel(currentUser.role);
      const initials = getInitials(currentUser.fullName || currentUser.username);
      const activeRoute = getActiveRoute();

      // Get unread notification count
      let unreadCount = 0;
      if (typeof ATSStore !== 'undefined' && ATSStore.getUnreadCount) {
        unreadCount = ATSStore.getUnreadCount();
      }

      const unreadBadge = unreadCount > 0
        ? `<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>`
        : '';

      // Page title mapping
      const PAGE_TITLES = {
        dashboard: 'Tổng quan',
        requisitions: 'Yêu cầu tuyển dụng',
        postings: 'Vị trí & tin tuyển dụng',
        candidates: 'Danh sách ứng viên',
        screening: 'Sàng lọc CV',
        interviews: 'Lịch phỏng vấn',
        evaluations: 'Đánh giá ứng viên',
        reports: 'Báo cáo tuyển dụng',
        users: 'Quản lý người dùng',
        settings: 'Cài đặt',
      };

      const pageTitle = PAGE_TITLES[activeRoute] || 'SmartATS';

      // Get notifications for dropdown
      let notifications = [];
      if (typeof ATSStore !== 'undefined' && ATSStore.getNotifications) {
        notifications = ATSStore.getNotifications().slice(0, 5);
      }

      const notificationsHtml = notifications.length > 0
        ? notifications.map(n => `
          <div class="notification-item ${n.read ? '' : 'notification-unread'} cursor-pointer" data-notification-id="${n.id}" data-link="${n.link || '#/dashboard'}" style="cursor: pointer;">
            <div class="notification-icon-wrap">
              <i data-lucide="${n.icon || 'bell'}"></i>
            </div>
            <div class="notification-content">
              <div class="notification-text">${Helpers.truncate(n.message || n.title || '', 60)}</div>
              <div class="notification-time">${Helpers.formatRelativeTime(n.createdAt || n.date)}</div>
            </div>
          </div>
        `).join('')
        : '<div class="notification-empty"><i data-lucide="inbox"></i><span>Không có thông báo mới</span></div>';

      return `
        <div class="header-left">
          <button class="header-hamburger" id="headerSidebarToggle" title="Mở thanh điều hướng" aria-label="Mở thanh điều hướng">
            <i data-lucide="menu"></i>
          </button>
        </div>

        <div class="header-center">
          <div class="header-search">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="header-search-input" id="headerSearchInput" placeholder="Tìm kiếm ứng viên, yêu cầu..." autocomplete="off">
          </div>
        </div>

        <div class="header-right">
          <button id="dbSyncStatus" type="button"
                  title="Trạng thái lưu trữ dữ liệu"
                  style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #d7e4f1;border-radius:999px;background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#163a5f;white-space:nowrap;">
            <span id="dbSyncDot" style="width:8px;height:8px;border-radius:50%;background:#d97706;display:inline-block;"></span>
            <span id="dbSyncText">Đang kết nối…</span>
          </button>

          <div class="header-notification" id="headerNotification">
            <button class="header-icon-btn notification-btn" id="notificationToggle" title="Thông báo">
              <i data-lucide="bell"></i>
              ${unreadBadge}
            </button>
            <div class="dropdown-menu notification-dropdown" id="notificationDropdown">
              <div class="dropdown-header">
                <span class="dropdown-title">Thông báo</span>
                ${unreadCount > 0 ? '<button class="mark-all-read-btn" id="markAllReadBtn">Đánh dấu đã đọc</button>' : ''}
              </div>
              <div class="notification-list">
                ${notificationsHtml}
              </div>
              ${notifications.length > 0 ? '<div class="dropdown-footer"><a href="#/notifications" class="view-all-link">Xem tất cả thông báo</a></div>' : ''}
            </div>
          </div>

          <div class="header-user" id="headerUser">
            <button class="header-user-btn" id="userDropdownToggle">
              <div class="header-user-avatar">${initials}</div>
              <div class="header-user-info">
                <span class="header-user-name">${currentUser.fullName || currentUser.username}</span>
                <span class="header-user-role">${roleLabel}</span>
              </div>
              <i data-lucide="chevron-down" class="user-chevron"></i>
            </button>
            <div class="dropdown-menu user-dropdown" id="userDropdown">
              <div class="dropdown-user-header">
                <div class="dropdown-user-avatar">${initials}</div>
                <div>
                  <div class="dropdown-user-name">${currentUser.fullName || currentUser.username}</div>
                  <div class="dropdown-user-role">${roleLabel}</div>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <a href="#/profile" class="dropdown-item" data-action="profile">
                <i data-lucide="user"></i>
                <span>Hồ sơ cá nhân</span>
              </a>
              <a href="#/settings" class="dropdown-item" data-action="settings">
                <i data-lucide="settings"></i>
                <span>Cài đặt</span>
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item dropdown-item-danger" data-action="logout" id="logoutBtn">
                <i data-lucide="log-out"></i>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Toggle sidebar collapsed/expanded state
     */
    toggleSidebar() {
      _sidebarCollapsed = !_sidebarCollapsed;
      const appLayout = document.querySelector('.app-layout');
      if (appLayout) {
        appLayout.classList.toggle('sidebar-collapsed', _sidebarCollapsed);
      }
      // Update collapse button icon
      const collapseBtn = document.getElementById('sidebarCollapseBtn');
      if (collapseBtn) {
        const icon = collapseBtn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', _sidebarCollapsed ? 'chevrons-right' : 'chevrons-left');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        collapseBtn.title = _sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
      }
      // Persist state
      localStorage.setItem('ats_sidebar_collapsed', _sidebarCollapsed ? '1' : '0');
    },

    /**
     * Toggle mobile menu open/closed
     */
    toggleMobileMenu() {
      _mobileMenuOpen = !_mobileMenuOpen;
      const appLayout = document.querySelector('.app-layout');
      if (appLayout) {
        appLayout.classList.toggle('mobile-menu-open', _mobileMenuOpen);
      }
      document.body.style.overflow = _mobileMenuOpen ? 'hidden' : '';
    },

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
      if (_mobileMenuOpen) {
        _mobileMenuOpen = false;
        const appLayout = document.querySelector('.app-layout');
        if (appLayout) {
          appLayout.classList.remove('mobile-menu-open');
        }
        document.body.style.overflow = '';
      }
    },

    /**
     * Close all open dropdowns
     */
    closeAllDropdowns() {
      const dropdowns = document.querySelectorAll('.dropdown-menu');
      dropdowns.forEach(dd => dd.classList.remove('dropdown-open'));
    },

    /**
     * Toggle a specific dropdown while ensuring mutual exclusion
     */
    toggleDropdown(type) {
      const notificationDropdown = document.getElementById('notificationDropdown');
      const userDropdown = document.getElementById('userDropdown');

      if (type === 'notification') {
        if (userDropdown) userDropdown.classList.remove('dropdown-open');
        if (notificationDropdown) {
          const isOpen = notificationDropdown.classList.contains('dropdown-open');
          notificationDropdown.classList.toggle('dropdown-open', !isOpen);
        }
      } else if (type === 'user') {
        if (notificationDropdown) notificationDropdown.classList.remove('dropdown-open');
        if (userDropdown) {
          const isOpen = userDropdown.classList.contains('dropdown-open');
          userDropdown.classList.toggle('dropdown-open', !isOpen);
        }
      }

      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      });
    },

    /**
     * Initialize all event listeners for the layout
     * Must be called after render
     */
    initEventListeners() {
      // Ensure all dropdowns start closed
      this.closeAllDropdowns();

      // ── Chỉ báo trạng thái lưu trữ (PostgreSQL / bản đệm cục bộ) ──
      const syncBadge = document.getElementById('dbSyncStatus');
      const syncDot = document.getElementById('dbSyncDot');
      const syncText = document.getElementById('dbSyncText');

      const paintSyncStatus = () => {
        if (!syncBadge || !syncDot || !syncText) return;
        if (typeof ATSStore === 'undefined' || !ATSStore.getSyncStatus) return;
        const status = ATSStore.getSyncStatus();
        if (status.mode === 'server') {
          const sending = status.pending;
          syncText.textContent = sending ? 'CSDL · đang gửi' : 'CSDL đã lưu';
          syncDot.style.background = sending ? '#d97706' : '#16a34a';
          syncBadge.title = 'Dữ liệu đang lưu trên PostgreSQL (Supabase). Nhấn để đồng bộ lại.';
        } else {
          syncText.textContent = 'Chưa kết nối CSDL';
          syncDot.style.background = '#dc2626';
          syncBadge.title = 'Chưa kết nối được database — đang dùng bản đệm cục bộ. Nhấn để thử lại.';
        }
      };

      paintSyncStatus();
      if (window._dbSyncStatusTimer) clearInterval(window._dbSyncStatusTimer);
      window._dbSyncStatusTimer = setInterval(paintSyncStatus, 3000);

      if (syncBadge) {
        syncBadge.addEventListener('click', async () => {
          if (syncText) syncText.textContent = 'Đang kiểm tra…';
          try {
            const status = typeof ATSStore.syncNow === 'function'
              ? await ATSStore.syncNow()
              : ATSStore.getSyncStatus();
            paintSyncStatus();
            if (typeof UI !== 'undefined' && UI.toast) {
              UI.toast({
                message: status.mode === 'server'
                  ? 'Đã kết nối database và đồng bộ dữ liệu.'
                  : ('Chưa kết nối được database: ' + (status.lastError || 'lỗi mạng')),
                type: status.mode === 'server' ? 'success' : 'warning'
              });
            }
          } catch (err) {
            paintSyncStatus();
            if (typeof UI !== 'undefined' && UI.toast) {
              UI.toast({ message: 'Kiểm tra kết nối thất bại: ' + err.message, type: 'error' });
            }
          }
        });
      }

      // Restore sidebar state from localStorage
      const savedState = localStorage.getItem('ats_sidebar_collapsed');
      if (savedState === '1') {
        _sidebarCollapsed = true;
        const appLayout = document.querySelector('.app-layout');
        if (appLayout) appLayout.classList.add('sidebar-collapsed');
      }

      // ── Sidebar collapse toggle (Footer button) ───────────────────
      const collapseBtn = document.getElementById('sidebarCollapseBtn');
      if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSidebar();
        });
      }

      // ── Sidebar toggle / Mobile menu toggle (Header button) ──────
      const headerSidebarToggle = document.getElementById('headerSidebarToggle') || document.getElementById('mobileMenuToggle');
      if (headerSidebarToggle) {
        headerSidebarToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Keep this in sync with the drawer breakpoint in design.css (860px)
          if (window.innerWidth <= 860) {
            this.toggleMobileMenu();
          } else {
            this.toggleSidebar();
          }
        });
      }

      // ── Sidebar overlay (mobile) ─────────────────────────────────
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      }

      // ── Notification dropdown toggle ─────────────────────────────
      const notificationToggle = document.getElementById('notificationToggle');
      if (notificationToggle) {
        notificationToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDropdown('notification');
        });
      }

      // ── Mark all notifications as read ───────────────────────────
      const markAllBtn = document.getElementById('markAllReadBtn');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof ATSStore !== 'undefined' && ATSStore.markAllNotificationsRead) {
            ATSStore.markAllNotificationsRead();
          }
          // Update badge
          const badge = document.querySelector('.notification-badge');
          if (badge) badge.remove();
          // Mark items as read visually
          document.querySelectorAll('.notification-unread').forEach(el => {
            el.classList.remove('notification-unread');
          });
          markAllBtn.remove();
        });
      }

      // ── Notification item click to navigate ─────────────────────
      document.querySelectorAll('.notification-item[data-link]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const notifId = item.getAttribute('data-notification-id');
          const link = item.getAttribute('data-link');
          if (typeof ATSStore !== 'undefined' && ATSStore.markNotificationRead) {
            ATSStore.markNotificationRead(notifId);
          }
          item.classList.remove('notification-unread');
          const unreadCount = typeof ATSStore !== 'undefined' && ATSStore.getUnreadCount ? ATSStore.getUnreadCount() : 0;
          const badge = document.querySelector('.notification-badge');
          if (badge) {
            if (unreadCount <= 0) badge.remove();
            else badge.textContent = unreadCount;
          }
          this.closeAllDropdowns();
          if (link) {
            Router.navigate(link);
          }
        });
      });

      // ── User dropdown toggle ─────────────────────────────────────
      const userToggle = document.getElementById('userDropdownToggle');
      if (userToggle) {
        userToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDropdown('user');
        });
      }

      // ── Logout button ────────────────────────────────────────────
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof ATSStore !== 'undefined' && ATSStore.logout) {
            ATSStore.logout();
          }
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Đã đăng xuất thành công', 'success');
          }
          Router.navigate('login');
        });
      }

      // ── Global click outside and escape listeners (Attached only once) ──
      if (!window._layoutGlobalListenersAttached) {
        window._layoutGlobalListenersAttached = true;
        document.addEventListener('click', (e) => {
          const isInsideNotif = e.target.closest('#headerNotification');
          const isInsideUser = e.target.closest('#headerUser');
          if (!isInsideNotif && !isInsideUser) {
            const dropdowns = document.querySelectorAll('.dropdown-menu.dropdown-open');
            dropdowns.forEach(dd => dd.classList.remove('dropdown-open'));
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const dropdowns = document.querySelectorAll('.dropdown-menu.dropdown-open');
            dropdowns.forEach(dd => dd.classList.remove('dropdown-open'));
          }
        });
      }

      // ── Sidebar navigation clicks (close mobile menu on nav) ────
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.addEventListener('click', (e) => {
          const navLink = e.target.closest('.nav-link');
          if (navLink) {
            // Close mobile menu when nav item is clicked
            this.closeMobileMenu();
            // Update active state immediately
            document.querySelectorAll('.nav-item').forEach(item => {
              item.classList.remove('nav-item-active');
            });
            const parentLi = navLink.closest('.nav-item');
            if (parentLi) parentLi.classList.add('nav-item-active');
          }
        });
      }

      // ── Header search ────────────────────────────────────────────
      const searchInput = document.getElementById('headerSearchInput');
      if (searchInput) {
        const debouncedSearch = Helpers.debounce((query) => {
          if (query.trim()) {
            Router.navigate('candidates', { search: query.trim() });
          }
        }, 500);

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (q) {
              Router.navigate('candidates', { search: q });
            }
          }
        });

        searchInput.addEventListener('input', (e) => {
          debouncedSearch(e.target.value);
        });
      }
    },

    /**
     * Update the notification badge count without re-rendering
     */
    updateNotificationBadge() {
      let unreadCount = 0;
      if (typeof ATSStore !== 'undefined' && ATSStore.getUnreadCount) {
        unreadCount = ATSStore.getUnreadCount();
      }
      const btn = document.querySelector('.notification-btn');
      if (!btn) return;
      let badge = btn.querySelector('.notification-badge');
      if (unreadCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notification-badge';
          btn.appendChild(badge);
        }
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      } else if (badge) {
        badge.remove();
      }
    },

    /**
     * Update the active nav item without re-rendering
     */
    updateActiveNav() {
      const activeRoute = getActiveRoute();
      document.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        const navId = link ? link.getAttribute('data-nav-id') : '';
        item.classList.toggle('nav-item-active', navId === activeRoute);
      });
    },
  };
})();
