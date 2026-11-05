/**
 * postings.js - Module Quản lý Vị trí & Tin tuyển dụng
 * Quản lý đa kênh: Website, TopCV, LinkedIn, VietnamWorks
 */

const PostingsPage = (() => {
  let _activeFilter = 'all';
  let _activeDept = 'all';
  let _searchQuery = '';

  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const departments = ATSStore.getDepartments();
      const postings = ATSStore.getPostings({
        status: _activeFilter,
        department: _activeDept,
        search: _searchQuery
      });

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Tin tuyển dụng</h1>
              <p class="page-subtitle">Xem, chỉnh sửa, đăng lại và đóng tin tuyển dụng trên cổng việc làm</p>
            </div>
            <div class="page-actions">
              ${user.role === 'hr' ? `
                <button class="btn btn-outline" onclick="Router.navigate('/requisitions')">
                  <i data-lucide="file-plus" class="icon-sm"></i> Tạo từ Yêu cầu tuyển dụng
                </button>
              ` : ''}
              <a href="#/portal" target="_blank" class="btn btn-primary">
                <i data-lucide="external-link" class="icon-sm"></i> Cổng việc làm ứng viên
              </a>
            </div>
          </div>

          <div class="alert alert-info mb-4">
            <i data-lucide="plug-zap" class="icon-sm"></i>
            <div class="text-xs leading-relaxed">
              <strong>Trạng thái tích hợp:</strong> Cổng tuyển dụng SmartATS (Website) đăng tin và nhận hồ sơ thật trong ứng dụng.
              Các kênh <strong>TopCV, LinkedIn Jobs và VietnamWorks</strong> hiện chỉ <strong>mô phỏng đồng bộ</strong> để minh họa luồng đa kênh —
              chưa có API key, tài khoản đối tác hoặc backend kết nối thực tế.
            </div>
          </div>

          ${(() => {
            const failed = ATSStore.getRequisitions().filter(r => r.publishStatus === 'error' && r.publishError);
            if (!failed.length) return '';
            return `
              <div class="alert alert-danger mb-4">
                <i data-lucide="alert-triangle" class="icon-sm"></i>
                <div class="text-xs leading-relaxed">
                  <strong>Ngoại lệ 2 — Lỗi đăng tin tuyển dụng:</strong> ${failed.length} yêu cầu bị lỗi kỹ thuật khi đăng.
                  Hệ thống đã ghi nhận lỗi và thông báo phòng nhân sự; sau khi khắc phục có thể đăng lại.
                  <ul class="mt-2" style="list-style:disc;padding-left:18px;">
                    ${failed.map(r => `
                      <li class="mb-1">
                        <strong>${r.code}</strong> – ${Helpers.truncate(r.title, 40)}:
                        <span class="text-danger">${r.publishError.message}</span>
                        <button class="btn btn-xs btn-warning btn-retry-publish-post" data-id="${r.id}">
                          <i data-lucide="refresh-cw" class="icon-2xs"></i> Đăng lại
                        </button>
                      </li>`).join('')}
                  </ul>
                </div>
              </div>`;
          })()}

          <!-- Filter Bar -->
          <div class="card mb-4">
            <div class="card-body py-3">
              <div class="filter-toolbar">
                <div class="search-box">
                  <i data-lucide="search" class="search-icon"></i>
                  <input type="text" id="post-search-input" class="form-input" placeholder="Tìm theo tiêu đề hoặc mã tin..." value="${_searchQuery}">
                </div>

                <div class="filter-group">
                  <label class="filter-label">Trạng thái:</label>
                  <select id="post-status-filter" class="form-select">
                    <option value="all" ${_activeFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="published" ${_activeFilter === 'published' ? 'selected' : ''}>Đã đăng (Đang tuyển)</option>
                    <option value="draft" ${_activeFilter === 'draft' ? 'selected' : ''}>Bản nháp</option>
                    <option value="closed" ${_activeFilter === 'closed' ? 'selected' : ''}>Đã đóng</option>
                    <option value="expired" ${_activeFilter === 'expired' ? 'selected' : ''}>Hết hạn</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Phòng ban:</label>
                  <select id="post-dept-filter" class="form-select">
                    <option value="all" ${_activeDept === 'all' ? 'selected' : ''}>Tất cả phòng ban</option>
                    ${departments.map(d => `<option value="${d}" ${_activeDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Job Postings Grid / Table -->
          <div class="card">
            <div class="card-body card-body-no-padding">
              ${this._renderTable(postings, user)}
            </div>
          </div>

          <!-- Modals Container -->
          <div id="post-modals-container"></div>
        </div>
      `;
    },

    _renderTable(postings, user) {
      if (!postings || postings.length === 0) {
        return `
          <div class="empty-state">
            <i data-lucide="briefcase" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Chưa có tin tuyển dụng nào</h3>
            <p class="empty-state-description">Vui lòng tạo yêu cầu tuyển dụng hoặc xuất bản tin mới để bắt đầu tiếp nhận hồ sơ.</p>
          </div>
        `;
      }

      const rows = postings.map((p, index) => {
        const canManage = user.role === 'hr';

        // Channels Badges
        const ch = p.channels || {};
        const channelCount = ['website', 'topcv', 'linkedin', 'vietnamworks'].filter(k => ch[k] && ch[k].active).length;
        const channelsHtml = `
          <div class="chip-row">
            ${ch.website?.active ? `<span class="badge badge-secondary text-2xs" title="Website Portal (đăng tin thật): ${ch.website.applicants || 0} hồ sơ">Web</span>` : ''}
            ${ch.topcv?.active ? `<span class="badge badge-secondary text-2xs" title="TopCV (mô phỏng): ${ch.topcv.applicants || 0} hồ sơ">TopCV · Demo</span>` : ''}
            ${ch.linkedin?.active ? `<span class="badge badge-secondary text-2xs" title="LinkedIn (mô phỏng): ${ch.linkedin.applicants || 0} hồ sơ">LinkedIn · Demo</span>` : ''}
            ${ch.vietnamworks?.active ? `<span class="badge badge-secondary text-2xs" title="VietnamWorks (mô phỏng)">VNW · Demo</span>` : ''}
          </div>
        `;

        return `
          <tr>
            <td>
              <a href="javascript:void(0)" class="table-name btn-preview-post" data-id="${p.id}" title="${p.title}">${Helpers.truncate(p.title, 32)}</a>
              <span class="table-sub">${p.code} · ${p.department} · ${Helpers.compactSalary(p.salary)}</span>
            </td>
            <td class="col-optional">${channelsHtml}</td>
            <td>
              <span class="badge badge-secondary">${p.applicantsCount || 0} hồ sơ</span>
              <span class="table-sub">${channelCount} kênh đang đăng</span>
            </td>
            <td><span class="table-sub">${Helpers.formatDate(p.deadline)}</span></td>
            <td>${Helpers.statusBadge(p.status)}</td>
            <td class="text-right">
              <div class="table-actions">
                <button class="btn btn-xs btn-icon btn-outline btn-preview-post" data-id="${p.id}" title="Xem tin tuyển dụng" aria-label="Xem tin">
                  <i data-lucide="eye" class="icon-xs"></i>
                </button>
                ${canManage ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-edit-post" data-id="${p.id}" title="Chỉnh sửa tin" aria-label="Chỉnh sửa tin">
                    <i data-lucide="pencil" class="icon-xs"></i>
                  </button>
                ` : ''}
                ${canManage && p.status !== 'published' ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-republish-post" data-id="${p.id}" title="Đăng lại tin" aria-label="Đăng lại tin">
                    <i data-lucide="refresh-cw" class="icon-xs"></i>
                  </button>
                ` : ''}
                ${canManage && p.status === 'published' ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-quick-reject btn-close-post" data-id="${p.id}" title="Đóng tin tuyển dụng" aria-label="Đóng tin">
                    <i data-lucide="slash" class="icon-xs"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-responsive">
          <table class="data-table data-table-compact table-sticky-actions">
            <thead>
              <tr>
                <th>Tin tuyển dụng</th>
                <th class="col-optional">Kênh đăng</th>
                <th>Ứng viên</th>
                <th class="col-compact">Hạn nộp</th>
                <th>Trạng thái</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    },

    init() {
      // Ngoại lệ 2: nút "Đăng lại" cho tin bị lỗi kỹ thuật
      document.querySelectorAll('.btn-retry-publish-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = e.currentTarget.getAttribute('data-id');
          const result = ATSStore.retryPublish(id, {});
          if (result.success) {
            UI.toast({ message: `Đăng tin lại thành công! Mã tin: ${result.posting.code}.`, type: 'success' });
          } else {
            UI.toast({ message: `Vẫn còn lỗi khi đăng tin: ${result.error}`, type: 'error', duration: 8000 });
          }
          this.refresh();
        });
      });

      // Search with debounce
      const searchInput = document.getElementById('post-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', Helpers.debounce((e) => {
          _searchQuery = e.target.value.trim();
          this.refresh();
        }, 300));
      }

      // Filter changes
      const statusFilter = document.getElementById('post-status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          _activeFilter = e.target.value;
          this.refresh();
        });
      }

      const deptFilter = document.getElementById('post-dept-filter');
      if (deptFilter) {
        deptFilter.addEventListener('change', (e) => {
          _activeDept = e.target.value;
          this.refresh();
        });
      }

      // Preview Buttons
      document.querySelectorAll('.btn-preview-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showPreviewModal(id);
        });
      });

      // Nút "Chỉnh sửa tin"
      document.querySelectorAll('.btn-edit-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showEditPostModal(id);
        });
      });

      // Nút "Đăng lại tin"
      document.querySelectorAll('.btn-republish-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleRepublishPosting(id);
        });
      });

      // Close Posting Buttons
      document.querySelectorAll('.btn-close-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleClosePosting(id);
        });
      });
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = this.render();
        this.init();
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showPreviewModal(id) {
      const post = ATSStore.getPostingById(id);
      if (!post) return;

      const modalHtml = `
        <div class="modal active" id="modal-post-preview">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <div class="text-xs text-muted mb-1 font-mono">${post.code} • ${post.department}</div>
                  <h3 class="modal-title">${post.title}</h3>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-post-preview')">&times;</button>
              </div>
              <div class="modal-body">
                <!-- Meta stats bar -->
                <div class="bg-gray-50 p-3 rounded mb-4 flex flex-wrap items-center justify-between gap-2 border">
                  <div><span class="text-xs text-muted">Mức lương:</span> <strong class="text-success">${post.salary}</strong></div>
                  <div><span class="text-xs text-muted">Địa điểm:</span> <strong>${post.location}</strong></div>
                  <div><span class="text-xs text-muted">Hình thức:</span> <strong>${post.workType}</strong></div>
                  <div><span class="text-xs text-muted">Kinh nghiệm tối thiểu:</span> <strong>${Helpers.formatMinExperience(ATSStore.getPostingMinExperience(post))}</strong></div>
                  <div><span class="text-xs text-muted">Hạn ứng tuyển:</span> <strong>${Helpers.formatDate(post.deadline)}</strong></div>
                </div>

                <div class="mb-4">
                  <h4 class="font-bold text-sm mb-2 text-gray-800">1. Giới thiệu công việc</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.description)}</div>
                </div>

                <div class="mb-4">
                  <h4 class="font-bold text-sm mb-2 text-gray-800">2. Yêu cầu ứng viên</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.requirements)}</div>
                </div>

                <div class="mb-4">
                  <h4 class="font-bold text-sm mb-2 text-gray-800">3. Quyền lợi & Phúc lợi</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.benefits)}</div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-post-preview')">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="PostingsPage.copyShareUrl('${post.id}')">
                  <i data-lucide="copy" class="icon-sm"></i> Sao chép link nộp hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('post-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-post-preview');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showChannelsModal(id) {
      const post = ATSStore.getPostingById(id);
      if (!post) return;

      const ch = post.channels || {};
      const modalHtml = `
        <div class="modal active" id="modal-post-channels">
          <div class="modal-dialog modal-md">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">Quản lý nguồn tuyển dụng tích hợp</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-post-channels')">&times;</button>
              </div>
              <div class="modal-body">
                <p class="text-sm text-muted mb-3">Theo dõi tình trạng đồng bộ tin và số lượng hồ sơ nhận được từ từng nguồn:</p>

                <div class="flex flex-col gap-3">
                  <!-- Website Portal -->
                  <div class="p-3 border rounded flex items-center justify-between bg-gray-50">
                    <div>
                      <div class="font-semibold text-sm flex items-center gap-1.5">
                        <i data-lucide="globe" class="icon-sm text-primary"></i> Cổng tuyển dụng SmartATS
                      </div>
                      <div class="text-xs text-muted mt-0.5">Trạng thái: <span class="text-success font-medium">${ch.website?.syncStatus || 'Hoạt động'}</span></div>
                    </div>
                    <span class="badge badge-primary font-semibold">${ch.website?.applicants || 0} hồ sơ</span>
                  </div>

                  <!-- TopCV -->
                  <div class="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div class="font-semibold text-sm flex items-center gap-1.5">
                        <i data-lucide="share-2" class="icon-sm text-info"></i> Nền tảng TopCV
                        <span class="badge badge-warning text-2xs">Mô phỏng</span>
                      </div>
                      <div class="text-xs text-muted mt-0.5">Trạng thái: <span class="text-warning font-medium">Demo – chưa kết nối API đối tác</span></div>
                    </div>
                    <span class="badge badge-info font-semibold">${ch.topcv?.applicants || 0} hồ sơ</span>
                  </div>

                  <!-- LinkedIn -->
                  <div class="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div class="font-semibold text-sm flex items-center gap-1.5">
                        <i data-lucide="linkedin" class="icon-sm text-primary"></i> LinkedIn Jobs
                        <span class="badge badge-warning text-2xs">Mô phỏng</span>
                      </div>
                      <div class="text-xs text-muted mt-0.5">Trạng thái: <span class="text-warning font-medium">Demo – chưa kết nối API đối tác</span></div>
                    </div>
                    <span class="badge badge-primary font-semibold">${ch.linkedin?.applicants || 0} hồ sơ</span>
                  </div>

                  <!-- VietnamWorks -->
                  <div class="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div class="font-semibold text-sm flex items-center gap-1.5">
                        <i data-lucide="radio" class="icon-sm text-warning"></i> VietnamWorks
                        <span class="badge badge-warning text-2xs">Mô phỏng</span>
                      </div>
                      <div class="text-xs text-muted mt-0.5">Trạng thái: <span class="text-muted font-medium">Chưa cấu hình API</span></div>
                    </div>
                    <span class="badge badge-secondary font-semibold">${ch.vietnamworks?.applicants || 0} hồ sơ</span>
                  </div>
                </div>

                <div class="alert alert-info mt-4 text-xs">
                  <i data-lucide="info" class="icon-xs"></i>
                  <span>Lưu ý: Các nguồn bên ngoài hiện đang ở chế độ <strong>mô phỏng đồng bộ dữ liệu</strong> và chưa kết nối tài khoản doanh nghiệp thực tế. Chỉ Cổng tuyển dụng SmartATS là kênh đăng tin thật trong ứng dụng.</span>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-post-channels')">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('post-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-post-channels');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    copyShareUrl(id) {
      const shareUrl = `${window.location.origin}${window.location.pathname}#/portal/job/${id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        UI.toast({ message: 'Đã sao chép liên kết tin tuyển dụng vào bộ nhớ tạm!', type: 'success' });
      }).catch(() => {
        prompt('Sao chép đường dẫn chia sẻ bên dưới:', shareUrl);
      });
    },

    handleClosePosting(id) {
      UI.confirm({
        title: 'Đóng tin tuyển dụng',
        message: 'Bạn có chắc chắn muốn đóng tin tuyển dụng này không? Ứng viên sẽ không thể nộp hồ sơ mới vào vị trí này nữa.',
        type: 'danger',
        confirmText: 'Đóng tin tuyển dụng',
        onConfirm: () => {
          ATSStore.updatePosting(id, { status: 'closed' });
          UI.toast({ message: 'Đã đóng tin tuyển dụng thành công.', type: 'warning' });
          this.refresh();
        }
      });
    },

    /** Đăng lại tin đã đóng / bị lỗi lên cổng tuyển dụng. */
    handleRepublishPosting(id) {
      const post = ATSStore.getPostingById(id);
      if (!post) return;
      UI.confirm({
        title: 'Đăng lại tin tuyển dụng',
        message: `Đăng lại tin "${post.title}" lên cổng tuyển dụng để ứng viên tiếp tục nộp hồ sơ?`,
        type: 'info',
        confirmText: 'Đăng lại tin',
        onConfirm: () => {
          const result = ATSStore.republishPosting(id);
          if (!result || result.success === false) {
            UI.toast({ message: (result && result.message) || 'Không thể đăng lại tin.', type: 'error', duration: 6000 });
            return;
          }
          UI.toast({ message: `Đã đăng lại tin ${post.code}.`, type: 'success' });
          this.refresh();
        }
      });
    },

    /** Modal chỉnh sửa tin tuyển dụng. */
    showEditPostModal(id) {
      const post = ATSStore.getPostingById(id);
      if (!post) return;

      const workTypes = ['Toàn thời gian', 'Bán thời gian', 'Thực tập', 'Remote (Từ xa)'];
      const esc = (v) => Helpers.escapeHtml(v || '');
      const modalHtml = `
        <div class="modal active" id="modal-post-edit">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <div class="text-xs text-muted mb-1 font-mono">${post.code}</div>
                  <h3 class="modal-title">Chỉnh sửa tin tuyển dụng</h3>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-post-edit')">&times;</button>
              </div>
              <form id="form-post-edit">
                <div class="modal-body text-xs">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group" style="grid-column: span 2;">
                      <label class="form-label required">Tiêu đề tin</label>
                      <input type="text" name="title" class="form-input" required value="${esc(post.title)}">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Mức lương</label>
                      <input type="text" name="salary" class="form-input" value="${esc(post.salary)}" placeholder="Thỏa thuận / 20.000.000 VNĐ">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Địa điểm</label>
                      <input type="text" name="location" class="form-input" value="${esc(post.location)}" placeholder="Hà Nội / TP.HCM">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Hình thức làm việc</label>
                      <select name="workType" class="form-select">
                        ${workTypes.map(w => `<option value="${w}" ${post.workType === w ? 'selected' : ''}>${w}</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Hạn ứng tuyển</label>
                      <input type="date" name="deadline" class="form-input" value="${esc(post.deadline)}">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Kinh nghiệm tối thiểu (năm)</label>
                      <input type="number" step="0.5" min="0" max="60" name="minExperience" class="form-input" value="${Number(ATSStore.getPostingMinExperience(post))}" oninput="this.value = Math.max(0, Math.min(60, parseFloat(this.value) || 0)); if (this.value === '') this.value = '';">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label">Mô tả công việc</label>
                    <textarea name="description" class="form-textarea" rows="4">${esc(post.description)}</textarea>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label">Yêu cầu ứng viên</label>
                    <textarea name="requirements" class="form-textarea" rows="4">${esc(post.requirements)}</textarea>
                  </div>
                  <div class="form-group mb-1">
                    <label class="form-label">Quyền lợi & chế độ</label>
                    <textarea name="benefits" class="form-textarea" rows="3">${esc(post.benefits)}</textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-post-edit')">Hủy</button>
                  <button type="submit" class="btn btn-primary">
                    <i data-lucide="save" class="icon-sm"></i> Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('post-modals-container');
      if (!container) return;
      container.innerHTML = modalHtml;
      UI.openModal('modal-post-edit');
      if (typeof lucide !== 'undefined') lucide.createIcons();

      document.getElementById('form-post-edit').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const minExp = parseFloat(fd.get('minExperience'));
        if (!Helpers.isValidExperienceYears(minExp)) {
          UI.toast({ message: 'Kinh nghiệm tối thiểu phải từ 0 đến 60 năm.', type: 'warning', duration: 6000 });
          return;
        }
        ATSStore.updatePosting(id, {
          title: String(fd.get('title') || '').trim(),
          salary: fd.get('salary'),
          location: fd.get('location'),
          workType: fd.get('workType'),
          deadline: fd.get('deadline'),
          minExperience: Helpers.normalizeExperienceYears(minExp),
          description: fd.get('description'),
          requirements: fd.get('requirements'),
          benefits: fd.get('benefits')
        });
        UI.closeModal('modal-post-edit');
        UI.toast({ message: 'Đã cập nhật tin tuyển dụng.', type: 'success' });
        this.refresh();
      });
    }
  };
})();
