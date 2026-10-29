/**
 * ATS System - Authentication & Authorization Module
 * Handles login/logout, session management, role-based access control,
 * and granular permissions for all user roles.
 */

(function () {
    'use strict';

    // ───────────────────────────────────────────────
    // Page Access Map
    // ───────────────────────────────────────────────
    const PAGE_ACCESS = {
        'dashboard': ['director', 'department_head', 'hr'],
        'requisitions': ['director', 'department_head', 'hr'],
        'postings': ['director', 'hr'],
        'candidates': ['director', 'department_head', 'hr'],
        'screening': ['hr'],
        'interviews': ['director', 'department_head', 'hr'],
        'evaluations': ['director', 'department_head', 'hr'],
        'reports': ['director', 'hr'],
        'users': ['director', 'hr'],
        'settings': ['hr'],
        'portal': ['candidate', null] // null = public access
    };

    // ───────────────────────────────────────────────
    // Role Permissions Definition
    // ───────────────────────────────────────────────
    const ROLE_PERMISSIONS = {
        director: {
            view: [
                'dashboard', 'requisitions', 'postings', 'candidates',
                'applications', 'interviews', 'evaluations', 'reports', 'users'
            ],
            create: [],
            edit: ['own_profile'],
            delete: [],
            approve: [],
            special: ['view_all_departments']
        },

        department_head: {
            view: [
                'dashboard', 'requisitions', 'candidates',
                'interviews', 'evaluations'
            ],
            create: ['requisitions'],
            edit: ['own_requisitions', 'own_profile'],
            delete: [],
            approve: [],
            special: ['evaluate_candidates', 'view_own_department']
        },

        hr: {
            view: [
                'dashboard', 'requisitions', 'postings', 'candidates',
                'applications', 'screening', 'interviews', 'evaluations',
                'reports', 'settings'
            ],
            create: [
                'postings', 'screening_criteria', 'interviews',
                'applications', 'candidates'
            ],
            edit: [
                'applications', 'candidate_status', 'interviews',
                'postings', 'own_profile', 'settings'
            ],
            delete: ['postings', 'interviews'],
            approve: ['applications'],
            special: [
                'review_applications', 'reject_applications',
                'schedule_interviews', 'manage_candidates',
                'view_all_departments'
            ]
        },

        candidate: {
            view: ['portal', 'own_applications', 'own_profile', 'public_jobs'],
            create: ['applications'],
            edit: ['own_profile'],
            delete: [],
            approve: [],
            special: []
        }
    };

    // ───────────────────────────────────────────────
    // Menu Configuration per Role
    // ───────────────────────────────────────────────
    const ROLE_MENUS = {
        director: [
            { id: 'dashboard',    label: 'Tổng quan',            icon: '📊', page: 'dashboard' },
            { id: 'requisitions', label: 'Yêu cầu tuyển dụng',  icon: '📋', page: 'requisitions' },
            { id: 'postings',     label: 'Vị trí tuyển dụng',   icon: '📢', page: 'postings' },
            { id: 'candidates',   label: 'Danh sách ứng viên',  icon: '👥', page: 'candidates' },
            { id: 'interviews',   label: 'Lịch phỏng vấn',      icon: '📅', page: 'interviews' },
            { id: 'evaluations',  label: 'Đánh giá',            icon: '⭐', page: 'evaluations' },
            { id: 'reports',      label: 'Báo cáo',             icon: '📈', page: 'reports' }
        ],

        department_head: [
            { id: 'dashboard',    label: 'Tổng quan',            icon: '📊', page: 'dashboard' },
            { id: 'requisitions', label: 'Yêu cầu tuyển dụng',  icon: '📋', page: 'requisitions' },
            { id: 'candidates',   label: 'Ứng viên phòng ban',  icon: '👥', page: 'candidates' },
            { id: 'interviews',   label: 'Lịch phỏng vấn',      icon: '📅', page: 'interviews' },
            { id: 'evaluations',  label: 'Đánh giá ứng viên',   icon: '⭐', page: 'evaluations' }
        ],

        hr: [
            { id: 'dashboard',    label: 'Tổng quan',            icon: '📊', page: 'dashboard' },
            { id: 'requisitions', label: 'Yêu cầu tuyển dụng',  icon: '📋', page: 'requisitions' },
            { id: 'postings',     label: 'Tin tuyển dụng',       icon: '📢', page: 'postings' },
            { id: 'candidates',   label: 'Danh sách ứng viên',  icon: '👥', page: 'candidates' },
            { id: 'screening',    label: 'Sàng lọc CV',          icon: '🔍', page: 'screening' },
            { id: 'interviews',   label: 'Lịch phỏng vấn',      icon: '📅', page: 'interviews' },
            { id: 'evaluations',  label: 'Đánh giá ứng viên',   icon: '⭐', page: 'evaluations' },
            { id: 'reports',      label: 'Báo cáo',             icon: '📈', page: 'reports' },
            { id: 'settings',     label: 'Cài đặt',             icon: '⚙️', page: 'settings' }
        ],

        candidate: []
        // Candidate uses portal layout, not sidebar menus
    };

    // ───────────────────────────────────────────────
    // Session Constants
    // ───────────────────────────────────────────────
    const SESSION_KEY = 'ats_session';
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    // ───────────────────────────────────────────────
    // AuthManager Class
    // ───────────────────────────────────────────────
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.init();
        }

        // ── Initialization ──────────────────────────

        /**
         * Check localStorage for an existing valid session and restore it.
         */
        init() {
            try {
                const raw = localStorage.getItem(SESSION_KEY);
                if (!raw) return;

                const session = JSON.parse(raw);

                // Check expiration
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    this._clearSession();
                    return;
                }

                // Look up the user from the store
                const store = this._getStore();
                if (!store) return;

                const user = store.getById('users', session.userId);
                if (!user) {
                    this._clearSession();
                    return;
                }

                // Check if the account is still active
                if (user.status === 'inactive' || user.status === 'disabled') {
                    this._clearSession();
                    return;
                }

                this.currentUser = user;
            } catch (e) {
                console.error('[AuthManager] Failed to restore session:', e);
                this._clearSession();
            }
        }

        // ── Authentication ──────────────────────────

        /**
         * Authenticate user with email and password.
         * @param {string} email
         * @param {string} password
         * @returns {{ success: boolean, user?: object, error?: string }}
         */
        login(email, password) {
            // Validate email format
            if (!email || !this._isValidEmail(email)) {
                return { success: false, error: 'Email không hợp lệ' };
            }

            // Validate password presence
            if (!password || password.trim() === '') {
                return { success: false, error: 'Vui lòng nhập mật khẩu' };
            }

            // Look up user from store
            const store = this._getStore();
            if (!store) {
                return { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại sau.' };
            }

            const users = store.getAll('users') || [];
            const user = users.find(u =>
                u.email && u.email.toLowerCase() === email.toLowerCase()
            );

            if (!user || user.password !== password) {
                return { success: false, error: 'Email hoặc mật khẩu không đúng' };
            }

            // Check if account is disabled
            if (user.status === 'inactive' || user.status === 'disabled') {
                return { success: false, error: 'Tài khoản đã bị vô hiệu hóa' };
            }

            // Create session
            const now = Date.now();
            const session = {
                userId: user.id,
                role: user.role,
                loginAt: now,
                expiresAt: now + SESSION_DURATION_MS
            };

            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            this.currentUser = user;

            return { success: true, user: this._sanitizeUser(user) };
        }

        /**
         * Clear session and redirect to login page.
         */
        logout() {
            this._clearSession();
            this.currentUser = null;

            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = 'login.html';
            }
        }

        // ── User Information ────────────────────────

        /**
         * Return the current authenticated user object (sanitized).
         * @returns {object|null}
         */
        getCurrentUser() {
            if (!this.currentUser) return null;
            return this._sanitizeUser(this.currentUser);
        }

        /**
         * Check if a user is currently authenticated with a valid session.
         * @returns {boolean}
         */
        isLoggedIn() {
            if (!this.currentUser) return false;

            // Double-check session validity
            try {
                const raw = localStorage.getItem(SESSION_KEY);
                if (!raw) {
                    this.currentUser = null;
                    return false;
                }

                const session = JSON.parse(raw);
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    this._clearSession();
                    this.currentUser = null;
                    return false;
                }

                return true;
            } catch (e) {
                this.currentUser = null;
                return false;
            }
        }

        /**
         * Get the current user's department.
         * @returns {string|null}
         */
        getUserDepartment() {
            if (!this.currentUser) return null;
            return this.currentUser.department || null;
        }

        /**
         * Check if a piece of data belongs to the current user.
         * @param {string} userId
         * @returns {boolean}
         */
        isOwnData(userId) {
            if (!this.currentUser) return false;
            return this.currentUser.id === userId;
        }

        // ── Role & Permission Checks ────────────────

        /**
         * Check if the current user has a specific role.
         * @param {string} role
         * @returns {boolean}
         */
        hasRole(role) {
            if (!this.currentUser) return false;
            return this.currentUser.role === role;
        }

        /**
         * Check if the current user has a specific granular permission.
         * Permission format: "action:resource" (e.g. "create:requisitions", "view:dashboard")
         * @param {string} permission
         * @returns {boolean}
         */
        hasPermission(permission) {
            if (!this.currentUser) return false;

            const role = this.currentUser.role;
            const perms = ROLE_PERMISSIONS[role];
            if (!perms) return false;

            // Support "action:resource" format
            const parts = permission.split(':');
            if (parts.length === 2) {
                const [action, resource] = parts;

                // Check in the appropriate action array
                if (perms[action] && Array.isArray(perms[action])) {
                    return perms[action].includes(resource);
                }

                // Also check 'special' permissions
                if (perms.special && perms.special.includes(permission)) {
                    return true;
                }

                return false;
            }

            // Support single-word permission — search all categories
            for (const category of Object.values(perms)) {
                if (Array.isArray(category) && category.includes(permission)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Check if the current user can access a specific page.
         * @param {string} page
         * @returns {boolean}
         */
        canAccess(page) {
            if (!page) return false;

            const allowedRoles = PAGE_ACCESS[page];

            // Page not in the access map — deny by default
            if (!allowedRoles) return false;

            // Public pages (null in the allowed list)
            if (allowedRoles.includes(null)) return true;

            // Must be logged in for non-public pages
            if (!this.currentUser) return false;

            return allowedRoles.includes(this.currentUser.role);
        }

        /**
         * Check if the current user can perform a specific action on a resource.
         * Handles department-scoped checks for department_head role.
         * @param {string} action  - e.g. 'view', 'create', 'edit', 'delete', 'approve'
         * @param {string} resource - e.g. 'requisitions', 'postings', 'candidates'
         * @param {object} [context] - optional context with departmentId, ownerId, status, etc.
         * @returns {boolean}
         */
        canPerform(action, resource, context) {
            if (!this.currentUser) return false;

            const role = this.currentUser.role;
            const perms = ROLE_PERMISSIONS[role];
            if (!perms) return false;

            // Check basic permission
            const actionPerms = perms[action];
            if (!actionPerms || !Array.isArray(actionPerms)) {
                // Check special permissions as a fallback
                const specialKey = `${action}_${resource}`;
                if (perms.special && perms.special.includes(specialKey)) {
                    return true;
                }
                return false;
            }

            const hasBasicPerm = actionPerms.includes(resource);
            if (!hasBasicPerm) {
                // Check for "own_" prefixed permissions
                const ownKey = `own_${resource}`;
                if (!actionPerms.includes(ownKey)) return false;

                // "own_" permission requires context check
                if (context) {
                    // Check ownership
                    if (context.ownerId && context.ownerId !== this.currentUser.id) {
                        return false;
                    }

                    // For department_head editing requisitions, check status
                    if (role === 'department_head' && resource === 'requisitions' && action === 'edit') {
                        if (context.status && context.status !== 'pending' && context.status !== 'draft') {
                            return false;
                        }
                    }
                }

                return true;
            }

            // Department-scoped checks for department_head
            if (role === 'department_head' && context && context.departmentId) {
                // department_head can only act on their own department's data
                if (!perms.special.includes('view_all_departments')) {
                    const userDept = this.getUserDepartment();
                    if (userDept && context.departmentId !== userDept) {
                        return false;
                    }
                }
            }

            return true;
        }

        // ── Menu Configuration ──────────────────────

        /**
         * Get the menu items for the current user's role.
         * Optionally includes badge counts from the store.
         * @returns {Array<{ id: string, label: string, icon: string, page: string, badge?: number }>}
         */
        getMenuItems() {
            if (!this.currentUser) return [];

            const role = this.currentUser.role;
            const items = ROLE_MENUS[role];
            if (!items) return [];

            // Clone and optionally attach badge counts
            return items.map(item => {
                const menuItem = { ...item };
                const badgeCount = this._getBadgeCount(item.id, role);
                if (badgeCount > 0) {
                    menuItem.badge = badgeCount;
                }
                return menuItem;
            });
        }

        // ── Static Accessors ────────────────────────

        /**
         * Get the page access map.
         * @returns {object}
         */
        getPageAccessMap() {
            return { ...PAGE_ACCESS };
        }

        /**
         * Get the permission definitions for a specific role.
         * @param {string} role
         * @returns {object|null}
         */
        getRolePermissions(role) {
            const perms = ROLE_PERMISSIONS[role];
            return perms ? { ...perms } : null;
        }

        // ── Private Helpers ─────────────────────────

        /**
         * Get the ATSStore instance.
         * @private
         * @returns {object|null}
         */
        _getStore() {
            if (typeof window !== 'undefined' && window.ATSStore) {
                return window.ATSStore;
            }
            return null;
        }

        /**
         * Clear the session from localStorage.
         * @private
         */
        _clearSession() {
            try {
                localStorage.removeItem(SESSION_KEY);
            } catch (e) {
                console.error('[AuthManager] Failed to clear session:', e);
            }
        }

        /**
         * Validate email format.
         * @private
         * @param {string} email
         * @returns {boolean}
         */
        _isValidEmail(email) {
            if (!email || typeof email !== 'string') return false;
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email.trim());
        }

        /**
         * Return a user object without sensitive fields (e.g. password).
         * @private
         * @param {object} user
         * @returns {object}
         */
        _sanitizeUser(user) {
            if (!user) return null;
            const { password, ...safe } = user;
            return safe;
        }

        /**
         * Compute badge counts for a menu item based on role-specific logic.
         * @private
         * @param {string} menuId
         * @param {string} role
         * @returns {number}
         */
        _getBadgeCount(menuId, role) {
            const store = this._getStore();
            if (!store) return 0;

            try {
                switch (menuId) {
                    case 'requisitions': {
                        const requisitions = store.getAll('requisitions') || [];
                        if (role === 'hr') {
                            // Count pending requisitions that need HR processing
                            return requisitions.filter(r => r.status === 'approved' && !r.postingCreated).length;
                        }
                        if (role === 'department_head') {
                            // Count own pending requisitions
                            const dept = this.getUserDepartment();
                            return requisitions.filter(r =>
                                r.department === dept && r.status === 'pending'
                            ).length;
                        }
                        if (role === 'director') {
                            // Count requisitions awaiting director approval
                            return requisitions.filter(r => r.status === 'pending').length;
                        }
                        return 0;
                    }

                    case 'candidates': {
                        const candidates = store.getAll('candidates') || [];
                        if (role === 'hr') {
                            // Count new candidates needing screening
                            return candidates.filter(c => c.status === 'new' || c.status === 'applied').length;
                        }
                        return 0;
                    }

                    case 'screening': {
                        const applications = store.getAll('applications') || [];
                        // Count applications awaiting screening
                        return applications.filter(a => a.status === 'submitted' || a.status === 'new').length;
                    }

                    case 'interviews': {
                        const interviews = store.getAll('interviews') || [];
                        const today = new Date().toISOString().split('T')[0];
                        if (role === 'department_head') {
                            const dept = this.getUserDepartment();
                            return interviews.filter(i =>
                                i.department === dept &&
                                i.date === today &&
                                i.status !== 'completed' && i.status !== 'cancelled'
                            ).length;
                        }
                        // Count today's upcoming interviews
                        return interviews.filter(i =>
                            i.date === today &&
                            i.status !== 'completed' && i.status !== 'cancelled'
                        ).length;
                    }

                    case 'evaluations': {
                        const evaluations = store.getAll('evaluations') || [];
                        // Count pending evaluations
                        if (role === 'department_head') {
                            const dept = this.getUserDepartment();
                            return evaluations.filter(e =>
                                e.department === dept && e.status === 'pending'
                            ).length;
                        }
                        return evaluations.filter(e => e.status === 'pending').length;
                    }

                    default:
                        return 0;
                }
            } catch (e) {
                console.warn('[AuthManager] Badge count error for', menuId, e);
                return 0;
            }
        }
    }

    // ───────────────────────────────────────────────
    // Export as global singleton
    // ───────────────────────────────────────────────
    window.AuthManager = new AuthManager();

})();
