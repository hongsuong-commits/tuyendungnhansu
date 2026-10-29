/**
 * router.js - Client-side Router & App Shell Renderer
 * Core rendering engine for the ATS SPA application.
 * Handles page navigation, layout rendering, modals, toasts, and loading states.
 */

// ============================================================
// 1. Router Class
// ============================================================
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
        this.currentParams = {};
        this.beforeNavigate = null; // Hook for auth check
        this._hashChangeHandler = null;
    }

    /**
     * Register a page with its render function
     * @param {string} pageId - Unique page identifier
     * @param {Function} renderFunction - Function that returns HTML or renders into container
     */
    register(pageId, renderFunction) {
        this.routes[pageId] = renderFunction;
    }

    /**
     * Navigate to a page
     * @param {string} pageId - Target page identifier
     * @param {Object} params - Parameters to pass to the page
     */
    navigate(pageId, params = {}) {
        // Run beforeNavigate hook (auth check)
        if (this.beforeNavigate) {
            const result = this.beforeNavigate(pageId, params);
            if (result === false) return;
            // Hook can return a redirect object { redirect: 'pageId' }
            if (result && result.redirect) {
                pageId = result.redirect;
                params = result.params || {};
            }
        }

        const renderFn = this.routes[pageId];
        if (!renderFn) {
            console.warn(`[Router] Page not found: ${pageId}`);
            // Try to render a 404-like state
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;">
                        <h1 style="font-size:48px;color:#1E3A5F;margin-bottom:16px;">404</h1>
                        <p style="color:#64748B;margin-bottom:24px;">Trang không tồn tại</p>
                        <button onclick="window.Router.navigate('login')" style="padding:10px 24px;background:#2563EB;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">
                            Quay lại
                        </button>
                    </div>`;
            }
            return;
        }

        this.currentPage = pageId;
        this.currentParams = params;

        // Update hash without triggering hashchange
        const hashStr = params && Object.keys(params).length > 0
            ? `#${pageId}?${new URLSearchParams(params).toString()}`
            : `#${pageId}`;
        if (window.location.hash !== hashStr) {
            history.pushState(null, '', hashStr);
        }

        // Execute the render function
        try {
            renderFn(params);
        } catch (err) {
            console.error(`[Router] Error rendering page "${pageId}":`, err);
        }
    }

    /**
     * Get current page id
     * @returns {string|null}
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Get current page params
     * @returns {Object}
     */
    getParams() {
        return { ...this.currentParams };
    }

    /**
     * Parse the current hash into pageId and params
     * @returns {{ pageId: string, params: Object }}
     */
    _parseHash() {
        const hash = window.location.hash.slice(1); // remove #
        if (!hash) return { pageId: 'login', params: {} };

        const [pageId, queryStr] = hash.split('?');
        const params = {};
        if (queryStr) {
            const sp = new URLSearchParams(queryStr);
            sp.forEach((value, key) => {
                params[key] = value;
            });
        }
        return { pageId: pageId || 'login', params };
    }

    /**
     * Initialize the router
     */
    init() {
        // Handle browser back/forward
        this._hashChangeHandler = () => {
            const { pageId, params } = this._parseHash();
            this.navigate(pageId, params);
        };
        window.addEventListener('hashchange', this._hashChangeHandler);

        // Render initial page
        const { pageId, params } = this._parseHash();
        this.navigate(pageId, params);
    }
}

// ============================================================
// 2. App Shell Renderer
// ============================================================
const AppShell = {
    _sidebarCollapsed: false,
    _mobileMenuOpen: false,
    _activeToasts: [],
    _toastCounter: 0,
    _currentModal: null,

    // ----------------------------------------------------------
    // Login Page
    // ----------------------------------------------------------
    renderLoginPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
        <div class="login-page">
            <div class="login-bg"></div>
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <div class="login-logo-icon">ATS</div>
                        <div class="login-logo-subtitle">Hệ thống Quản lý Tuyển dụng</div>
                    </div>
                    <form class="login-form" id="loginForm" autocomplete="off">
                        <div class="login-error" id="loginError" style="display:none;">
                            <span class="login-error-icon">⚠️</span>
                            <span class="login-error-text" id="loginErrorText"></span>
                        </div>
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <div class="input-wrapper">
                                <span class="input-icon">📧</span>
                                <input type="email" id="loginEmail" name="email" placeholder="Nhập email của bạn" required autocomplete="username" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Mật khẩu</label>
                            <div class="input-wrapper">
                                <span class="input-icon">🔒</span>
                                <input type="password" id="loginPassword" name="password" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
                                <button type="button" class="password-toggle" id="passwordToggle" tabindex="-1" title="Hiện/ẩn mật khẩu">
                                    <span id="passwordToggleIcon">👁️</span>
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-login" id="loginBtn">
                            <span class="btn-text">Đăng nhập</span>
                            <span class="btn-loading" style="display:none;">
                                <span class="spinner-sm"></span> Đang xử lý...
                            </span>
                        </button>
                    </form>
                    <div class="login-demo">
                        <div class="login-demo-title">Tài khoản demo</div>
                        <div class="login-demo-accounts">
                            <div class="demo-account" data-email="giamdoc@company.vn">
                                <span class="demo-role">Giám đốc</span>
                                <span class="demo-email">giamdoc@company.vn</span>
                            </div>
                            <div class="demo-account" data-email="truongphong@company.vn">
                                <span class="demo-role">Trưởng phòng</span>
                                <span class="demo-email">truongphong@company.vn</span>
                            </div>
                            <div class="demo-account" data-email="nhansu@company.vn">
                                <span class="demo-role">Nhân sự</span>
                                <span class="demo-email">nhansu@company.vn</span>
                            </div>
                            <div class="demo-account" data-email="ungvien@company.vn">
                                <span class="demo-role">Ứng viên</span>
                                <span class="demo-email">ungvien@company.vn</span>
                            </div>
                        </div>
                        <div class="login-demo-password">Mật khẩu: <strong>demo123</strong></div>
                        <div class="login-demo-note">Đây là phiên bản demo. Dữ liệu được lưu trong localStorage.</div>
                    </div>
                </div>
            </div>
        </div>`;

        // --- Event bindings ---
        this._bindLoginEvents();
    },

    /**
     * Bind login page events
     */
    _bindLoginEvents() {
        const form = document.getElementById('loginForm');
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const passwordToggle = document.getElementById('passwordToggle');
        const loginError = document.getElementById('loginError');
        const loginErrorText = document.getElementById('loginErrorText');

        // Password show/hide toggle
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => {
                const icon = document.getElementById('passwordToggleIcon');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    icon.textContent = '👁️';
                }
            });
        }

        // Demo account click
        document.querySelectorAll('.demo-account').forEach(el => {
            el.addEventListener('click', () => {
                const email = el.getAttribute('data-email');
                if (emailInput) emailInput.value = email;
                if (passwordInput) passwordInput.value = 'demo123';
                // Clear error
                if (loginError) loginError.style.display = 'none';
            });
        });

        // Form submit
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = emailInput ? emailInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value : '';

                // Clear previous error
                if (loginError) loginError.style.display = 'none';

                // Validation
                if (!email) {
                    this._showLoginError('Vui lòng nhập email.');
                    emailInput && emailInput.focus();
                    return;
                }
                if (!this._isValidEmail(email)) {
                    this._showLoginError('Email không hợp lệ.');
                    emailInput && emailInput.focus();
                    return;
                }
                if (!password) {
                    this._showLoginError('Vui lòng nhập mật khẩu.');
                    passwordInput && passwordInput.focus();
                    return;
                }
                if (password.length < 4) {
                    this._showLoginError('Mật khẩu phải có ít nhất 4 ký tự.');
                    passwordInput && passwordInput.focus();
                    return;
                }

                // Show loading
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.querySelector('.btn-text').style.display = 'none';
                    loginBtn.querySelector('.btn-loading').style.display = 'inline-flex';
                }

                // Simulate login delay for UX
                setTimeout(() => {
                    try {
                        if (window.AuthManager && typeof window.AuthManager.login === 'function') {
                            const result = window.AuthManager.login(email, password);
                            if (result.success) {
                                AppShell.showToast('Đăng nhập thành công!', 'success');
                                const user = result.user || (window.AuthManager.getCurrentUser ? window.AuthManager.getCurrentUser() : null);
                                // Redirect based on role
                                if (user && user.role === 'candidate') {
                                    window.Router.navigate('portal-jobs');
                                } else {
                                    window.Router.navigate('dashboard');
                                }
                            } else {
                                this._showLoginError(result.message || 'Email hoặc mật khẩu không đúng.');
                                this._resetLoginButton();
                            }
                        } else {
                            this._showLoginError('Hệ thống chưa sẵn sàng. Vui lòng thử lại.');
                            this._resetLoginButton();
                        }
                    } catch (err) {
                        console.error('[Login] Error:', err);
                        this._showLoginError('Đã xảy ra lỗi. Vui lòng thử lại.');
                        this._resetLoginButton();
                    }
                }, 600);
            });
        }
    },

    _showLoginError(message) {
        const loginError = document.getElementById('loginError');
        const loginErrorText = document.getElementById('loginErrorText');
        if (loginError && loginErrorText) {
            loginErrorText.textContent = message;
            loginError.style.display = 'flex';
        }
    },

    _resetLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            const btnText = loginBtn.querySelector('.btn-text');
            const btnLoading = loginBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    },

    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // ----------------------------------------------------------
    // Portal Layout (for candidates)
    // ----------------------------------------------------------
    renderPortalLayout(content) {
        const app = document.getElementById('app');
        const user = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
        const isLoggedIn = user !== null;

        app.innerHTML = `
        <div class="portal-layout">
            <header class="portal-header">
                <div class="portal-header-inner">
                    <div class="portal-logo" onclick="window.Router.navigate('portal-jobs')">
                        <span class="portal-logo-icon">ATS</span>
                        <span class="portal-logo-text">Tuyển Dụng</span>
                    </div>
                    <nav class="portal-nav">
                        <a class="portal-nav-link ${window.Router.getCurrentPage() === 'portal-jobs' ? 'active' : ''}" 
                           onclick="window.Router.navigate('portal-jobs')">Việc làm</a>
                        ${isLoggedIn ? `
                            <a class="portal-nav-link ${window.Router.getCurrentPage() === 'portal-profile' ? 'active' : ''}" 
                               onclick="window.Router.navigate('portal-profile')">Hồ sơ của tôi</a>
                            <a class="portal-nav-link ${window.Router.getCurrentPage() === 'portal-applications' ? 'active' : ''}" 
                               onclick="window.Router.navigate('portal-applications')">Đơn ứng tuyển</a>
                            <div class="portal-user-menu">
                                <span class="portal-user-name">${this._escapeHtml(user.name || user.email)}</span>
                                <div class="portal-user-dropdown">
                                    <a onclick="window.Router.navigate('portal-profile')">Thông tin cá nhân</a>
                                    <a onclick="if(window.AuthManager){window.AuthManager.logout();} window.Router.navigate('login');">Đăng xuất</a>
                                </div>
                            </div>
                        ` : `
                            <a class="portal-nav-link" onclick="window.Router.navigate('login')">Đăng nhập</a>
                        `}
                    </nav>
                    <button class="portal-mobile-toggle" onclick="AppShell._togglePortalMobileMenu()">☰</button>
                </div>
                <div class="portal-mobile-nav" id="portalMobileNav" style="display:none;">
                    <a class="portal-nav-link" onclick="window.Router.navigate('portal-jobs'); AppShell._togglePortalMobileMenu();">Việc làm</a>
                    ${isLoggedIn ? `
                        <a class="portal-nav-link" onclick="window.Router.navigate('portal-profile'); AppShell._togglePortalMobileMenu();">Hồ sơ của tôi</a>
                        <a class="portal-nav-link" onclick="window.Router.navigate('portal-applications'); AppShell._togglePortalMobileMenu();">Đơn ứng tuyển</a>
                        <a class="portal-nav-link" onclick="if(window.AuthManager){window.AuthManager.logout();} window.Router.navigate('login');">Đăng xuất</a>
                    ` : `
                        <a class="portal-nav-link" onclick="window.Router.navigate('login')">Đăng nhập</a>
                    `}
                </div>
            </header>
            <main class="portal-content" id="pageContent">
                ${content || ''}
            </main>
            <footer class="portal-footer">
                <div class="portal-footer-inner">
                    <p>&copy; ${new Date().getFullYear()} ATS - Hệ thống Quản lý Tuyển dụng. Phiên bản demo.</p>
                </div>
            </footer>
        </div>`;
    },

    _togglePortalMobileMenu() {
        const nav = document.getElementById('portalMobileNav');
        if (nav) {
            nav.style.display = nav.style.display === 'none' ? 'block' : 'none';
        }
    },

    // ----------------------------------------------------------
    // Dashboard Layout (internal pages with sidebar + topbar)
    // ----------------------------------------------------------
    renderDashboardLayout(content) {
        const app = document.getElementById('app');
        const user = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
        const currentPage = window.Router.getCurrentPage();

        // Determine menu items based on role
        const menuItems = this._getMenuItemsForRole(user ? user.role : 'hr');

        const sidebarCollapsedClass = this._sidebarCollapsed ? ' collapsed' : '';

        app.innerHTML = `
        <div class="dashboard-layout${sidebarCollapsedClass}">
            ${this.renderSidebar(menuItems, currentPage)}
            <div class="dashboard-main">
                ${this.renderTopBar(user)}
                <main class="dashboard-content" id="pageContent">
                    ${content || ''}
                </main>
            </div>
            <div class="mobile-overlay" id="mobileOverlay" onclick="AppShell.hideMobileMenu()"></div>
        </div>`;

        // Bind sidebar & topbar events
        this._bindDashboardEvents();
    },

    /**
     * Get menu items based on user role
     */
    _getMenuItemsForRole(role) {
        const allItems = [
            { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
            { id: 'recruitment-requests', label: 'Yêu cầu tuyển dụng', icon: '📋' },
            { id: 'job-postings', label: 'Tin tuyển dụng', icon: '📢' },
            { id: 'candidates', label: 'Danh sách ứng viên', icon: '👥' },
            { id: 'cv-screening', label: 'Sàng lọc CV', icon: '🔍' },
            { id: 'interviews', label: 'Lịch phỏng vấn', icon: '📅' },
            { id: 'evaluations', label: 'Đánh giá ứng viên', icon: '⭐' },
            { id: 'reports', label: 'Báo cáo', icon: '📈' },
            { id: 'users', label: 'Quản lý người dùng', icon: '👤' },
            { id: 'settings', label: 'Cài đặt', icon: '⚙️' }
        ];

        // Filter based on role
        switch (role) {
            case 'director':
                return allItems;
            case 'manager':
                return allItems.filter(i => !['users'].includes(i.id));
            case 'hr':
                return allItems.filter(i => !['users', 'settings'].includes(i.id));
            default:
                return allItems.filter(i => !['users', 'settings', 'reports'].includes(i.id));
        }
    },

    /**
     * Render sidebar navigation
     */
    renderSidebar(menuItems, activePage) {
        const menuHtml = menuItems.map(item => {
            const isActive = activePage === item.id ? ' active' : '';
            return `
                <a class="sidebar-nav-item${isActive}" data-page="${item.id}" onclick="window.Router.navigate('${item.id}')" title="${item.label}">
                    <span class="sidebar-nav-icon">${item.icon}</span>
                    <span class="sidebar-nav-label">${item.label}</span>
                </a>`;
        }).join('');

        return `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo" onclick="window.Router.navigate('dashboard')">
                    <span class="sidebar-logo-icon">ATS</span>
                    <span class="sidebar-logo-text">Tuyển Dụng</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${menuHtml}
            </nav>
            <div class="sidebar-footer">
                <button class="sidebar-collapse-btn" onclick="AppShell.toggleSidebar()" title="Thu gọn menu">
                    <span class="collapse-icon" id="collapseIcon">◀</span>
                    <span class="sidebar-nav-label">Thu gọn</span>
                </button>
            </div>
        </aside>`;
    },

    /**
     * Render top bar
     */
    renderTopBar(user) {
        const userName = user ? (user.name || user.email) : 'Người dùng';
        const userRole = user ? this._getRoleLabel(user.role) : '';
        const userAvatar = user && user.name ? user.name.charAt(0).toUpperCase() : 'U';

        return `
        <header class="top-bar" id="topBar">
            <div class="top-bar-left">
                <button class="mobile-menu-toggle" onclick="AppShell.showMobileMenu()" title="Menu">☰</button>
                <div class="breadcrumb" id="breadcrumb"></div>
            </div>
            <div class="top-bar-right">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" placeholder="Tìm kiếm..." id="globalSearch" />
                </div>
                <div class="notification-bell" id="notificationBell" onclick="AppShell._handleNotificationClick()" title="Thông báo">
                    <span class="bell-icon">🔔</span>
                    <span class="badge" id="notificationBadge" style="display:none;">0</span>
                </div>
                <div class="user-menu" id="userMenu">
                    <div class="user-menu-trigger" onclick="AppShell._toggleUserMenu()">
                        <div class="user-avatar">${userAvatar}</div>
                        <div class="user-info">
                            <span class="user-name">${this._escapeHtml(userName)}</span>
                            <span class="user-role">${this._escapeHtml(userRole)}</span>
                        </div>
                        <span class="user-menu-arrow">▾</span>
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <a class="user-dropdown-item" onclick="window.Router.navigate('profile')">
                            <span>👤</span> Thông tin cá nhân
                        </a>
                        <a class="user-dropdown-item" onclick="window.Router.navigate('change-password')">
                            <span>🔑</span> Đổi mật khẩu
                        </a>
                        <div class="user-dropdown-divider"></div>
                        <a class="user-dropdown-item logout" onclick="AppShell._handleLogout()">
                            <span>🚪</span> Đăng xuất
                        </a>
                    </div>
                </div>
            </div>
        </header>`;
    },

    /**
     * Get Vietnamese role label
     */
    _getRoleLabel(role) {
        const labels = {
            director: 'Giám đốc',
            manager: 'Trưởng phòng',
            hr: 'Nhân sự',
            candidate: 'Ứng viên',
            interviewer: 'Phỏng vấn viên'
        };
        return labels[role] || role || '';
    },

    /**
     * Bind dashboard layout events
     */
    _bindDashboardEvents() {
        // Close user dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenu');
            if (userMenu && !userMenu.contains(e.target)) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });

        // Global search enter key
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.Router.navigate('candidates', { search: query });
                    }
                }
            });
        }
    },

    _toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },

    _handleNotificationClick() {
        // Placeholder for notification panel
        AppShell.showToast('Tính năng thông báo đang được phát triển.', 'info');
    },

    _handleLogout() {
        AppShell.showConfirmDialog(
            'Bạn có chắc chắn muốn đăng xuất?',
            () => {
                if (window.AuthManager && typeof window.AuthManager.logout === 'function') {
                    window.AuthManager.logout();
                }
                AppShell.showToast('Đã đăng xuất thành công.', 'success');
                window.Router.navigate('login');
            },
            { confirmText: 'Đăng xuất', type: 'warning' }
        );
    },

    // ----------------------------------------------------------
    // Sidebar Toggle
    // ----------------------------------------------------------
    toggleSidebar() {
        this._sidebarCollapsed = !this._sidebarCollapsed;
        const layout = document.querySelector('.dashboard-layout');
        if (layout) {
            layout.classList.toggle('collapsed', this._sidebarCollapsed);
        }
        const icon = document.getElementById('collapseIcon');
        if (icon) {
            icon.textContent = this._sidebarCollapsed ? '▶' : '◀';
        }
        // Persist preference
        try {
            localStorage.setItem('ats_sidebar_collapsed', this._sidebarCollapsed ? '1' : '0');
        } catch (e) { /* ignore */ }
    },

    // ----------------------------------------------------------
    // Mobile Menu
    // ----------------------------------------------------------
    showMobileMenu() {
        this._mobileMenuOpen = true;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.add('mobile-open');
        if (overlay) overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    hideMobileMenu() {
        this._mobileMenuOpen = false;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('show');
        document.body.style.overflow = '';
    },

    // ----------------------------------------------------------
    // Modal System
    // ----------------------------------------------------------
    /**
     * Show a modal dialog
     * @param {Object} options
     * @param {string} options.title - Modal title
     * @param {string} options.content - HTML content
     * @param {string} [options.size='default'] - 'sm' | 'default' | 'lg' | 'xl'
     * @param {Function} [options.onConfirm] - Confirm callback
     * @param {Function} [options.onCancel] - Cancel callback
     * @param {string} [options.confirmText='Xác nhận'] - Confirm button text
     * @param {string} [options.cancelText='Hủy'] - Cancel button text
     * @param {boolean} [options.showFooter=true] - Show footer buttons
     * @param {boolean} [options.closeOnBackdrop=true] - Close on backdrop click
     * @param {string} [options.confirmClass='btn-primary'] - Confirm button class
     */
    showModal(options = {}) {
        const {
            title = '',
            content = '',
            size = 'default',
            onConfirm = null,
            onCancel = null,
            confirmText = 'Xác nhận',
            cancelText = 'Hủy',
            showFooter = true,
            closeOnBackdrop = true,
            confirmClass = 'btn-primary'
        } = options;

        // Remove existing modal
        this.closeModal();

        const sizeClass = size !== 'default' ? ` modal-${size}` : '';

        const footerHtml = showFooter ? `
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel-btn" id="modalCancelBtn">${this._escapeHtml(cancelText)}</button>
                ${onConfirm ? `
                    <button class="btn ${confirmClass} modal-confirm-btn" id="modalConfirmBtn">
                        <span class="btn-text">${this._escapeHtml(confirmText)}</span>
                        <span class="btn-loading" style="display:none;"><span class="spinner-sm"></span></span>
                    </button>
                ` : ''}
            </div>
        ` : '';

        const modalHtml = `
        <div class="modal-backdrop" id="modalBackdrop">
            <div class="modal${sizeClass}" id="modalDialog" role="dialog" aria-modal="true">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" id="modalCloseBtn" title="Đóng">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    ${content}
                </div>
                ${footerHtml}
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';

        this._currentModal = { onConfirm, onCancel, closeOnBackdrop };

        // Animate in
        requestAnimationFrame(() => {
            const backdrop = document.getElementById('modalBackdrop');
            if (backdrop) backdrop.classList.add('show');
        });

        // Bind events
        const closeBtn = document.getElementById('modalCloseBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const backdrop = document.getElementById('modalBackdrop');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.closeModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.closeModal();
            });
        }

        if (confirmBtn && onConfirm) {
            confirmBtn.addEventListener('click', () => {
                // Show loading state
                const btnText = confirmBtn.querySelector('.btn-text');
                const btnLoading = confirmBtn.querySelector('.btn-loading');
                if (btnText) btnText.style.display = 'none';
                if (btnLoading) btnLoading.style.display = 'inline-flex';
                confirmBtn.disabled = true;

                const result = onConfirm();
                // If the callback returns a promise, wait for it
                if (result && typeof result.then === 'function') {
                    result.then(() => {
                        this.closeModal();
                    }).catch(() => {
                        // Reset button on error
                        if (btnText) btnText.style.display = 'inline';
                        if (btnLoading) btnLoading.style.display = 'none';
                        confirmBtn.disabled = false;
                    });
                } else {
                    this.closeModal();
                }
            });
        }

        if (backdrop && closeOnBackdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    if (onCancel) onCancel();
                    this.closeModal();
                }
            });
        }

        // ESC key
        this._modalEscHandler = (e) => {
            if (e.key === 'Escape') {
                if (onCancel) onCancel();
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this._modalEscHandler);
    },

    /**
     * Close the current modal
     */
    closeModal() {
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.classList.remove('show');
            setTimeout(() => {
                backdrop.remove();
            }, 200);
        }
        document.body.style.overflow = '';
        this._currentModal = null;

        if (this._modalEscHandler) {
            document.removeEventListener('keydown', this._modalEscHandler);
            this._modalEscHandler = null;
        }
    },

    /**
     * Show a confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Confirm callback
     * @param {Object} [options] - Additional options
     */
    showConfirmDialog(message, onConfirm, options = {}) {
        const {
            title = 'Xác nhận',
            confirmText = 'Xác nhận',
            cancelText = 'Hủy',
            type = 'warning' // 'warning' | 'danger' | 'info'
        } = options;

        const iconMap = {
            warning: '⚠️',
            danger: '🗑️',
            info: 'ℹ️'
        };
        const confirmClassMap = {
            warning: 'btn-warning',
            danger: 'btn-danger',
            info: 'btn-primary'
        };

        this.showModal({
            title,
            content: `
                <div class="confirm-dialog">
                    <div class="confirm-icon">${iconMap[type] || '⚠️'}</div>
                    <p class="confirm-message">${this._escapeHtml(message)}</p>
                </div>`,
            size: 'sm',
            onConfirm,
            confirmText,
            cancelText,
            confirmClass: confirmClassMap[type] || 'btn-primary'
        });
    },

    // ----------------------------------------------------------
    // Toast System
    // ----------------------------------------------------------
    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} [type='info'] - 'success' | 'error' | 'warning' | 'info'
     * @param {number} [duration=4000] - Auto-dismiss in ms
     */
    showToast(message, type = 'info', duration = 4000) {
        // Ensure container exists
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Limit max visible toasts
        while (this._activeToasts.length >= 5) {
            const oldest = this._activeToasts.shift();
            const oldEl = document.getElementById(oldest.id);
            if (oldEl) oldEl.remove();
        }

        const toastId = `toast-${++this._toastCounter}`;
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toastHtml = `
        <div class="toast toast-${type}" id="${toastId}">
            <div class="toast-icon">${iconMap[type] || 'ℹ️'}</div>
            <div class="toast-message">${this._escapeHtml(message)}</div>
            <button class="toast-close" onclick="AppShell._dismissToast('${toastId}')" title="Đóng">&times;</button>
        </div>`;

        container.insertAdjacentHTML('beforeend', toastHtml);

        // Animate in
        const toastEl = document.getElementById(toastId);
        requestAnimationFrame(() => {
            if (toastEl) toastEl.classList.add('show');
        });

        // Auto dismiss
        const timer = setTimeout(() => {
            this._dismissToast(toastId);
        }, duration);

        this._activeToasts.push({ id: toastId, timer });
    },

    /**
     * Dismiss a toast by id
     */
    _dismissToast(toastId) {
        const toastEl = document.getElementById(toastId);
        if (toastEl) {
            toastEl.classList.remove('show');
            toastEl.classList.add('hide');
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        }
        // Clear timer and remove from active list
        this._activeToasts = this._activeToasts.filter(t => {
            if (t.id === toastId) {
                clearTimeout(t.timer);
                return false;
            }
            return true;
        });
    },

    // ----------------------------------------------------------
    // Loading Overlay
    // ----------------------------------------------------------
    showLoading() {
        if (document.getElementById('loadingOverlay')) return;

        const loadingHtml = `
        <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Đang tải...</p>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', loadingHtml);
        requestAnimationFrame(() => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.classList.add('show');
        });
    },

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
            }, 200);
        }
    },

    // ----------------------------------------------------------
    // Notification Badge
    // ----------------------------------------------------------
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    // ----------------------------------------------------------
    // Breadcrumb
    // ----------------------------------------------------------
    /**
     * Render breadcrumb
     * @param {Array<{label: string, page?: string}>} items
     */
    renderBreadcrumb(items) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        const html = items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast || !item.page) {
                return `<span class="breadcrumb-item current">${this._escapeHtml(item.label)}</span>`;
            }
            return `<a class="breadcrumb-item" onclick="window.Router.navigate('${item.page}')">${this._escapeHtml(item.label)}</a>`;
        }).join('<span class="breadcrumb-separator">›</span>');

        breadcrumb.innerHTML = html;
    },

    // ----------------------------------------------------------
    // Utility
    // ----------------------------------------------------------
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================================
// 3. Initialize sidebar collapsed state from localStorage
// ============================================================
try {
    const savedCollapsed = localStorage.getItem('ats_sidebar_collapsed');
    if (savedCollapsed === '1') {
        AppShell._sidebarCollapsed = true;
    }
} catch (e) { /* ignore */ }

// ============================================================
// 4. Export globals
// ============================================================
window.Router = new Router();
window.AppShell = AppShell;
