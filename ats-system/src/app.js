/**
 * app.js - Main Application Entry Point for SmartATS
 * Configures routes, role permission guard, layout rendering, and event bootstrap.
 */

(function () {
  'use strict';

  function renderPage(pageComponent, params = {}) {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const user = ATSStore.getCurrentUser();
    const currentPath = Router.getCurrentPath();

    // ── 1. Auth Guard — kiểm tra TRƯỚC khi render bất kỳ trang nào ──
    const access = Helpers.resolveRouteAccess(currentPath, user);

    if (!access.allowed) {
      if (access.reason === 'not-authenticated') {
        UI.toast({
          message: 'Vui lòng đăng nhập để vào khu vực quản trị.',
          type: 'warning'
        });
      } else if (access.reason === 'forbidden-role') {
        UI.toast({
          message: `Vai trò ${Helpers.getRoleLabel(user.role)} không có quyền truy cập trang này.`,
          type: 'warning'
        });
      }
      window.location.hash = access.redirect || '#/portal';
      return;
    }

    // ── 2. Render Page HTML ────────────────────────────────────
    const isLogin = currentPath.startsWith('login');
    const isPortal = currentPath.startsWith('portal');
    const pageHtml = pageComponent.render(params);

    if (isLogin || isPortal) {
      // Direct rendering without internal admin layout
      appEl.innerHTML = pageHtml;
    } else {
      // Wrap inside Layout with sidebar & header
      appEl.innerHTML = Layout.render(pageHtml);
      Layout.initEventListeners();
    }

    // ── 3. Page Component Event Initialization ─────────────────
    if (typeof pageComponent.init === 'function') {
      pageComponent.init(params);
    }

    // Refresh Lucide icons
    requestAnimationFrame(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // ─────────────────────────────────────────────────────────────
  // Route Registration
  // ─────────────────────────────────────────────────────────────
  function setupRoutes() {
    Router.register('login', () => renderPage(LoginPage));
    Router.register('dashboard', () => renderPage(DashboardPage));

    // Requisitions
    Router.register('requisitions', () => renderPage(RequisitionsPage));
    Router.register('requisitions/:id', (params) => renderPage(RequisitionsPage, params));

    // Postings
    Router.register('postings', () => renderPage(PostingsPage));
    Router.register('postings/:id', (params) => renderPage(PostingsPage, params));

    // Candidates
    Router.register('candidates', (params) => renderPage(CandidatesPage, params));
    Router.register('candidates/:id', (params) => {
      renderPage(CandidatesPage, params);
      // Auto open detail modal if id supplied
      setTimeout(() => {
        CandidatesPage.showCandidateDetailModal(params.id);
      }, 100);
    });

    // Screening
    Router.register('screening', () => renderPage(ScreeningPage));

    // Interviews
    Router.register('interviews', (params) => renderPage(InterviewsPage, params));

    // Evaluations
    Router.register('evaluations', (params) => renderPage(EvaluationsPage, params));

    // Reports
    Router.register('reports', () => renderPage(ReportsPage));

    // Users
    Router.register('users', () => renderPage(UsersPage));

    // Settings
    Router.register('settings', () => renderPage(SettingsPage));

    // Personal profile & notification center
    Router.register('profile', () => renderPage(ProfilePage));
    Router.register('notifications', () => renderPage(NotificationsPage));

    // Public Candidate Career Portal
    Router.register('portal', (params) => renderPage(PortalPage, params));
    Router.register('portal/job/:id', (params) => {
      renderPage(PortalPage, params);
      setTimeout(() => {
        PortalPage.showJobDetailModal(params.id);
      }, 100);
    });

    // 404 Fallback
    Router.registerNotFound(() => {
      const user = ATSStore.getCurrentUser();
      window.location.hash = user ? '#/dashboard' : '#/portal';
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Application Bootstrap
  // ─────────────────────────────────────────────────────────────
  function renderBootScreen() {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    appEl.innerHTML = `
      <div class="boot-screen">
        <div class="boot-mark">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="4.2" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.8" cy="10" r="1.5" /><path d="M5.9 10h2.6M11.7 10h2.6" /></svg>
        </div>
        <p class="boot-title">SmartATS</p>
        <p class="boot-text">Đang kết nối cơ sở dữ liệu…</p>
      </div>
    `;
  }

  async function initApp() {
    setupRoutes();
    renderBootScreen();

    const currentUser = typeof ATSStore.getCurrentUser === 'function' ? ATSStore.getCurrentUser() : null;
    const initialPath = Router.getCurrentPath();

    // Chỉ nạp dữ liệu nghiệp vụ khi ĐÃ đăng nhập (hoặc đang xem cổng công khai).
    // Người chưa đăng nhập dán link #/interviews sẽ bị guard đẩy về #/portal
    // trước khi bất kỳ dữ liệu quản trị nào được tải vào bộ nhớ.
    let dataLoaded = false;
    const loadData = async () => {
      if (dataLoaded) return;
      dataLoaded = true;
      try {
        await ATSStore.init();
      } catch (err) {
        console.warn('[SmartATS] Không tải được dữ liệu máy chủ:', err);
      }
    };

    if (currentUser || initialPath.startsWith('portal')) {
      await loadData();
    }

    Router.init();

    // Nếu guard vừa đẩy về cổng công khai: nạp dữ liệu rồi vẽ lại trang.
    if (!dataLoaded && Router.getCurrentPath().startsWith('portal')) {
      await loadData();
      window.dispatchEvent(new Event('hashchange'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
