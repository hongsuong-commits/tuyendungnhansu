/**
 * UI - Reusable UI component factory for ATS System
 * All functions return HTML strings. Uses Lucide icons.
 */
const UI = (() => {
  // Toast counter for unique IDs
  let _toastCounter = 0;

  // Ensure toast container exists
  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Ensure modal backdrop exists
  function ensureModalBackdrop() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'modal-backdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.addEventListener('click', () => {
        const openModals = document.querySelectorAll('.modal.active');
        openModals.forEach((m) => {
          m.classList.remove('active');
        });
        backdrop.classList.remove('active');
      });
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  // Escape HTML to prevent XSS
  function esc(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  return {
    // ═══════════════════════════════════════════════════════════════════
    // Stat Card
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { icon, label, value, trend, color }
     * trend: { value, direction: 'up'|'down' }
     */
    statCard({ icon = 'bar-chart-2', label = '', value = 0, trend = null, color = 'primary' } = {}) {
      const trendHtml = trend
        ? `<span class="stat-trend stat-trend--${trend.direction || 'up'}">
            <i data-lucide="${trend.direction === 'down' ? 'trending-down' : 'trending-up'}"></i>
            ${esc(trend.value)}
          </span>`
        : '';

      return `
        <div class="stat-card stat-card--${esc(color)}">
          <div class="stat-card__icon">
            <i data-lucide="${esc(icon)}"></i>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">${esc(label)}</span>
            <span class="stat-card__value">${esc(value)}</span>
            ${trendHtml}
          </div>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Data Table
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts
     * columns: [{ key, label, sortable, render(value, row), width, align }]
     * data: array of row objects
     * actions: [{ icon, label, handler, className, show(row) }]
     * onSort: function(field, direction)
     * page, perPage, total: pagination
     * onPageChange: function(page)
     * emptyMessage: string
     * id: string
     * sortField, sortDir: current sort state
     */
    dataTable({
      columns = [],
      data = [],
      actions = null,
      onSort = null,
      page = 1,
      perPage = 10,
      total = 0,
      onPageChange = null,
      emptyMessage = 'Không có dữ liệu',
      id = 'data-table',
      sortField = '',
      sortDir = 'asc',
    } = {}) {
      const tableId = esc(id);

      // Build header
      const headerCells = columns
        .map((col) => {
          const style = col.width ? ` style="width:${col.width}"` : '';
          const align = col.align ? ` text-align:${col.align};` : '';
          const styleAttr = col.width || col.align ? ` style="${col.width ? `width:${col.width};` : ''}${align}"` : '';

          if (col.sortable && onSort) {
            const isActive = sortField === col.key;
            const nextDir = isActive && sortDir === 'asc' ? 'desc' : 'asc';
            const sortIcon = isActive
              ? sortDir === 'asc'
                ? '<i data-lucide="chevron-up" class="sort-icon active"></i>'
                : '<i data-lucide="chevron-down" class="sort-icon active"></i>'
              : '<i data-lucide="chevrons-up-down" class="sort-icon"></i>';
            return `<th class="sortable" data-sort-field="${esc(col.key)}" data-sort-dir="${nextDir}"${styleAttr}>
              <span class="th-content">${esc(col.label)} ${sortIcon}</span>
            </th>`;
          }
          return `<th${styleAttr}>${esc(col.label)}</th>`;
        })
        .join('');

      const actionsHeader = actions ? '<th style="width:100px">Thao tác</th>' : '';

      // Build rows
      let bodyHtml = '';
      if (!data || data.length === 0) {
        const colSpan = columns.length + (actions ? 1 : 0);
        bodyHtml = `<tr><td colspan="${colSpan}" class="table-empty">${esc(emptyMessage)}</td></tr>`;
      } else {
        bodyHtml = data
          .map((row, rowIdx) => {
            const cells = columns
              .map((col) => {
                const align = col.align ? ` style="text-align:${col.align}"` : '';
                const val = col.render ? col.render(row[col.key], row, rowIdx) : esc(row[col.key]);
                return `<td${align}>${val}</td>`;
              })
              .join('');

            let actionCell = '';
            if (actions) {
              const btns = actions
                .filter((act) => !act.show || act.show(row))
                .map((act) => {
                  const cls = act.className || 'btn-icon';
                  const handlerAttr = act.handler ? ` data-action="${esc(act.label)}" data-row-id="${esc(row.id)}"` : '';
                  return `<button class="${cls}" title="${esc(act.label)}"${handlerAttr}>
                    <i data-lucide="${esc(act.icon || 'more-horizontal')}"></i>
                  </button>`;
                })
                .join('');
              actionCell = `<td class="table-actions">${btns}</td>`;
            }

            return `<tr data-id="${esc(row.id)}">${cells}${actionCell}</tr>`;
          })
          .join('');
      }

      // Pagination
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const paginationHtml = total > perPage
        ? this.pagination({ page, perPage, total, onChange: onPageChange, tableId })
        : '';

      const infoHtml = total > 0
        ? `<div class="table-info">Hiển thị ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} trên ${total} kết quả</div>`
        : '';

      return `
        <div class="table-wrapper" id="${tableId}-wrapper">
          <table class="data-table" id="${tableId}">
            <thead>
              <tr>${headerCells}${actionsHeader}</tr>
            </thead>
            <tbody>${bodyHtml}</tbody>
          </table>
          <div class="table-footer">
            ${infoHtml}
            ${paginationHtml}
          </div>
        </div>
      `;
    },

    /**
     * Attach sort handlers to a rendered table
     */
    attachTableSortHandlers(tableId, onSort) {
      const wrapper = document.getElementById(tableId + '-wrapper') || document.getElementById(tableId);
      if (!wrapper) return;
      wrapper.querySelectorAll('th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
          const field = th.getAttribute('data-sort-field');
          const dir = th.getAttribute('data-sort-dir');
          if (onSort) onSort(field, dir);
        });
      });
    },

    /**
     * Attach action handlers to table action buttons
     */
    attachTableActionHandlers(tableId, actionMap) {
      const wrapper = document.getElementById(tableId + '-wrapper') || document.getElementById(tableId);
      if (!wrapper) return;
      wrapper.querySelectorAll('.table-actions button[data-action]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const rowId = btn.getAttribute('data-row-id');
          if (actionMap[action]) {
            actionMap[action](rowId);
          }
        });
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // Modal
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { id, title, content, footer, size, onClose }
     * size: 'sm', 'md', 'lg', 'xl'
     */
    modal({ id = 'modal', title = '', content = '', footer = '', size = 'md', onClose = null } = {}) {
      const sizeClass = size ? `modal--${esc(size)}` : '';
      return `
        <div class="modal ${sizeClass}" id="${esc(id)}">
          <div class="modal__dialog">
            <div class="modal__header">
              <h3 class="modal__title">${title}</h3>
              <button class="modal__close" onclick="UI.closeModal('${esc(id)}')" title="Đóng">
                <i data-lucide="x"></i>
              </button>
            </div>
            <div class="modal__body">${content}</div>
            ${footer ? `<div class="modal__footer">${footer}</div>` : ''}
          </div>
        </div>
      `;
    },

    /**
     * Open a modal by ID
     */
    openModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;

      modal.classList.add('active');
      document.body.classList.add('modal-open');

      // Click on backdrop outside modal content closes the modal
      if (!modal._backdropClickAttached) {
        modal._backdropClickAttached = true;
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            UI.closeModal(id);
          }
        });
      }

      // Global escape listener attached once
      if (!window._modalEscListenerAttached) {
        window._modalEscListenerAttached = true;
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
              const lastModal = activeModals[activeModals.length - 1];
              if (lastModal.id) UI.closeModal(lastModal.id);
            }
          }
        });
      }

      // Reinitialize icons inside modal
      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      });
    },

    /**
     * Close a modal by ID
     */
    closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.remove('active');
      }
      // Check if any modals are still open
      const openModals = document.querySelectorAll('.modal.active');
      if (openModals.length === 0) {
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    },

    /**
     * Close all open modals
     */
    closeAllModals() {
      document.querySelectorAll('.modal.active').forEach((m) => m.classList.remove('active'));
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
    },

    // ═══════════════════════════════════════════════════════════════════
    // Confirm Dialog
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Show a confirmation dialog
     */
    confirm({ title = 'Xác nhận', message = '', confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'warning', onConfirm = null } = {}) {
      const confirmId = 'confirm-dialog';

      // Remove existing confirm dialog
      const existing = document.getElementById(confirmId);
      if (existing) existing.remove();

      const iconMap = {
        warning: 'alert-triangle',
        danger: 'alert-circle',
        info: 'info',
        success: 'check-circle',
      };

      const html = `
        <div class="modal modal--sm" id="${confirmId}">
          <div class="modal__dialog modal-dialog modal-sm">
            <div class="modal-content confirm-dialog-content" style="background: #ffffff !important; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #e2e8f0;">
              <div class="modal__body confirm-body p-6 text-center" style="background: #ffffff !important; padding: 28px 24px; text-align: center;">
                <div class="confirm-icon confirm-icon--${esc(type)}" style="margin: 0 auto 16px;">
                  <i data-lucide="${iconMap[type] || 'alert-triangle'}"></i>
                </div>
                <h3 class="confirm-title" style="color: #0f172a !important; font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">${esc(title)}</h3>
                <p class="confirm-message" style="color: #475569 !important; font-size: 0.92rem; line-height: 1.6; margin: 0;">${esc(message)}</p>
              </div>
              <div class="modal__footer confirm-footer" style="background: #f8fafc !important; padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-secondary" id="confirm-cancel-btn">${esc(cancelText)}</button>
                <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" id="confirm-ok-btn">${esc(confirmText)}</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);
      this.openModal(confirmId);

      // Attach handlers
      document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
        this.closeModal(confirmId);
        setTimeout(() => {
          const el = document.getElementById(confirmId);
          if (el) el.remove();
        }, 300);
      });

      document.getElementById('confirm-ok-btn').addEventListener('click', () => {
        this.closeModal(confirmId);
        setTimeout(() => {
          const el = document.getElementById(confirmId);
          if (el) el.remove();
        }, 300);
        if (onConfirm) onConfirm();
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // Toast Notification
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Show a toast notification
     * @param {Object} opts - { message, type, duration }
     * type: 'success', 'error', 'warning', 'info'
     */
    toast({ message = '', type = 'info', duration = 3000 } = {}) {
      const container = ensureToastContainer();
      _toastCounter++;
      const toastId = 'toast-' + _toastCounter;

      const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info',
      };

      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <div class="toast__icon">
          <i data-lucide="${iconMap[type] || 'info'}"></i>
        </div>
        <div class="toast__message">${esc(message)}</div>
        <button class="toast__close" onclick="this.closest('.toast').remove()">
          <i data-lucide="x"></i>
        </button>
      `;

      container.appendChild(toast);

      // Initialize icons in toast
      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
        // Trigger animation
        requestAnimationFrame(() => {
          toast.classList.add('toast--visible');
        });
      });

      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => {
          toast.classList.remove('toast--visible');
          toast.classList.add('toast--hiding');
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 300);
        }, duration);
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // Form Elements
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Create a form group (label + input)
     * @param {Object} opts - { label, name, type, value, placeholder, required, error, options, rows, disabled, min, max, step, accept, multiple, helpText }
     * type: 'text', 'email', 'tel', 'number', 'date', 'datetime-local', 'textarea', 'select', 'checkbox', 'radio', 'password', 'file', 'hidden'
     * options: [{ value, label, selected }] for select/radio
     */
    formGroup({
      label = '',
      name = '',
      type = 'text',
      value = '',
      placeholder = '',
      required = false,
      error = '',
      options = [],
      rows = 4,
      disabled = false,
      min = '',
      max = '',
      step = '',
      accept = '',
      multiple = false,
      helpText = '',
      id = '',
    } = {}) {
      const inputId = id || `field-${esc(name)}`;
      const reqAttr = required ? ' required' : '';
      const disAttr = disabled ? ' disabled' : '';
      const errorClass = error ? ' has-error' : '';
      const reqMark = required ? ' <span class="required-mark">*</span>' : '';
      const safeValue = esc(value);

      let inputHtml = '';

      switch (type) {
        case 'textarea':
          inputHtml = `<textarea id="${inputId}" name="${esc(name)}" class="form-control${errorClass}" 
            rows="${rows}" placeholder="${esc(placeholder)}"${reqAttr}${disAttr}>${safeValue}</textarea>`;
          break;

        case 'select':
          const opts = options
            .map((opt) => {
              const sel = String(opt.value) === String(value) ? ' selected' : '';
              return `<option value="${esc(opt.value)}"${sel}>${esc(opt.label)}</option>`;
            })
            .join('');
          inputHtml = `<select id="${inputId}" name="${esc(name)}" class="form-control${errorClass}"${reqAttr}${disAttr}>
            <option value="">${esc(placeholder || '-- Chọn --')}</option>
            ${opts}
          </select>`;
          break;

        case 'checkbox':
          const chk = value ? ' checked' : '';
          inputHtml = `<label class="checkbox-label">
            <input type="checkbox" id="${inputId}" name="${esc(name)}" class="form-checkbox"${chk}${disAttr}>
            <span class="checkbox-text">${label}${reqMark}</span>
          </label>`;
          // No outer label for checkbox
          return `<div class="form-group${errorClass}">
            ${inputHtml}
            ${error ? `<span class="form-error">${esc(error)}</span>` : ''}
            ${helpText ? `<span class="form-help">${esc(helpText)}</span>` : ''}
          </div>`;

        case 'radio':
          const radios = options
            .map((opt) => {
              const sel = String(opt.value) === String(value) ? ' checked' : '';
              return `<label class="radio-label">
                <input type="radio" name="${esc(name)}" value="${esc(opt.value)}" class="form-radio"${sel}${disAttr}>
                <span class="radio-text">${esc(opt.label)}</span>
              </label>`;
            })
            .join('');
          inputHtml = `<div class="radio-group">${radios}</div>`;
          break;

        case 'file':
          inputHtml = `<input type="file" id="${inputId}" name="${esc(name)}" class="form-control-file"
            ${accept ? `accept="${esc(accept)}"` : ''}${multiple ? ' multiple' : ''}${disAttr}>`;
          break;

        case 'hidden':
          return `<input type="hidden" id="${inputId}" name="${esc(name)}" value="${safeValue}">`;

        default:
          const extraAttrs = [];
          if (min !== '') extraAttrs.push(`min="${esc(min)}"`);
          if (max !== '') extraAttrs.push(`max="${esc(max)}"`);
          if (step !== '') extraAttrs.push(`step="${esc(step)}"`);
          inputHtml = `<input type="${esc(type)}" id="${inputId}" name="${esc(name)}" class="form-control${errorClass}" 
            value="${safeValue}" placeholder="${esc(placeholder)}"${reqAttr}${disAttr} ${extraAttrs.join(' ')}>`;
          break;
      }

      return `
        <div class="form-group${errorClass}">
          ${label ? `<label class="form-label" for="${inputId}">${label}${reqMark}</label>` : ''}
          ${inputHtml}
          ${error ? `<span class="form-error">${esc(error)}</span>` : ''}
          ${helpText ? `<span class="form-help">${esc(helpText)}</span>` : ''}
        </div>
      `;
    },

    /**
     * Wrap children side by side in a form row
     */
    formRow(children) {
      const content = Array.isArray(children) ? children.join('') : children;
      return `<div class="form-row">${content}</div>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Filter Bar
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts
     * filters: [{ name, label, type: 'select'|'date'|'text', options, value, placeholder }]
     * onFilter: function(name, value)
     * onSearch: function(query)
     * searchPlaceholder: string
     */
    filterBar({ filters = [], onFilter = null, onSearch = null, searchPlaceholder = 'Tìm kiếm...' } = {}) {
      const filterInputs = filters
        .map((f) => {
          if (f.type === 'select') {
            const opts = (f.options || [])
              .map((opt) => {
                const sel = String(opt.value) === String(f.value || '') ? ' selected' : '';
                return `<option value="${esc(opt.value)}"${sel}>${esc(opt.label)}</option>`;
              })
              .join('');
            return `<select class="filter-select" data-filter="${esc(f.name)}">
              <option value="">${esc(f.placeholder || f.label || '-- Tất cả --')}</option>
              ${opts}
            </select>`;
          }
          if (f.type === 'date') {
            return `<input type="date" class="filter-date" data-filter="${esc(f.name)}" 
              value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || f.label || '')}">`;
          }
          return `<input type="text" class="filter-input" data-filter="${esc(f.name)}" 
            value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || f.label || '')}">`;
        })
        .join('');

      return `
        <div class="filter-bar">
          <div class="filter-bar__search">
            <i data-lucide="search"></i>
            <input type="text" class="filter-bar__search-input" placeholder="${esc(searchPlaceholder)}" id="filter-search-input">
          </div>
          <div class="filter-bar__filters">
            ${filterInputs}
          </div>
        </div>
      `;
    },

    /**
     * Attach filter bar event handlers
     */
    attachFilterHandlers(onSearch, onFilter) {
      const searchInput = document.getElementById('filter-search-input');
      if (searchInput && onSearch) {
        const debounced = Helpers.debounce((e) => onSearch(e.target.value), 300);
        searchInput.addEventListener('input', debounced);
      }

      if (onFilter) {
        document.querySelectorAll('.filter-select, .filter-date, .filter-input[data-filter]').forEach((el) => {
          el.addEventListener('change', () => {
            const name = el.getAttribute('data-filter');
            onFilter(name, el.value);
          });
        });
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // Badge
    // ═══════════════════════════════════════════════════════════════════
    badge(text, type = 'default') {
      return `<span class="badge badge--${esc(type)}">${esc(text)}</span>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Status Badge (with dot indicator)
    // ═══════════════════════════════════════════════════════════════════
    statusBadge(status) {
      const label = Helpers.getStatusLabel(status);
      const color = Helpers.getStatusColor(status);
      return `<span class="status-badge ${esc(color)}">
        <span class="status-badge__dot"></span>
        ${esc(label)}
      </span>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Tabs
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { items, activeId, onChange }
     * items: [{ id, label, icon, count }]
     */
    tabs({ items = [], activeId = '', onChange = null } = {}) {
      const tabItems = items
        .map((item) => {
          const active = item.id === activeId ? ' active' : '';
          const icon = item.icon ? `<i data-lucide="${esc(item.icon)}"></i>` : '';
          const count = item.count !== undefined ? `<span class="tab-count">${esc(item.count)}</span>` : '';
          return `<button class="tab-item${active}" data-tab="${esc(item.id)}">
            ${icon}
            <span>${esc(item.label)}</span>
            ${count}
          </button>`;
        })
        .join('');

      return `<div class="tabs">${tabItems}</div>`;
    },

    /**
     * Attach tab change handlers
     */
    attachTabHandlers(onChange) {
      document.querySelectorAll('.tab-item').forEach((tab) => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.tab-item').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          if (onChange) onChange(tab.getAttribute('data-tab'));
        });
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // Empty State
    // ═══════════════════════════════════════════════════════════════════
    emptyState({ icon = 'inbox', title = 'Không có dữ liệu', description = '', actionText = '', onAction = null } = {}) {
      const actionBtn = actionText
        ? `<button class="btn btn--primary empty-state__action">${esc(actionText)}</button>`
        : '';
      return `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="${esc(icon)}"></i>
          </div>
          <h3 class="empty-state__title">${esc(title)}</h3>
          ${description ? `<p class="empty-state__desc">${esc(description)}</p>` : ''}
          ${actionBtn}
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Loading Spinner
    // ═══════════════════════════════════════════════════════════════════
    spinner(size = 'md') {
      return `<div class="spinner spinner--${esc(size)}"><div class="spinner__circle"></div></div>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Pagination
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { page, perPage, total, onChange, tableId }
     */
    pagination({ page = 1, perPage = 10, total = 0, onChange = null, tableId = '' } = {}) {
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      if (totalPages <= 1) return '';

      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, page - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      // Previous button
      pages.push(`<button class="pagination__btn${page <= 1 ? ' disabled' : ''}" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>
        <i data-lucide="chevron-left"></i>
      </button>`);

      // First page + ellipsis
      if (start > 1) {
        pages.push(`<button class="pagination__btn" data-page="1">1</button>`);
        if (start > 2) {
          pages.push(`<span class="pagination__ellipsis">...</span>`);
        }
      }

      // Page numbers
      for (let i = start; i <= end; i++) {
        const active = i === page ? ' active' : '';
        pages.push(`<button class="pagination__btn${active}" data-page="${i}">${i}</button>`);
      }

      // Last page + ellipsis
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push(`<span class="pagination__ellipsis">...</span>`);
        }
        pages.push(`<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`);
      }

      // Next button
      pages.push(`<button class="pagination__btn${page >= totalPages ? ' disabled' : ''}" data-page="${page + 1}"${page >= totalPages ? ' disabled' : ''}>
        <i data-lucide="chevron-right"></i>
      </button>`);

      const paginationId = tableId ? `pagination-${tableId}` : 'pagination';
      return `<div class="pagination" id="${esc(paginationId)}">${pages.join('')}</div>`;
    },

    /**
     * Attach pagination click handlers
     */
    attachPaginationHandlers(onChange, tableId = '') {
      const paginationId = tableId ? `pagination-${tableId}` : 'pagination';
      const container = document.getElementById(paginationId);
      if (!container || !onChange) return;
      container.querySelectorAll('.pagination__btn:not(.disabled)').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = parseInt(btn.getAttribute('data-page'), 10);
          if (!isNaN(p)) onChange(p);
        });
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // Dropdown Menu
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts
     * trigger: HTML string for trigger button
     * items: [{ label, icon, handler, divider, disabled, className }]
     */
    dropdown({ trigger = '', items = [] } = {}) {
      const menuItems = items
        .map((item) => {
          if (item.divider) return '<div class="dropdown__divider"></div>';
          const icon = item.icon ? `<i data-lucide="${esc(item.icon)}"></i>` : '';
          const cls = item.className || '';
          const disAttr = item.disabled ? ' disabled' : '';
          return `<button class="dropdown__item ${cls}" data-dropdown-action="${esc(item.label)}"${disAttr}>
            ${icon}
            <span>${esc(item.label)}</span>
          </button>`;
        })
        .join('');

      return `
        <div class="dropdown">
          <button class="dropdown__trigger">${trigger}</button>
          <div class="dropdown__menu">${menuItems}</div>
        </div>
      `;
    },

    /**
     * Initialize dropdown toggle behavior (call once after render)
     */
    initDropdowns() {
      // Close all dropdowns on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
          document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
        }
      });

      document.querySelectorAll('.dropdown__trigger').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = trigger.closest('.dropdown');
          const isOpen = dropdown.classList.contains('open');
          // Close all other dropdowns
          document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
          if (!isOpen) dropdown.classList.add('open');
        });
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // Avatar
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { name, size, src }
     * Shows initials if no src provided
     */
    avatar({ name = '', size = 'md', src = '' } = {}) {
      if (src) {
        return `<div class="avatar avatar--${esc(size)}">
          <img src="${esc(src)}" alt="${esc(name)}">
        </div>`;
      }

      // Generate initials
      const words = String(name).trim().split(/\s+/);
      let initials = '';
      if (words.length >= 2) {
        initials = words[0][0] + words[words.length - 1][0];
      } else if (words.length === 1 && words[0]) {
        initials = words[0].substring(0, 2);
      } else {
        initials = '?';
      }
      initials = initials.toUpperCase();

      // Generate a consistent color from name
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#2563eb'];
      const bgColor = colors[Math.abs(hash) % colors.length];

      return `<div class="avatar avatar--${esc(size)}" style="background-color:${bgColor}">
        <span class="avatar__initials">${esc(initials)}</span>
      </div>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Progress Bar
    // ═══════════════════════════════════════════════════════════════════
    progressBar(value = 0, max = 100, color = 'primary') {
      const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
      return `
        <div class="progress-bar">
          <div class="progress-bar__fill progress-bar--${esc(color)}" style="width:${percent}%"></div>
          <span class="progress-bar__label">${percent}%</span>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Score Display
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Display a screening score with visual indicator
     */
    scoreDisplay(score) {
      if (score === null || score === undefined) return '<span class="score score--na">N/A</span>';
      const numScore = Number(score);
      let cls = 'score--low';
      if (numScore >= 80) cls = 'score--high';
      else if (numScore >= 60) cls = 'score--medium';
      else if (numScore >= 40) cls = 'score--fair';

      return `
        <div class="score ${cls}">
          <svg class="score__ring" viewBox="0 0 36 36">
            <path class="score__ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="score__ring-fill" stroke-dasharray="${numScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="score__value">${Math.round(numScore)}</span>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Timeline
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Array} events - [{ date, title, description, icon, type }]
     */
    timeline(events = []) {
      if (!events || events.length === 0) {
        return '<div class="timeline-empty">Chưa có lịch sử</div>';
      }

      const items = events
        .map((event, idx) => {
          const icon = event.icon || 'circle';
          const type = event.type || 'default';
          const dateStr = event.date ? Helpers.formatDateTime(event.date) : '';
          return `
            <div class="timeline__item timeline__item--${esc(type)}">
              <div class="timeline__dot">
                <i data-lucide="${esc(icon)}"></i>
              </div>
              <div class="timeline__content">
                <div class="timeline__header">
                  <span class="timeline__title">${esc(event.title)}</span>
                  <span class="timeline__date">${esc(dateStr)}</span>
                </div>
                ${event.description ? `<p class="timeline__desc">${esc(event.description)}</p>` : ''}
                ${event.user ? `<span class="timeline__user"><i data-lucide="user"></i> ${esc(event.user)}</span>` : ''}
              </div>
            </div>
          `;
        })
        .join('');

      return `<div class="timeline">${items}</div>`;
    },

    // ═══════════════════════════════════════════════════════════════════
    // File Upload
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { accept, onUpload, label }
     */
    fileUpload({ accept = '*', onUpload = null, label = 'Kéo thả tệp vào đây hoặc nhấn để chọn', id = 'file-upload' } = {}) {
      return `
        <div class="file-upload" id="${esc(id)}">
          <input type="file" class="file-upload__input" id="${esc(id)}-input" accept="${esc(accept)}" multiple>
          <div class="file-upload__area">
            <i data-lucide="upload-cloud"></i>
            <p class="file-upload__label">${esc(label)}</p>
            <span class="file-upload__hint">Hỗ trợ: ${esc(accept === '*' ? 'Tất cả định dạng' : accept)}</span>
          </div>
          <div class="file-upload__list" id="${esc(id)}-list"></div>
        </div>
      `;
    },

    /**
     * Initialize file upload drag & drop behavior
     */
    initFileUpload(id = 'file-upload', onUpload = null) {
      const container = document.getElementById(id);
      const input = document.getElementById(id + '-input');
      const listEl = document.getElementById(id + '-list');
      if (!container || !input) return;

      const area = container.querySelector('.file-upload__area');

      // Click to open file dialog
      area.addEventListener('click', () => input.click());

      // Drag & drop
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
      });
      area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
      });
      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
      });

      // File input change
      input.addEventListener('change', () => {
        handleFiles(input.files);
      });

      function handleFiles(files) {
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files);

        // Show file names in list
        if (listEl) {
          fileArray.forEach((file) => {
            const item = document.createElement('div');
            item.className = 'file-upload__item';
            item.innerHTML = `
              <i data-lucide="file"></i>
              <span>${esc(file.name)}</span>
              <span class="file-upload__size">${(file.size / 1024).toFixed(1)} KB</span>
            `;
            listEl.appendChild(item);
          });
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        if (onUpload) onUpload(fileArray);
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // Search Input
    // ═══════════════════════════════════════════════════════════════════
    searchInput({ placeholder = 'Tìm kiếm...', value = '', onChange = null, id = 'search-input' } = {}) {
      return `
        <div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" class="search-input" id="${esc(id)}" placeholder="${esc(placeholder)}" value="${esc(value)}">
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Page Header
    // ═══════════════════════════════════════════════════════════════════
    /**
     * @param {Object} opts - { title, subtitle, breadcrumb, actions }
     * breadcrumb: [{ label, href }]
     * actions: HTML string of action buttons
     */
    pageHeader({ title = '', subtitle = '', breadcrumb = [], actions = '' } = {}) {
      let breadcrumbHtml = '';
      if (breadcrumb && breadcrumb.length > 0) {
        const crumbs = breadcrumb
          .map((item, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            if (isLast) {
              return `<span class="breadcrumb__item active">${esc(item.label)}</span>`;
            }
            const href = item.href || '#/dashboard';
            return `<a class="breadcrumb__item" href="${esc(href)}">${esc(item.label)}</a>
              <i data-lucide="chevron-right" class="breadcrumb__sep"></i>`;
          })
          .join('');
        breadcrumbHtml = `<nav class="breadcrumb">${crumbs}</nav>`;
      }

      return `
        <div class="page-header">
          ${breadcrumbHtml}
          <div class="page-header__row">
            <div class="page-header__info">
              <h1 class="page-header__title">${esc(title)}</h1>
              ${subtitle ? `<p class="page-header__subtitle">${esc(subtitle)}</p>` : ''}
            </div>
            ${actions ? `<div class="page-header__actions">${actions}</div>` : ''}
          </div>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Detail Row (label: value pair)
    // ═══════════════════════════════════════════════════════════════════
    detailRow(label, value) {
      return `
        <div class="detail-row">
          <span class="detail-row__label">${esc(label)}</span>
          <span class="detail-row__value">${value !== undefined && value !== null ? value : '—'}</span>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Section Divider
    // ═══════════════════════════════════════════════════════════════════
    section(title, content = '') {
      return `
        <div class="section">
          <h3 class="section__title">${esc(title)}</h3>
          <div class="section__content">${content}</div>
        </div>
      `;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Utility: Reinitialize icons after dynamic render
    // ═══════════════════════════════════════════════════════════════════
    refreshIcons() {
      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      });
    },
  };
})();
