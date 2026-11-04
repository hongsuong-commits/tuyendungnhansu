/**
 * Helpers - Utility functions for ATS System
 * Provides date formatting, validation, status mapping, permissions, and more.
 */
const Helpers = (() => {
  // ─── Status Labels (Vietnamese) ──────────────────────────────────────
  const STATUS_LABELS = {
    pending_review: 'Chờ nhân sự duyệt',
    reviewing: 'Đang xem xét',
    passed_screening: 'Đạt – Chờ phỏng vấn',
    interview_scheduled: 'Đã lên lịch phỏng vấn',
    proposed: 'Đã đề xuất tuyển dụng',
    hired: 'Đã tuyển',
    rejected: 'Không đạt',
    need_info: 'Cần bổ sung thông tin',
    pending: 'Chờ phê duyệt',
    approved: 'Đã phê duyệt',
    recruiting: 'Đang tuyển',
    closed: 'Đã đóng',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    published: 'Đã đăng',
    draft: 'Bản nháp',
    expired: 'Hết hạn',
    // Trạng thái phát sinh từ xử lý ngoại lệ (BPMN)
    reminder: 'Nhắc nhở quá hạn',
    publish_error: 'Lỗi đăng tin',
    publish_retry: 'Đăng lại tin',
  };

  // ─── Status Colors ───────────────────────────────────────────────────
  const STATUS_COLORS = {
    pending_review: 'status-warning',
    reviewing: 'status-info',
    passed_screening: 'status-success',
    interview_scheduled: 'status-info',
    proposed: 'status-primary',
    hired: 'status-success',
    rejected: 'status-danger',
    need_info: 'status-warning',
    pending: 'status-warning',
    approved: 'status-success',
    recruiting: 'status-info',
    closed: 'status-secondary',
    confirmed: 'status-success',
    completed: 'status-success',
    cancelled: 'status-danger',
    published: 'status-primary',
    draft: 'status-secondary',
    expired: 'status-danger',
    reminder: 'status-warning',
    publish_error: 'status-danger',
    publish_retry: 'status-info',
  };

  // ─── Role Labels ─────────────────────────────────────────────────────
  const ROLE_LABELS = {
    director: 'Giám đốc',
    department_head: 'Trưởng phòng',
    hr: 'Nhân viên nhân sự',
    candidate: 'Ứng viên',
  };

  // ─── Screening Classification Labels ─────────────────────────────────
  const SCREENING_LABELS = {
    pass: 'Đạt tiêu chí',
    fail: 'Không đạt',
    manual_check: 'Cần kiểm tra thủ công',
  };

  const SCREENING_COLORS = {
    pass: 'status-success',
    fail: 'status-danger',
    manual_check: 'status-warning',
  };

  // ─── Recommendation Labels ───────────────────────────────────────────
  const RECOMMENDATION_LABELS = {
    continue: 'Tiếp tục',
    consider: 'Cân nhắc',
    reject: 'Không tiếp tục',
  };

  const RECOMMENDATION_COLORS = {
    continue: 'status-success',
    consider: 'status-warning',
    reject: 'status-danger',
  };

  // ─── Permission Matrix ───────────────────────────────────────────────
  const PAGE_ACCESS = {
    // Giám đốc: giám sát & phê duyệt — KHÔNG quản lý tài khoản/cấu hình hệ thống.
    director: [
      'dashboard', 'requisitions', 'candidates', 'interviews',
      'reports', 'postings', 'evaluations', 'screening',
      'profile', 'notifications'
    ],
    department_head: [
      'dashboard', 'requisitions', 'candidates', 'interviews',
      'evaluations', 'reports', 'profile', 'notifications'
    ],
    hr: [
      'dashboard', 'requisitions', 'candidates', 'interviews',
      'postings', 'reports', 'settings', 'evaluations', 'screening', 'users',
      'profile', 'notifications'
    ],
    candidate: ['portal', 'applications'],
  };

  const PERMISSIONS = {
    director: ['view_all', 'approve_requisition', 'approve_hiring'],
    department_head: [
      'view_own_department', 'create_requisition', 'edit_requisition',
      'evaluate_candidate', 'view_candidates', 'view_interviews',
    ],
    hr: [
      'view_all', 'create_posting', 'edit_posting', 'delete_posting',
      'manage_candidates', 'create_candidate', 'edit_candidate',
      'delete_candidate', 'schedule_interview', 'edit_interview',
      'delete_interview', 'screen_candidate',
      'edit_requisition', 'manage_settings',
    ],
    candidate: ['view_own_applications', 'apply_job', 'update_profile'],
  };

  // ─── Internal ID Counter ─────────────────────────────────────────────
  let _idCounter = 0;

  return {
    // ═══════════════════════════════════════════════════════════════════
    // Date Formatting
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Format date string to Vietnamese format: "27/10/2026".
     * Parse theo múi giờ local (Asia/Saigon) để tránh bị dịch sang ngày hôm sau
     * do JS đọc "YYYY-MM-DD" thành UTC midnight.
     */
    formatDate(dateStr) {
      if (!dateStr) return '—';
      const pad = (n) => String(n).padStart(2, '0');

      // Nếu là Date object: hiển thị theo ngày của máy người dùng.
      if (dateStr instanceof Date) {
        if (isNaN(dateStr.getTime())) return '—';
        return `${pad(dateStr.getDate())}/${pad(dateStr.getMonth() + 1)}/${dateStr.getFullYear()}`;
      }

      const text = String(dateStr).trim();

      // Chuỗi "YYYY-MM-DD" hoặc ISO timestamp: giữ đúng ngày đã lưu (không đổi múi giờ).
      const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (iso) return `${pad(iso[3])}/${pad(iso[2])}/${iso[1]}`;

      const d = new Date(text);
      if (isNaN(d.getTime())) return '—';
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    },

    /**
     * Format date + time: "27/10/2026 14:30".
     * Parse theo múi giờ local để tránh bị dịch ngày do UTC.
     */
    formatDateTime(dateStr) {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    /**
     * Format relative time in Vietnamese: "2 giờ trước", "3 ngày trước"
     */
    formatRelativeTime(dateStr) {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffWeek = Math.floor(diffDay / 7);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);

      if (diffSec < 0) return 'Vừa xong';
      if (diffSec < 60) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;
      if (diffWeek < 5) return `${diffWeek} tuần trước`;
      if (diffMonth < 12) return `${diffMonth} tháng trước`;
      return `${diffYear} năm trước`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Number Formatting
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Format number with thousand separators: "1,234"
     */
    formatNumber(num) {
      if (num === null || num === undefined || isNaN(num)) return '0';
      return Number(num).toLocaleString('vi-VN');
    },

    /**
     * Format currency in VND: "15,000,000 VNĐ"
     */
    formatCurrency(amount) {
      if (amount === null || amount === undefined || isNaN(amount)) return '0 VNĐ';
      return Number(amount).toLocaleString('vi-VN') + ' VNĐ';
    },

    /**
     * Format percentage: "85%"
     */
    formatPercent(value) {
      if (value === null || value === undefined || isNaN(value)) return '0%';
      return Math.round(Number(value)) + '%';
    },

    /**
     * Rút gọn khoảng lương để vừa một cột bảng:
     * "20.000.000 - 30.000.000 VNĐ" -> "20–30 tr", "15 - 25 triệu VNĐ + Hoa hồng" -> "15–25 tr + HH"
     */
    compactSalary(raw) {
      if (!raw) return 'Thỏa thuận';
      const text = String(raw);
      if (/thỏa thuận/i.test(text)) return 'Thỏa thuận';

      const toMillions = (token) => {
        const value = Number(String(token).replace(/[^\d]/g, ''));
        if (!Number.isFinite(value) || value === 0) return null;
        if (value >= 1000000) return Math.round(value / 100000) / 10;
        if (value >= 1000) return Math.round(value / 1000);
        return value;
      };

      const values = (text.match(/\d[\d.,]*/g) || [])
        .map(toMillions)
        .filter((v) => v !== null);

      if (!values.length) return text;

      const bonus = /hoa hồng|hh/i.test(text) ? ' + HH' : '';
      const fmt = (v) => String(v).replace('.', ',');
      if (values.length === 1) return `${fmt(values[0])} tr${bonus}`;
      return `${fmt(values[0])}–${fmt(values[1])} tr${bonus}`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Validation
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Validate email format
     */
    isValidEmail(email) {
      if (!email) return false;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).trim());
    },

    /**
     * Validate Vietnamese phone number
     * Supports: 0xxx, +84xxx, 84xxx (10-11 digits)
     */
    isValidPhone(phone) {
      if (!phone) return false;
      const cleaned = String(phone).replace(/[\s\-().]/g, '');
      const re = /^(\+?84|0)(3|5|7|8|9)\d{8}$/;
      return re.test(cleaned);
    },

    /**
     * Check if value is not empty
     */
    isRequired(value) {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },

    /**
     * Số năm kinh nghiệm hợp lệ: là số hữu hạn, không âm và không vượt quá 60.
     * Dùng chung cho form ứng viên công khai và form HR tải CV thủ công.
     */
    isValidExperienceYears(value) {
      if (value === null || value === undefined || value === '') return false;
      const num = Number(value);
      return Number.isFinite(num) && num >= 0 && num <= 60;
    },

    /**
     * Hiển thị số năm kinh nghiệm yêu cầu (JD): "2 năm" hoặc "Không yêu cầu".
     */
    formatMinExperience(value) {
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) return 'Không yêu cầu';
      return `${num % 1 === 0 ? num : num.toFixed(1)} năm`;
    },

    /**
     * Chuẩn hoá số năm kinh nghiệm về khoảng [0, 60] (làm tròn 1 chữ số thập phân).
     * Giá trị không hợp lệ trở thành 0 thay vì số âm hoặc NaN.
     */
    normalizeExperienceYears(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.min(60, Math.max(0, Math.round(num * 10) / 10));
    },

    // ═══════════════════════════════════════════════════════════════════
    // String Helpers
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Truncate string to maxLen with ellipsis
     */
    truncate(str, maxLen = 50) {
      if (!str) return '';
      const s = String(str);
      if (s.length <= maxLen) return s;
      return s.substring(0, maxLen).trimEnd() + '…';
    },

    /**
     * Convert string to URL-safe slug
     */
    slugify(str) {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    },

    /**
     * Generate a unique ID
     */
    generateId() {
      _idCounter++;
      return 'id_' + Date.now().toString(36) + '_' + (Math.random().toString(36).substring(2, 8)) + '_' + _idCounter;
    },

    /**
     * Generate a formatted code: "TD-20261027-001"
     */
    generateCode(prefix = 'TD') {
      const now = new Date();
      const datePart = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      const seqKey = `ats_seq_${prefix}_${datePart}`;
      let seq = parseInt(localStorage.getItem(seqKey) || '0', 10) + 1;
      localStorage.setItem(seqKey, String(seq));
      return `${prefix}-${datePart}-${String(seq).padStart(3, '0')}`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Status Helpers
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Get Vietnamese label for a status
     */
    getStatusLabel(status) {
      return STATUS_LABELS[status] || status || '—';
    },

    /**
     * Get CSS color class for a status
     */
    getStatusColor(status) {
      return STATUS_COLORS[status] || 'status-secondary';
    },

    /**
     * Get screening classification label
     */
    getScreeningLabel(classification) {
      return SCREENING_LABELS[classification] || classification || '—';
    },

    /**
     * Get screening classification color class
     */
    getScreeningColor(classification) {
      return SCREENING_COLORS[classification] || 'status-secondary';
    },

    /**
     * Get role label in Vietnamese
     */
    getRoleLabel(role) {
      return ROLE_LABELS[role] || role || '—';
    },

    /**
     * Get recommendation label
     */
    getRecommendationLabel(rec) {
      return RECOMMENDATION_LABELS[rec] || rec || '—';
    },

    /**
     * Get recommendation color class
     */
    getRecommendationColor(rec) {
      return RECOMMENDATION_COLORS[rec] || 'status-secondary';
    },

    /**
     * Render status badge HTML
     */
    statusBadge(status) {
      const label = this.getStatusLabel(status);
      const color = this.getStatusColor(status);
      return `<span class="badge ${color}">${label}</span>`;
    },

    /**
     * Render screening classification badge HTML
     */
    screeningBadge(classification) {
      const label = this.getScreeningLabel(classification);
      const color = this.getScreeningColor(classification);
      return `<span class="badge ${color}">${label}</span>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Permission Helpers
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Check if a role can access a specific page
     */
    canAccess(page, role) {
      if (!role || !page) return false;
      const pages = PAGE_ACCESS[role];
      return pages ? pages.includes(page) : false;
    },

    /**
     * Quyết định chuyển trang có hợp lệ không (dùng cho Auth Guard).
     *
     * Nguyên tắc:
     *  - Chưa đăng nhập: chỉ được vào cổng công khai (portal) và trang đăng nhập;
     *    mọi trang quản trị → chuyển về #/portal.
     *  - Đã đăng nhập mà vào #/login → chuyển về #/dashboard (hoặc portal nếu là ứng viên).
     *  - Ứng viên: chỉ portal/applications.
     *  - Vai trò nội bộ: phải nằm trong ma trận PAGE_ACCESS, nếu không → #/dashboard.
     *
     * @returns {{allowed: boolean, redirect?: string, reason?: string}}
     */
    resolveRouteAccess(path, user) {
      const root = String(path || '').replace(/^#/, '').replace(/^\/+/, '').split('/')[0] || 'dashboard';
      const isPortal = root === 'portal' || root === 'applications';
      const isLogin = root === 'login';

      if (isLogin) {
        if (!user) return { allowed: true };
        return {
          allowed: false,
          redirect: user.role === 'candidate' ? '#/portal' : '#/dashboard',
          reason: 'already-authenticated'
        };
      }

      if (!user) {
        if (isPortal) return { allowed: true };
        return { allowed: false, redirect: '#/portal', reason: 'not-authenticated' };
      }

      if (user.role === 'candidate') {
        return isPortal
          ? { allowed: true }
          : { allowed: false, redirect: '#/portal', reason: 'candidate-scope' };
      }

      // Người dùng nội bộ được xem cổng công khai.
      if (isPortal) return { allowed: true };

      if (!this.canAccess(root, user.role)) {
        return { allowed: false, redirect: '#/dashboard', reason: 'forbidden-role' };
      }

      return { allowed: true };
    },

    /**
     * Thông báo có hiển thị với vai trò này không.
     * Thông báo chung (không gán role) hiển thị cho mọi người;
     * thông báo có role chỉ hiển thị đúng vai trò đó.
     */
    isNotificationForRole(notification, role) {
      if (!notification) return false;
      if (!notification.role) return true;
      return notification.role === role;
    },

    /**
     * Gắn nút "×" xoá nhanh nội dung ô tìm kiếm (tiện trên điện thoại).
     * Gọi sau mỗi lần render trang; gọi lặp an toàn nhờ data-clear-attached.
     */
    attachSearchClear(root = document) {
      const SELECTORS = [
        '.search-box input.form-input',
        '.portal-job-search-input',
        '.portal-lookup-input',
        '#headerSearchInput'
      ];
      const inputs = root.querySelectorAll(SELECTORS.join(','));
      inputs.forEach((input) => {
        if (input.getAttribute('data-clear-attached') === '1') return;
        input.setAttribute('data-clear-attached', '1');

        const wrap = input.parentElement;
        if (!wrap) return;
        wrap.classList.add('search-clear-host');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-clear-btn';
        button.setAttribute('aria-label', 'Xoá nội dung tìm kiếm');
        button.title = 'Xoá nội dung';
        button.innerHTML = '&times;';

        const sync = () => button.classList.toggle('is-visible', String(input.value || '').length > 0);
        button.addEventListener('mousedown', (e) => e.preventDefault());
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          input.value = '';
          sync();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.focus();

          // Cổng ứng viên: ô tìm kiếm nằm trong form → gửi lại để danh sách về mặc định.
          const form = input.closest('form');
          if (form && (form.id === 'form-hero-job-search' || form.id === 'form-hero-lookup')) {
            if (typeof form.requestSubmit === 'function') form.requestSubmit();
            else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        });

        input.addEventListener('input', sync);
        input.addEventListener('change', sync);
        wrap.appendChild(button);
        sync();
      });
    },

    /**
     * Tự gắn lại nút "×" mỗi khi DOM thay đổi.
     * Các trang tự render lại nội dung sau khi tìm kiếm/lọc (không qua router),
     * nếu chỉ gắn một lần sau render trang thì nút sẽ mất — observer giải quyết việc này.
     */
    installSearchClearObserver(target = null) {
      if (typeof MutationObserver !== 'function') return false;
      if (typeof window !== 'undefined' && window.__searchClearObserverInstalled) return true;

      const root = target || (typeof document !== 'undefined' ? document.body : null);
      if (!root) return false;

      if (typeof window !== 'undefined') window.__searchClearObserverInstalled = true;

      let scheduled = false;
      const run = () => {
        scheduled = false;
        try {
          this.attachSearchClear(document);
        } catch (_) { /* bỏ qua lỗi DOM tạm thời */ }
      };

      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        // Gom nhiều thay đổi trong cùng một khung hình để không gắn lặp.
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 0);
      });
      observer.observe(root, { childList: true, subtree: true });

      if (typeof window !== 'undefined') window.__searchClearObserver = observer;
      this.attachSearchClear(document);
      return true;
    },

    /**
     * Check if user can edit an entity
     * Director: view only
     * Dept head: can edit own department's items
     * HR: can edit all recruitment entities
     * Candidate: can edit own profile only
     */
    canEdit(entity, role, userId) {
      if (!role) return false;
      if (role === 'director') return false;
      if (role === 'hr') return true;
      if (role === 'department_head') {
        if (!entity) return false;
        return entity.departmentId === userId || entity.createdBy === userId;
      }
      if (role === 'candidate') {
        if (!entity) return false;
        return entity.candidateId === userId || entity.id === userId;
      }
      return false;
    },

    /**
     * Check if role has a specific permission
     */
    hasPermission(action, role) {
      if (!role || !action) return false;
      const perms = PERMISSIONS[role];
      return perms ? perms.includes(action) : false;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Search & Filter
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Check if an item matches a search query across specified fields.
     * Uses case-insensitive, accent-insensitive matching.
     */
    matchesSearch(item, query, fields) {
      if (!query || !query.trim()) return true;
      if (!item || !fields || fields.length === 0) return false;

      const normalize = (str) =>
        String(str || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd');

      const q = normalize(query);

      return fields.some((field) => {
        const parts = field.split('.');
        let value = item;
        for (const part of parts) {
          value = value?.[part];
        }
        if (value === null || value === undefined) return false;
        return normalize(value).includes(q);
      });
    },

    /**
     * Apply multiple filters to an items array.
     * Each filter: { field, value, operator }
     * Operators: 'eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte', 'in', 'between'
     */
    applyFilters(items, filters) {
      if (!filters || filters.length === 0) return items;
      if (!items) return [];

      return items.filter((item) => {
        return filters.every((filter) => {
          const { field, value, operator = 'eq' } = filter;
          if (value === undefined || value === null || value === '' || value === 'all') return true;

          const parts = field.split('.');
          let itemVal = item;
          for (const part of parts) {
            itemVal = itemVal?.[part];
          }

          switch (operator) {
            case 'eq':
              return String(itemVal) === String(value);
            case 'neq':
              return String(itemVal) !== String(value);
            case 'contains': {
              const normalize = (s) =>
                String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
              return normalize(itemVal).includes(normalize(value));
            }
            case 'gt':
              return Number(itemVal) > Number(value);
            case 'gte':
              return Number(itemVal) >= Number(value);
            case 'lt':
              return Number(itemVal) < Number(value);
            case 'lte':
              return Number(itemVal) <= Number(value);
            case 'in':
              return Array.isArray(value) ? value.includes(itemVal) : false;
            case 'between':
              if (Array.isArray(value) && value.length === 2) {
                const v = new Date(itemVal).getTime();
                return v >= new Date(value[0]).getTime() && v <= new Date(value[1]).getTime();
              }
              return true;
            default:
              return true;
          }
        });
      });
    },

    /**
     * Sort items by field and direction
     */
    sortItems(items, field, direction = 'asc') {
      if (!items || !field) return items || [];
      const sorted = [...items];
      sorted.sort((a, b) => {
        const parts = field.split('.');
        let aVal = a, bVal = b;
        for (const part of parts) {
          aVal = aVal?.[part];
          bVal = bVal?.[part];
        }

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Try numeric comparison
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Try date comparison
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        if (!isNaN(aDate) && !isNaN(bDate) && typeof aVal === 'string' && aVal.includes('-')) {
          return direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        const cmp = aStr.localeCompare(bStr, 'vi');
        return direction === 'asc' ? cmp : -cmp;
      });
      return sorted;
    },

    /**
     * Paginate items array
     * Returns: { data, page, perPage, total, totalPages }
     */
    paginate(items, page = 1, perPage = 10) {
      if (!items) return { data: [], page: 1, perPage, total: 0, totalPages: 0 };
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * perPage;
      const data = items.slice(start, start + perPage);
      return { data, page: safePage, perPage, total, totalPages };
    },

    // ═══════════════════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Export data to CSV and trigger download
     * columns: [{ key, label }]
     */
    exportToCSV(data, columns, filename = 'export.csv') {
      if (!data || !columns) return;

      const BOM = '\uFEFF';
      const header = columns.map((col) => `"${col.label}"`).join(',');
      const rows = data.map((row) => {
        return columns
          .map((col) => {
            let val = row[col.key];
            if (val === null || val === undefined) val = '';
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',');
      });

      const csv = BOM + header + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    // ═══════════════════════════════════════════════════════════════════
    // JD Formatting (Job Description & Requirements)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Format raw Job Description & Requirements text into clean, elegant HTML
     * Replaces squished dashes (-), pluses (+), asterisks (*), into styled bullet points,
     * auto wraps paragraphs with generous spacing and removes clutter.
     */
    formatJDText(text) {
      if (!text || !String(text).trim()) {
        return '<p class="jd-paragraph text-muted">Chưa cập nhật nội dung</p>';
      }

      let raw = String(text).trim();
      raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const lines = raw.split('\n');
      const blocks = [];
      let currentBullets = [];

      const flushBullets = () => {
        if (currentBullets.length > 0) {
          const listHtml = currentBullets.map(item => `
            <li class="jd-bullet-item">
              <span class="jd-bullet-dot"></span>
              <span class="jd-bullet-text">${item}</span>
            </li>
          `).join('');
          blocks.push(`<ul class="jd-bullet-list">${listHtml}</ul>`);
          currentBullets = [];
        }
      };

      lines.forEach(rawLine => {
        let line = rawLine.trim();
        if (!line) {
          flushBullets();
          return;
        }

        // Clean redundant repeated symbols (e.g. ---, +++, --)
        line = line.replace(/^[-+*•–⁃]{2,}\s*/, '- ');

        // Check if line starts with a list marker: -, +, *, •, –, ⁃, or numbered: 1., 2)
        const bulletMatch = line.match(/^[-+*•–⁃]\s+(.*)$/) || line.match(/^(\d+[\.\)])\s+(.*)$/);
        if (bulletMatch) {
          let content = bulletMatch[2] !== undefined ? bulletMatch[2] : bulletMatch[1];
          // Further trim leading dashes if clustered
          content = content.replace(/^[-+*•–⁃\s]+/, '').trim();
          if (content) {
            currentBullets.push(content);
          }
        } else {
          // If the line contains squished inline bullet items (e.g., "Kỹ năng: - React - Node.js - Docker")
          if ((line.match(/\s+[-+*•]\s+/g) || []).length >= 1 && !line.startsWith('http')) {
            flushBullets();
            const parts = line.split(/\s+[-+*•]\s+/);
            if (parts[0].trim()) {
              blocks.push(`<p class="jd-paragraph font-medium text-gray-800">${parts[0].trim()}</p>`);
            }
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i].trim();
              if (part) {
                currentBullets.push(part);
              }
            }
          } else {
            flushBullets();
            blocks.push(`<p class="jd-paragraph">${line}</p>`);
          }
        }
      });

      flushBullets();
      return blocks.join('');
    },

    formatJD(text) {
      return this.formatJDText(text);
    },

    // ═══════════════════════════════════════════════════════════════════
    // Utility
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Debounce function execution
     */
    debounce(fn, delay = 300) {
      let timer = null;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Deep clone an object
     */
    deepClone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return obj;
      }
    },
  };
})();
