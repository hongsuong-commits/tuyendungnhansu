/**
 * LoginPage - Authentication page for ATS System
 * Modern centered design with gradient background, demo accounts,
 * and full login/redirect logic.
 */
const LoginPage = (() => {
  return {
    /**
     * Render the login page HTML
     */
    render() {
      return `
        <div class="login-page">
          <aside class="login-aside">
            <a href="#/portal" class="login-brand" title="Về cổng tuyển dụng">
              <span class="logo-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="4.2" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.8" cy="10" r="1.5" /><path d="M5.9 10h2.6M11.7 10h2.6" /></svg>
              </span>
              <span class="logo-text">SmartATS</span>
            </a>

            <div class="login-aside-body">
              <p class="login-kicker">Hệ thống quản lý tuyển dụng · SmartATS Solutions</p>
              <p class="login-aside-title">Mỗi hồ sơ đi đúng một lối.</p>
              <p class="login-aside-text">Từ yêu cầu tuyển dụng, tin tuyển, sàng lọc CV đến lịch phỏng vấn và quyết định nhận việc — một dòng chảy duy nhất cho nhân sự, trưởng phòng và ban giám đốc.</p>
              ${this._renderStageStrip()}
            </div>

            <p class="login-aside-foot">Số liệu lấy từ dữ liệu demo của hệ thống, cập nhật theo từng hồ sơ.</p>
          </aside>

          <div class="login-container">
            <a href="#/portal" class="login-brand login-brand--narrow">
              <span class="logo-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="4.2" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.8" cy="10" r="1.5" /><path d="M5.9 10h2.6M11.7 10h2.6" /></svg>
              </span>
              <span class="logo-text">SmartATS<span class="logo-scope">Tuyển dụng</span></span>
            </a>

            <div class="login-card" id="loginCard">
              <div class="login-header">
                <h1 class="login-title">Đăng nhập</h1>
                <p class="login-subtitle">Dùng tài khoản nội bộ để vào bảng điều khiển tuyển dụng.</p>
              </div>

              <form class="login-form" id="loginForm" novalidate>
                <div class="login-error" id="loginError" style="display: none;">
                  <i data-lucide="alert-circle"></i>
                  <span id="loginErrorText">Tên đăng nhập hoặc mật khẩu không đúng</span>
                </div>

                <div class="form-group">
                  <label class="form-label" for="loginUsername">Tên đăng nhập</label>
                  <div class="input-with-icon">
                    <i data-lucide="user" class="input-icon"></i>
                    <input
                      type="text"
                      class="form-input"
                      id="loginUsername"
                      name="username"
                      placeholder="Nhập tên đăng nhập"
                      autocomplete="username"
                      required
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="loginPassword">Mật khẩu</label>
                  <div class="input-with-icon">
                    <i data-lucide="lock" class="input-icon"></i>
                    <input
                      type="password"
                      class="form-input"
                      id="loginPassword"
                      name="password"
                      placeholder="Nhập mật khẩu"
                      autocomplete="current-password"
                      required
                    >
                    <button type="button" class="password-toggle-btn" id="passwordToggle" title="Hiện/ẩn mật khẩu">
                      <i data-lucide="eye" id="passwordToggleIcon"></i>
                    </button>
                  </div>
                </div>

                <div class="login-meta">
                  <label class="checkbox-label" for="rememberLogin">
                    <input type="checkbox" id="rememberLogin" class="form-checkbox">
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <span class="login-help">Quên mật khẩu: liên hệ HR</span>
                </div>

                <button type="submit" class="btn btn-primary login-btn" id="loginSubmitBtn">
                  <span class="login-btn-text">Đăng nhập</span>
                  <span class="login-btn-loading" style="display: none;">
                    <span class="spinner"></span>
                    <span>Đang xử lý...</span>
                  </span>
                </button>
              </form>

              <div class="login-footer-link">
                <span>Bạn là ứng viên?</span>
                <a href="#/portal" class="candidate-portal-link">Truy cập cổng ứng viên →</a>
              </div>
            </div>

            <div class="demo-accounts-section">
              <button class="demo-toggle-btn" id="demoToggleBtn" type="button">
                <i data-lucide="info" class="demo-toggle-icon"></i>
                <span>Tài khoản demo</span>
                <i data-lucide="chevron-down" id="demoChevron" class="demo-chevron"></i>
              </button>

              <div class="demo-accounts-list" id="demoAccountsList" style="display: none;">
                <table class="demo-table">
                  <thead>
                    <tr>
                      <th>Vai trò</th>
                      <th>Tài khoản</th>
                      <th>Mật khẩu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="demo-row" data-username="director" data-password="123456">
                      <td><span class="demo-role-badge demo-role-director">Giám đốc</span></td>
                      <td><code>director</code></td>
                      <td><code>123456</code></td>
                    </tr>
                    <tr class="demo-row" data-username="hr1" data-password="123456">
                      <td><span class="demo-role-badge demo-role-hr">Nhân sự</span></td>
                      <td><code>hr1</code></td>
                      <td><code>123456</code></td>
                    </tr>
                    <tr class="demo-row" data-username="head_it" data-password="123456">
                      <td><span class="demo-role-badge demo-role-head">Trưởng phòng CNTT</span></td>
                      <td><code>head_it</code></td>
                      <td><code>123456</code></td>
                    </tr>
                    <tr class="demo-row" data-username="head_sales" data-password="123456">
                      <td><span class="demo-role-badge demo-role-head">Trưởng phòng KD</span></td>
                      <td><code>head_sales</code></td>
                      <td><code>123456</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            ${this._renderStageStrip('login-rail')}
          </div>
        </div>
      `;
    },

    /**
     * The pipeline strip: the product's own motif, fed by the real demo
     * data instead of decorative shapes. Rendered on the login aside on
     * wide screens and as a compact rail under the form on narrow ones.
     */
    _renderStageStrip(modifier = '') {
      const stages = [
        ['pending_review', 'Chờ duyệt', 'Chờ duyệt'],
        ['reviewing', 'Xem xét', 'Xem xét'],
        ['passed_screening', 'Đạt sàng lọc', 'Sàng lọc'],
        ['interview_scheduled', 'Phỏng vấn', 'Phỏng vấn'],
        ['proposed', 'Đề xuất', 'Đề xuất'],
        ['hired', 'Đã tuyển', 'Đã tuyển'],
      ];
      let byStage = {};
      try {
        const stats = (typeof ATSStore !== 'undefined' && ATSStore.getDashboardStats)
          ? ATSStore.getDashboardStats()
          : null;
        byStage = (stats && stats.candidatesByStage) || {};
      } catch (err) {
        byStage = {};
      }
      return `
        <div class="login-pipeline ${modifier}" aria-label="Hồ sơ theo giai đoạn tuyển dụng">
          ${modifier ? '<p class="login-rail-label">Hồ sơ theo giai đoạn · dữ liệu demo</p>' : ''}
          <div class="login-rail-cells">
            ${stages.map(([key, label, shortLabel], index) => `
              <div class="login-stage ${index === 0 ? 'is-first' : ''}">
                <b>${Number(byStage[key] || 0)}</b>
                <span>${modifier ? shortLabel : label}</span>
              </div>`).join('')}
          </div>
        </div>
      `;
    },

    /**
     * Initialize event listeners for the login page
     * Must be called after render
     */
    init() {
      // ── Login form submit ──────────────────────────────────────────
      const form = document.getElementById('loginForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
      }

      // ── Password visibility toggle ─────────────────────────────────
      const passwordToggle = document.getElementById('passwordToggle');
      const passwordInput = document.getElementById('loginPassword');
      const toggleIcon = document.getElementById('passwordToggleIcon');
      if (passwordToggle && passwordInput && toggleIcon) {
        passwordToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isPassword = passwordInput.type === 'password';
          passwordInput.type = isPassword ? 'text' : 'password';
          toggleIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }

      // ── Demo accounts toggle ───────────────────────────────────────
      const demoToggle = document.getElementById('demoToggleBtn');
      const demoList = document.getElementById('demoAccountsList');
      const demoChevron = document.getElementById('demoChevron');
      if (demoToggle && demoList) {
        demoToggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isHidden = demoList.style.display === 'none';
          demoList.style.display = isHidden ? 'block' : 'none';
          if (demoChevron) {
            demoChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
          }
          // Initialize icons in the newly visible area
          if (isHidden) {
            requestAnimationFrame(() => {
              if (typeof lucide !== 'undefined') lucide.createIcons();
            });
          }
        });
      }

      // ── Demo row click to auto-fill ────────────────────────────────
      const demoRows = document.querySelectorAll('.demo-row');
      demoRows.forEach(row => {
        row.addEventListener('click', () => {
          const username = row.getAttribute('data-username');
          const password = row.getAttribute('data-password');
          const usernameInput = document.getElementById('loginUsername');
          const passInput = document.getElementById('loginPassword');
          if (usernameInput) usernameInput.value = username;
          if (passInput) passInput.value = password;

          // Hide error if visible
          this.hideError();

          // Visual feedback: briefly highlight the row
          row.classList.add('demo-row-selected');
          setTimeout(() => row.classList.remove('demo-row-selected'), 600);

          // Focus the login button
          const submitBtn = document.getElementById('loginSubmitBtn');
          if (submitBtn) submitBtn.focus();
        });
      });

      // ── Clear error on input ───────────────────────────────────────
      const usernameInput = document.getElementById('loginUsername');
      const passInput = document.getElementById('loginPassword');
      [usernameInput, passInput].forEach(input => {
        if (input) {
          input.addEventListener('input', () => {
            this.hideError();
          });
        }
      });

      // ── Restore remembered username ────────────────────────────────
      const remembered = localStorage.getItem('ats_remembered_user');
      if (remembered && usernameInput) {
        usernameInput.value = remembered;
        const rememberCb = document.getElementById('rememberLogin');
        if (rememberCb) rememberCb.checked = true;
        // Focus on password field
        if (passInput) passInput.focus();
      }
    },

    /**
     * Handle login form submission
     */
    handleLogin() {
      const usernameInput = document.getElementById('loginUsername');
      const passwordInput = document.getElementById('loginPassword');
      const username = (usernameInput ? usernameInput.value : '').trim();
      const password = (passwordInput ? passwordInput.value : '').trim();

      // ── Validate ───────────────────────────────────────────────────
      if (!username || !password) {
        this.showError('Vui lòng nhập tên đăng nhập và mật khẩu');
        if (!username && usernameInput) usernameInput.focus();
        else if (!password && passwordInput) passwordInput.focus();
        return;
      }

      // ── Show loading state ─────────────────────────────────────────
      this.setLoading(true);

      // ── Simulate network delay for realistic feel ──────────────────
      setTimeout(() => {
        let loginResult = false;

        if (typeof ATSStore !== 'undefined' && ATSStore.login) {
          loginResult = ATSStore.login(username, password);
        }

        const isSuccess = loginResult && (loginResult === true || loginResult.success === true);

        if (isSuccess) {
          // Handle "Remember login" checkbox
          const rememberCb = document.getElementById('rememberLogin');
          if (rememberCb && rememberCb.checked) {
            localStorage.setItem('ats_remembered_user', username);
          } else {
            localStorage.removeItem('ats_remembered_user');
          }

          // Show success toast
          if (typeof UI !== 'undefined') {
            if (UI.toast) UI.toast({ message: 'Đăng nhập thành công!', type: 'success' });
            else if (UI.showToast) UI.showToast('Đăng nhập thành công!', 'success');
          }

          // Navigate based on role
          const currentUser = ATSStore.getCurrentUser();
          if (currentUser && currentUser.role === 'candidate') {
            Router.navigate('portal');
          } else {
            Router.navigate('dashboard');
          }
        } else {
          // ── Login failed ─────────────────────────────────────────
          this.setLoading(false);
          this.showError('Tên đăng nhập hoặc mật khẩu không đúng');
          this.shakeCard();
          // Focus password field and select it
          if (passwordInput) {
            passwordInput.focus();
            passwordInput.select();
          }
        }
      }, 600);
    },

    /**
     * Show error message
     */
    showError(message) {
      const errorDiv = document.getElementById('loginError');
      const errorText = document.getElementById('loginErrorText');
      if (errorDiv) {
        errorDiv.style.display = 'flex';
        if (errorText) errorText.textContent = message;
        // Re-init lucide icons for the alert icon
        requestAnimationFrame(() => {
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }
    },

    /**
     * Hide error message
     */
    hideError() {
      const errorDiv = document.getElementById('loginError');
      if (errorDiv) errorDiv.style.display = 'none';
    },

    /**
     * Set loading state on submit button
     */
    setLoading(isLoading) {
      const btn = document.getElementById('loginSubmitBtn');
      if (!btn) return;
      const textEl = btn.querySelector('.login-btn-text');
      const loadingEl = btn.querySelector('.login-btn-loading');
      if (isLoading) {
        btn.disabled = true;
        btn.classList.add('btn-loading');
        if (textEl) textEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'inline-flex';
      } else {
        btn.disabled = false;
        btn.classList.remove('btn-loading');
        if (textEl) textEl.style.display = 'inline';
        if (loadingEl) loadingEl.style.display = 'none';
      }
    },

    /**
     * Shake the login card for error feedback
     */
    shakeCard() {
      const card = document.getElementById('loginCard');
      if (!card) return;
      card.classList.add('login-card-shake');
      setTimeout(() => {
        card.classList.remove('login-card-shake');
      }, 500);
    },
  };
})();
