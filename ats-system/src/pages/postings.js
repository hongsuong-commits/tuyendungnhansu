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
              <h1 class="page-title">Vị trí & Tin tuyển dụng</h1>
              <p class="page-subtitle">Quản lý các tin đăng tuyển đa kênh và theo dõi hiệu quả thu hút ứng viên</p>
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
                <button class="btn btn-xs btn-icon btn-outline btn-preview-post" data-id="${p.id}" title="Xem trước tin" aria-label="Xem trước tin">
                  <i data-lucide="eye" class="icon-xs"></i>
                </button>
                <button class="btn btn-xs btn-icon btn-outline btn-share-post" data-id="${p.id}" title="Sao chép liên kết chia sẻ" aria-label="Chia sẻ">
                  <i data-lucide="share-2" class="icon-xs"></i>
                </button>
                <button class="btn btn-xs btn-icon btn-outline btn-channels-post" data-id="${p.id}" title="Cấu hình nguồn đăng" aria-label="Nguồn đăng">
                  <i data-lucide="layers" class="icon-xs"></i>
                </button>
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

      // Share Link Buttons
      document.querySelectorAll('.btn-share-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.copyShareUrl(id);
        });
      });

      // Manage Channels Buttons
      document.querySelectorAll('.btn-channels-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showChannelsModal(id);
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
    }
  };
})();
