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
    const isLogin = currentPath.startsWith('login');
    const isPortal = currentPath.startsWith('portal');

    // ── 1. Auth Guard ──────────────────────────────────────────
    if (!user && !isLogin && !isPortal) {
      window.location.hash = '#/login';
      return;
    }

    // If candidate logged in, keep them on portal
    if (user && user.role === 'candidate' && !isPortal && !isLogin) {
      window.location.hash = '#/portal';
      return;
    }

    // Check Role Access permissions
    const routeRoot = currentPath.split('/')[0] || 'dashboard';
    if (user && !isLogin && !isPortal && !Helpers.canAccess(routeRoot, user.role)) {
      UI.toast({ message: `Vai trò ${Helpers.getRoleLabel(user.role)} không có quyền truy cập trang này.`, type: 'warning' });
      window.location.hash = '#/dashboard';
      return;
    }

    // ── 2. Render Page HTML ────────────────────────────────────
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
  function initApp() {
    setupRoutes();
    Router.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
