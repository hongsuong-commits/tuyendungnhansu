/**
 * candidates.js - Module Quản lý Danh sách ứng viên & Quy trình Duyệt hồ sơ
 * Hỗ trợ lọc đa tiêu chí, xem chi tiết CV, đối chiếu sàng lọc và phê duyệt trạng thái
 */

const CandidatesPage = (() => {
  let _activeStatus = 'all';
  let _activeReq = 'all';
  let _activeSource = 'all';
  let _activeScreening = 'all';
  let _searchQuery = '';
  let _sortBy = 'date_desc';
  let _openAppId = null;

  return {
    render(params = {}) {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      if (typeof params.search === 'string') {
        _searchQuery = params.search;
      }

      // Mở thẳng hồ sơ ứng viên khi điều hướng từ Tổng quan: #/candidates?open=<appId>
      if (params.open) {
        _openAppId = String(params.open);
      }

      const requisitions = ATSStore.getRequisitions();
      const applications = ATSStore.getApplications({
        status: _activeStatus,
        requisitionId: _activeReq,
        source: _activeSource,
        screeningResult: _activeScreening,
        search: _searchQuery,
        sortBy: _sortBy
      });

      // Filter by department if user is department head
      const filteredApps = user.role === 'department_head'
        ? applications.filter(a => {
            const req = ATSStore.getRequisitionById(a.requisitionId);
            return req && req.department === user.department;
          })
        : applications;

      const canUpload = user.role === 'hr';

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Danh sách ứng viên</h1>
              <p class="page-subtitle">Theo dõi hồ sơ ứng tuyển, đối chiếu kết quả đọc CV và quản lý quy trình duyệt hồ sơ</p>
            </div>
            <div class="page-actions">
              ${canUpload ? `
                <button class="btn btn-outline" id="btn-upload-manual-cv">
                  <i data-lucide="upload" class="icon-sm"></i> Tải lên CV thủ công
                </button>
              ` : ''}
              <button class="btn btn-primary" id="btn-export-candidates">
                <i data-lucide="download" class="icon-sm"></i> Xuất file CSV
              </button>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="card mb-4">
            <div class="card-body py-3">
              <div class="filter-toolbar">
                <div class="search-box">
                  <i data-lucide="search" class="search-icon"></i>
                  <input type="text" id="cand-search-input" class="form-input" placeholder="Tìm theo họ tên, email hoặc số điện thoại..." value="${_searchQuery}">
                </div>

                <div class="filter-group">
                  <label class="filter-label">Trạng thái hồ sơ:</label>
                  <select id="cand-status-filter" class="form-select">
                    <option value="all" ${_activeStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="pending_review" ${_activeStatus === 'pending_review' ? 'selected' : ''}>Chờ nhân sự duyệt</option>
                    <option value="reviewing" ${_activeStatus === 'reviewing' ? 'selected' : ''}>Đang xem xét</option>
                    <option value="passed_screening" ${_activeStatus === 'passed_screening' ? 'selected' : ''}>Đạt – Chờ phỏng vấn</option>
                    <option value="interview_scheduled" ${_activeStatus === 'interview_scheduled' ? 'selected' : ''}>Đã lên lịch phỏng vấn</option>
                    <option value="proposed" ${_activeStatus === 'proposed' ? 'selected' : ''}>Đã đề xuất tuyển dụng</option>
                    <option value="hired" ${_activeStatus === 'hired' ? 'selected' : ''}>Đã tuyển</option>
                    <option value="rejected" ${_activeStatus === 'rejected' ? 'selected' : ''}>Không đạt</option>
                    <option value="need_info" ${_activeStatus === 'need_info' ? 'selected' : ''}>Cần bổ sung thông tin</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Vị trí ứng tuyển:</label>
                  <select id="cand-req-filter" class="form-select">
                    <option value="all" ${_activeReq === 'all' ? 'selected' : ''}>Tất cả vị trí</option>
                    ${requisitions.map(r => `<option value="${r.id}" ${_activeReq === r.id ? 'selected' : ''}>${r.title}</option>`).join('')}
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Nguồn hồ sơ:</label>
                  <select id="cand-source-filter" class="form-select">
                    <option value="all" ${_activeSource === 'all' ? 'selected' : ''}>Tất cả nguồn</option>
                    <option value="website" ${_activeSource === 'website' ? 'selected' : ''}>Website công ty</option>
                    <option value="topcv" ${_activeSource === 'topcv' ? 'selected' : ''}>TopCV</option>
                    <option value="linkedin" ${_activeSource === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                    <option value="vietnamworks" ${_activeSource === 'vietnamworks' ? 'selected' : ''}>VietnamWorks</option>
                    <option value="referral" ${_activeSource === 'referral' ? 'selected' : ''}>Giới thiệu nội bộ</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Sàng lọc:</label>
                  <select id="cand-screening-filter" class="form-select">
                    <option value="all" ${_activeScreening === 'all' ? 'selected' : ''}>Tất cả kết quả</option>
                    <option value="pass" ${_activeScreening === 'pass' ? 'selected' : ''}>Đạt tiêu chí</option>
                    <option value="manual_check" ${_activeScreening === 'manual_check' ? 'selected' : ''}>Cần kiểm tra</option>
                    <option value="fail" ${_activeScreening === 'fail' ? 'selected' : ''}>Không đạt</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Sắp xếp:</label>
                  <select id="cand-sort-filter" class="form-select">
                    <option value="date_desc" ${_sortBy === 'date_desc' ? 'selected' : ''}>Mới nộp nhất</option>
                    <option value="date_asc" ${_sortBy === 'date_asc' ? 'selected' : ''}>Cũ nhất</option>
                    <option value="score_desc" ${_sortBy === 'score_desc' ? 'selected' : ''}>Điểm phù hợp cao nhất</option>
                    <option value="score_asc" ${_sortBy === 'score_asc' ? 'selected' : ''}>Điểm phù hợp thấp nhất</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Applications Table -->
          <div class="card">
            <div class="card-body card-body-no-padding">
              ${this._renderTable(filteredApps, user)}
            </div>
          </div>

          <!-- Modals Container -->
          <div id="candidate-modals-container"></div>
        </div>
      `;
    },

    _renderTable(apps, user) {
      if (!apps || apps.length === 0) {
        return `
          <div class="empty-state">
            <i data-lucide="users" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Không tìm thấy ứng viên nào</h3>
            <p class="empty-state-description">Vui lòng điều chỉnh lại bộ lọc hoặc nộp hồ sơ thử nghiệm từ cổng ứng viên.</p>
          </div>
        `;
      }

      const rows = apps.map((app, index) => {
        const cand = ATSStore.getCandidateById(app.candidateId) || {};
        const score = app.screeningScore != null ? app.screeningScore : 0;

        let scoreBadgeClass = 'badge-secondary';
        if (score >= 80) scoreBadgeClass = 'badge-success';
        else if (score >= 60) scoreBadgeClass = 'badge-warning';
        else scoreBadgeClass = 'badge-danger';

        const canReview = user.role === 'hr';

        const sourceLabels = {
          website: 'Website', topcv: 'TopCV', linkedin: 'LinkedIn',
          vietnamworks: 'VietnamWorks', referral: 'Giới thiệu nội bộ', other: 'Khác'
        };
        const screeningShort = { pass: 'Đạt', manual_check: 'Cần xem', fail: 'Không đạt' };

        return `
          <tr>
            <td>
              <a href="javascript:void(0)" class="table-name btn-view-candidate" data-id="${app.id}">${app.candidateName || cand.fullName}</a>
              <span class="table-sub">${Helpers.truncate(app.positionTitle || '—', 34)}</span>
            </td>
            <td class="col-optional"><span class="badge badge-secondary text-2xs">${sourceLabels[app.source] || app.source || 'Website'}</span></td>
            <td><span class="table-sub">${Helpers.formatDate(app.appliedDate)}</span></td>
            <td>
              <span class="badge ${scoreBadgeClass}">${score}%</span>
              <span class="table-sub">${screeningShort[app.screeningResult] || Helpers.getScreeningLabel(app.screeningResult)}</span>
            </td>
            <td>${Helpers.statusBadge(app.status)}</td>
            <td class="text-right">
              <div class="table-actions">
                <button class="btn btn-xs btn-icon btn-outline btn-view-candidate" data-id="${app.id}" title="Xem chi tiết hồ sơ" aria-label="Xem chi tiết hồ sơ">
                  <i data-lucide="eye" class="icon-xs"></i>
                </button>
                ${canReview && app.status === 'pending_review' ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-quick-approve" data-id="${app.id}" title="Duyệt vào phỏng vấn" aria-label="Duyệt hồ sơ">
                    <i data-lucide="check" class="icon-xs"></i>
                  </button>
                  <button class="btn btn-xs btn-icon btn-outline btn-quick-reject" data-id="${app.id}" title="Từ chối hồ sơ" aria-label="Từ chối hồ sơ">
                    <i data-lucide="x" class="icon-xs"></i>
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
                <th>Ứng viên · vị trí</th>
                <th class="col-optional">Nguồn</th>
                <th>Ngày nộp</th>
                <th>Sàng lọc</th>
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
      // Search input
      const searchInput = document.getElementById('cand-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', Helpers.debounce((e) => {
          _searchQuery = e.target.value.trim();
          this.refresh();
        }, 300));
      }

      // Status filter
      const statusFilter = document.getElementById('cand-status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          _activeStatus = e.target.value;
          this.refresh();
        });
      }

      // Requisition filter
      const reqFilter = document.getElementById('cand-req-filter');
      if (reqFilter) {
        reqFilter.addEventListener('change', (e) => {
          _activeReq = e.target.value;
          this.refresh();
        });
      }

      // Source filter
      const sourceFilter = document.getElementById('cand-source-filter');
      if (sourceFilter) {
        sourceFilter.addEventListener('change', (e) => {
          _activeSource = e.target.value;
          this.refresh();
        });
      }

      // Screening filter
      const screeningFilter = document.getElementById('cand-screening-filter');
      if (screeningFilter) {
        screeningFilter.addEventListener('change', (e) => {
          _activeScreening = e.target.value;
          this.refresh();
        });
      }

      // Sort filter
      const sortFilter = document.getElementById('cand-sort-filter');
      if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
          _sortBy = e.target.value;
          this.refresh();
        });
      }

      // View Candidate Detail buttons
      document.querySelectorAll('.btn-view-candidate').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showCandidateDetailModal(id);
        });
      });

      // Quick Approve
      document.querySelectorAll('.btn-quick-approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleStatusChange(id, 'passed_screening', 'Duyệt hồ sơ đủ điều kiện vào vòng phỏng vấn');
        });
      });

      // Quick Reject
      document.querySelectorAll('.btn-quick-reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showRejectModal(id);
        });
      });

      // Upload Manual CV button
      const btnUpload = document.getElementById('btn-upload-manual-cv');
      if (btnUpload) {
        btnUpload.addEventListener('click', () => {
          this.showManualUploadModal();
        });
      }

      // Export Candidates to CSV
      const btnExport = document.getElementById('btn-export-candidates');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          const apps = ATSStore.getApplications();
          const exportData = apps.map(a => {
            const cand = ATSStore.getCandidateById(a.candidateId) || {};
            return {
              candidateName: a.candidateName,
              position: a.positionTitle,
              email: cand.email || '',
              phone: cand.phone || '',
              source: a.source,
              score: a.screeningScore + '%',
              status: Helpers.getStatusLabel(a.status),
              appliedDate: Helpers.formatDate(a.appliedDate)
            };
          });
          Helpers.exportToCSV(exportData, [
            { key: 'candidateName', label: 'Họ và tên' },
            { key: 'position', label: 'Vị trí ứng tuyển' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Số điện thoại' },
            { key: 'source', label: 'Nguồn hồ sơ' },
            { key: 'score', label: 'Điểm sàng lọc' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'appliedDate', label: 'Ngày ứng tuyển' }
          ], `danh-sach-ung-vien-${Date.now()}.csv`);
        });
      }

      // Điều hướng từ Tổng quan: mở ngay hồ sơ ứng viên tương ứng
      if (_openAppId) {
        const appId = _openAppId;
        _openAppId = null;
        this.showCandidateDetailModal(appId);
      }
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = this.render();
        this.init();
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showCandidateDetailModal(appId) {
      const app = ATSStore.getApplicationById(appId);
      if (!app) return;

      const cand = ATSStore.getCandidateById(app.candidateId) || {};
      const req = ATSStore.getRequisitionById(app.requisitionId);
      const user = ATSStore.getCurrentUser();
      const canManage = user.role === 'hr' || (user.role === 'department_head' && req && req.department === user.department);

      const scr = app.screeningDetails || {};
      const metList = scr.metCriteria || [];
      const unmetList = scr.unmetCriteria || [];
      const missingList = scr.missingInfo || [];

      // Interviews for this candidate
      const candInterviews = (ATSStore.getInterviews() || []).filter(i => i.candidateId === app.candidateId);
      // Evaluations for this candidate
      const candEvaluations = (ATSStore.getEvaluations() || []).filter(e => e.candidateId === app.candidateId);

      const modalHtml = `
        <div class="modal active" id="modal-cand-detail">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <div class="modal-head">
                  <span class="avatar-initials">${cand.fullName ? cand.fullName.charAt(0) : 'U'}</span>
                  <div class="modal-head-text">
                    <h3 class="modal-title">${app.candidateName || cand.fullName}</h3>
                    <p class="modal-subtitle">
                      ${app.positionTitle} · ${app.source ? app.source.toUpperCase() : '—'} nộp ${Helpers.formatDate(app.appliedDate)}
                    </p>
                  </div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-cand-detail')" aria-label="Đóng">&times;</button>
              </div>

              <div class="modal-body">
                <!-- Status Actions Bar (For HR/Management) -->
                <div class="cand-status-bar">
                  <div class="cand-status-now">
                    <span class="cand-status-label">Trạng thái hiện tại</span>
                    ${Helpers.statusBadge(app.status)}
                  </div>

                  ${canManage ? `
                    <div class="cand-status-actions">
                      <button class="btn btn-sm btn-outline" onclick="CandidatesPage.handleStatusChange('${app.id}', 'reviewing', 'Đang thẩm định hồ sơ chuyên môn')">
                        <i data-lucide="eye" class="icon-xs"></i> Đang xem xét
                      </button>

                      <button class="btn btn-sm btn-primary" onclick="CandidatesPage.handleStatusChange('${app.id}', 'passed_screening', 'Duyệt hồ sơ đủ điều kiện phỏng vấn')">
                        <i data-lucide="check-circle" class="icon-xs"></i> Đạt – Chờ phỏng vấn
                      </button>

                      <button class="btn btn-sm btn-outline" onclick="UI.closeModal('modal-cand-detail'); Router.navigate('/interviews', { candidateId: '${app.candidateId}', reqId: '${app.requisitionId}' })">
                        <i data-lucide="calendar" class="icon-xs"></i> Lên lịch phỏng vấn
                      </button>

                      <button class="btn btn-sm btn-outline" onclick="CandidatesPage.handleStatusChange('${app.id}', 'need_info', 'Yêu cầu ứng viên cung cấp thêm thông tin chứng chỉ và bằng cấp')">
                        <i data-lucide="help-circle" class="icon-xs"></i> Yêu cầu bổ sung
                      </button>

                      <button class="btn btn-sm btn-outline btn-quick-reject" onclick="CandidatesPage.showRejectModal('${app.id}')">
                        <i data-lucide="x-circle" class="icon-xs"></i> Từ chối
                      </button>
                    </div>
                  ` : ''}
                </div>

                <!-- Tabs in Modal -->
                <div class="tabs mb-4">
                  <button class="tab-item active" data-tab="tab-overview" onclick="CandidatesPage.switchDetailTab(this, 'tab-overview')">
                    <i data-lucide="file-text" class="icon-xs"></i> Tổng quan
                  </button>
                  <button class="tab-item" data-tab="tab-ai-screening" onclick="CandidatesPage.switchDetailTab(this, 'tab-ai-screening')">
                    <i data-lucide="sparkles" class="icon-xs"></i> Sàng lọc AI (${app.screeningScore || 0}đ)
                  </button>
                  <button class="tab-item" data-tab="tab-interviews" onclick="CandidatesPage.switchDetailTab(this, 'tab-interviews')">
                    <i data-lucide="calendar" class="icon-xs"></i> Lịch PV (${candInterviews.length})
                  </button>
                  <button class="tab-item" data-tab="tab-history" onclick="CandidatesPage.switchDetailTab(this, 'tab-history')">
                    <i data-lucide="clock" class="icon-xs"></i> Lịch sử
                  </button>
                </div>

                <!-- TAB 1: OVERVIEW & CV -->
                <div id="tab-overview" class="detail-tab-pane active">
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="border p-3 rounded bg-white">
                      <h4 class="font-bold text-sm mb-2 text-gray-800">Thông tin liên hệ</h4>
                      <div class="text-xs space-y-1.5">
                        <div><span class="text-muted">Email:</span> <a href="mailto:${cand.email}" class="text-primary font-medium">${cand.email || '—'}</a></div>
                        <div><span class="text-muted">Số điện thoại:</span> <a href="tel:${cand.phone}" class="font-medium text-gray-800">${cand.phone || '—'}</a></div>
                        <div><span class="text-muted">Giới tính / Ngày sinh:</span> ${['Nam', 'Nữ'].includes(cand.gender) ? cand.gender : '—'} • ${cand.dob ? Helpers.formatDate(cand.dob) : '—'}</div>
                        <div><span class="text-muted">Địa chỉ:</span> ${cand.address || 'Hà Nội'}</div>
                      </div>
                    </div>

                    <div class="border p-3 rounded bg-white">
                      <h4 class="font-bold text-sm mb-2 text-gray-800">Học vấn & Kinh nghiệm trích xuất</h4>
                      <div class="text-xs space-y-1.5">
                        <div><span class="text-muted">Trình độ học vấn:</span> <strong>${cand.education || 'Đang cập nhật'}</strong></div>
                        <div><span class="text-muted">Số năm kinh nghiệm:</span> <strong class="text-primary">${cand.experienceYears || 0} năm</strong></div>
                        <div><span class="text-muted">Công ty hiện tại:</span> ${cand.currentCompany || '—'} (${cand.currentTitle || '—'})</div>
                        <div><span class="text-muted">Chứng chỉ:</span> ${(cand.certifications || []).join(', ') || 'Chưa có'}</div>
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <h4 class="font-bold text-sm mb-2 text-gray-800">Kỹ năng chuyên môn trích xuất</h4>
                    <div class="flex flex-wrap gap-1.5">
                      ${(cand.skills || []).map(s => `<span class="badge badge-primary">${s}</span>`).join('') || '<span class="text-muted text-xs">Chưa nhận diện được kỹ năng</span>'}
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-bold text-sm text-gray-800">Nội dung CV gốc đã nộp</h4>
                      <button class="btn btn-xs btn-outline" onclick="CandidatesPage.downloadRealCV('${cand.id}', '${cand.fullName.replace(/'/g,"\\'")}')">
                        <i data-lucide="download" class="icon-xs"></i> Tải file CV
                      </button>
                    </div>
                    <pre class="bg-gray-900 text-gray-100 p-3.5 rounded text-xs leading-relaxed max-h-72 overflow-y-auto font-mono whitespace-pre-wrap">${cand.rawResumeText || 'Chưa có nội dung văn bản CV'}</pre>
                  </div>
                </div>

                <!-- TAB 2: AI SCREENING DETAILS -->
                <div id="tab-ai-screening" class="detail-tab-pane" style="display: none;">
                  <div class="alert alert-info mb-4">
                    <i data-lucide="info" class="icon-sm"></i>
                    <div class="text-xs">
                      <strong>Lưu ý nghiệp vụ:</strong> Kết quả sàng lọc thông minh là hệ thống tính toán hỗ trợ nhân sự đối chiếu với tiêu chí tuyển dụng của vị trí, không tự động loại bỏ ứng viên hoặc tự ý thay thế quyết định tuyển dụng của hội đồng.
                    </div>
                  </div>

                  ${scr.autoApproved ? `
                    <div class="alert alert-success mb-4">
                      <i data-lucide="sparkles" class="icon-sm"></i>
                      <div class="text-xs">
                        <strong>AI đã tự động duyệt hồ sơ:</strong> đạt ${app.screeningScore || 0} điểm, bằng hoặc vượt ngưỡng ${scr.autoApproveThreshold || 80} điểm và không còn tiêu chí bắt buộc nào chưa đáp ứng. Hồ sơ được chuyển sang bước <strong>Đạt – Chờ phỏng vấn</strong>.
                      </div>
                    </div>
                  ` : ''}

                  <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="p-4 border rounded text-center bg-gray-50">
                      <span class="text-xs text-muted">Điểm phù hợp tổng thể</span>
                      <div class="text-3xl font-extrabold text-primary mt-1">${app.screeningScore || 0}%</div>
                      <div class="mt-2">${Helpers.screeningBadge(app.screeningResult)}</div>
                    </div>

                    <div class="col-span-2 p-3 border rounded bg-white">
                      <h4 class="font-bold text-sm mb-1 text-gray-800">Nhận định tóm tắt tự động</h4>
                      <p class="text-xs text-gray-700 bg-gray-50 p-2.5 rounded leading-relaxed">${scr.summary || 'Chưa có dữ liệu phân tích'}</p>
                      <div class="text-xs text-muted mt-2">Thời gian xử lý: ${Helpers.formatDateTime(scr.processedAt)}</div>
                    </div>
                  </div>

                  <!-- NLP Keyword & Semantic Analysis Box -->
                  <div class="mb-4 border p-3 rounded bg-white">
                    <h4 class="font-bold text-sm text-gray-800 flex items-center gap-1.5 mb-2">
                      <i data-lucide="sparkles" class="icon-sm text-primary"></i> Phân tích từ khóa NLP & Đối chiếu vị trí
                    </h4>
                    <div class="space-y-2 text-xs">
                      <div>
                        <span class="text-muted block mb-1 font-semibold">Từ khóa chuyên môn trùng khớp:</span>
                        <div class="flex flex-wrap gap-1.5">
                          ${(scr.matchedKeywords || []).map(m => `<span class="nlp-badge nlp-badge-matched"><i data-lucide="check" class="w-3 h-3"></i> ${m.keyword || m}</span>`).join('') || '<span class="text-muted">Chưa khớp từ khóa chuyên môn</span>'}
                        </div>
                      </div>
                      ${(scr.missingKeywords && scr.missingKeywords.length > 0) ? `
                        <div>
                          <span class="text-muted block mb-1 font-semibold">Từ khóa yêu cầu chưa tìm thấy trong CV:</span>
                          <div class="flex flex-wrap gap-1.5">
                            ${scr.missingKeywords.map(k => `<span class="nlp-badge nlp-badge-missing"><i data-lucide="alert-circle" class="w-3 h-3"></i> ${k}</span>`).join('')}
                          </div>
                        </div>
                      ` : ''}
                      ${(scr.reasons && scr.reasons.length > 0) ? `
                        <div class="mt-2 pt-2 border-t">
                          <span class="text-muted block mb-1 font-semibold">Lý do chấm điểm chi tiết (NLP Justification):</span>
                          <ul class="space-y-1">
                            ${scr.reasons.map(r => `<li class="flex items-start gap-1.5 text-gray-700"><span class="text-primary font-bold">•</span> <span>${r}</span></li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <!-- Met Criteria -->
                    <div class="border p-3 rounded bg-white">
                      <h4 class="font-bold text-sm text-success flex items-center gap-1.5 mb-2">
                        <i data-lucide="check-circle-2" class="icon-sm"></i> Tiêu chí đáp ứng (${metList.length})
                      </h4>
                      <ul class="text-xs space-y-2">
                        ${metList.map(m => `
                          <li class="flex items-start gap-1.5 bg-green-50 p-2 rounded text-green-900 border border-green-200">
                            <i data-lucide="check" class="icon-xs mt-0.5 text-success"></i>
                            <span>${m}</span>
                          </li>
                        `).join('') || '<li class="text-muted">Không có tiêu chí đạt</li>'}
                      </ul>
                    </div>

                    <!-- Unmet / Missing Criteria -->
                    <div class="border p-3 rounded bg-white">
                      <h4 class="font-bold text-sm text-danger flex items-center gap-1.5 mb-2">
                        <i data-lucide="alert-triangle" class="icon-sm"></i> Tiêu chí chưa đạt hoặc thiếu thông tin (${unmetList.length + missingList.length})
                      </h4>
                      <ul class="text-xs space-y-2">
                        ${unmetList.map(u => `
                          <li class="flex items-start gap-1.5 bg-red-50 p-2 rounded text-red-900 border border-red-200">
                            <i data-lucide="x" class="icon-xs mt-0.5 text-danger"></i>
                            <span>${u}</span>
                          </li>
                        `).join('')}
                        ${missingList.map(mi => `
                          <li class="flex items-start gap-1.5 bg-yellow-50 p-2 rounded text-yellow-900 border border-yellow-200">
                            <i data-lucide="help-circle" class="icon-xs mt-0.5 text-warning"></i>
                            <span>${mi}</span>
                          </li>
                        `).join('')}
                        ${(unmetList.length === 0 && missingList.length === 0) ? '<li class="text-muted">Tất cả tiêu chí đều thỏa mãn!</li>' : ''}
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- TAB 3: INTERVIEWS & EVALUATIONS -->
                <div id="tab-interviews" class="detail-tab-pane" style="display: none;">
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-bold text-sm text-gray-800">Lịch phỏng vấn đã xếp</h4>
                      ${canManage ? `
                        <button class="btn btn-xs btn-outline" onclick="UI.closeModal('modal-cand-detail'); Router.navigate('/interviews', { candidateId: '${app.candidateId}' })">
                          <i data-lucide="plus" class="icon-xs"></i> Thêm lịch mới
                        </button>
                      ` : ''}
                    </div>

                    ${candInterviews.length > 0 ? `
                      <div class="space-y-2">
                        ${candInterviews.map(iv => `
                          <div class="p-3 border rounded bg-white flex items-center justify-between text-xs">
                            <div>
                              <span class="font-mono text-muted">${iv.code}</span> • <strong class="text-primary">${iv.round}</strong>
                              <div class="text-muted mt-1">
                                <i data-lucide="calendar" class="icon-xs inline"></i> ${Helpers.formatDate(iv.date)} lúc ${iv.startTime} - ${iv.endTime} (${iv.type === 'online' ? 'Trực tuyến' : 'Trực tiếp'})
                              </div>
                              <div class="text-muted mt-0.5">Người phỏng vấn: ${(iv.interviewers || []).join(', ')}</div>
                            </div>
                            <div>${Helpers.statusBadge(iv.status)}</div>
                          </div>
                        `).join('')}
                      </div>
                    ` : '<div class="empty-state-sm text-xs text-muted">Chưa có lịch phỏng vấn nào cho ứng viên này.</div>'}
                  </div>

                  <div class="section-divider mb-4"></div>

                  <div>
                    <h4 class="font-bold text-sm text-gray-800 mb-2">Phiếu đánh giá từ hội đồng phỏng vấn</h4>
                    ${candEvaluations.length > 0 ? `
                      <div class="space-y-3">
                        ${candEvaluations.map(ev => `
                          <div class="p-3 border rounded bg-white text-xs">
                            <div class="flex items-center justify-between mb-2">
                              <div>
                                <strong>${ev.evaluatorName}</strong> (${ev.evaluatorRole || 'Người phỏng vấn'})
                                <span class="text-muted ml-2">${Helpers.formatDateTime(ev.createdAt)}</span>
                              </div>
                              <span class="badge badge-success font-bold">${ev.overallScore} điểm</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded mb-2">
                              <div>Chuyên môn: <strong>${ev.scores?.professionalKnowledge || 0}/5</strong></div>
                              <div>Kỹ năng công việc: <strong>${ev.scores?.workSkills || 0}/5</strong></div>
                              <div>Kinh nghiệm: <strong>${ev.scores?.experience || 0}/5</strong></div>
                              <div>Giao tiếp & Teamwork: <strong>${ev.scores?.teamworkCommunication || 0}/5</strong></div>
                            </div>
                            <p class="italic text-gray-700">"${ev.comment || '—'}"</p>
                            <div class="mt-2 text-right">
                              Đề xuất: <strong class="text-primary">${ev.finalDecision || Helpers.getRecommendationLabel(ev.recommendation)}</strong>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : '<div class="empty-state-sm text-xs text-muted">Chưa có phiếu đánh giá phỏng vấn nào được nộp.</div>'}
                  </div>
                </div>

                <!-- TAB 4: HISTORY & NOTES -->
                <div id="tab-history" class="detail-tab-pane" style="display: none;">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <h4 class="font-bold text-sm text-gray-800 mb-2">Nhật ký trạng thái hồ sơ</h4>
                      <div class="timeline text-xs">
                        ${(app.statusHistory || []).map(h => `
                          <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                              <div class="timeline-header">
                                <span class="font-bold">${Helpers.getStatusLabel(h.status)}</span>
                                <span class="text-muted">${Helpers.formatDateTime(h.timestamp)}</span>
                              </div>
                              <div class="text-muted">Bởi: ${h.changedBy || 'Hệ thống'}</div>
                              <div class="mt-1">${h.note || ''}</div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>

                    <div>
                      <h4 class="font-bold text-sm text-gray-800 mb-2">Ghi chú nội bộ</h4>
                      <div class="space-y-2 mb-3 max-h-48 overflow-y-auto">
                        ${(app.internalNotes || []).map(n => `
                          <div class="bg-gray-50 border p-2 rounded text-xs">
                            <div class="flex justify-between text-muted mb-1">
                              <strong>${n.author}</strong>
                              <span>${Helpers.formatRelativeTime(n.timestamp)}</span>
                            </div>
                            <div class="text-gray-800">${n.content}</div>
                          </div>
                        `).join('') || '<div class="text-xs text-muted">Chưa có ghi chú nội bộ.</div>'}
                      </div>

                      <div class="form-group">
                        <textarea id="input-new-note" class="form-textarea text-xs" rows="2" placeholder="Nhập ghi chú mới cho hồ sơ này..."></textarea>
                        <button type="button" class="btn btn-xs btn-primary mt-1.5" onclick="CandidatesPage.handleAddNote('${app.id}')">
                          <i data-lucide="plus" class="icon-xs"></i> Lưu ghi chú
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="UI.closeModal('modal-cand-detail'); Router.navigate('/dashboard')">
                  <i data-lucide="arrow-left" class="icon-sm"></i> Quay lại Tổng quan
                </button>
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-cand-detail')">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Container có sẵn ở trang Ứng viên; khi mở từ trang khác (Sàng lọc, Tổng quan…)
      // thì tự tạo để nút "Xem hồ sơ ứng viên đầy đủ" luôn hoạt động.
      let container = document.getElementById('candidate-modals-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'candidate-modals-container';
        document.body.appendChild(container);
      }
      container.innerHTML = modalHtml;
      UI.openModal('modal-cand-detail');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    switchDetailTab(tabBtn, tabId) {
      document.querySelectorAll('#modal-cand-detail .tab-item').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');

      document.querySelectorAll('#modal-cand-detail .detail-tab-pane').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
      });

      const targetPane = document.getElementById(tabId);
      if (targetPane) {
        targetPane.style.display = 'block';
        targetPane.classList.add('active');
      }
    },

    handleStatusChange(appId, newStatus, defaultNote = '') {
      const statusLabel = Helpers.getStatusLabel(newStatus);
      UI.confirm({
        title: `Cập nhật trạng thái hồ sơ`,
        message: `Bạn có chắc muốn chuyển trạng thái ứng viên thành "${statusLabel}" không?`,
        type: newStatus === 'rejected' ? 'danger' : 'info',
        confirmText: 'Xác nhận chuyển',
        onConfirm: () => {
          const updated = ATSStore.updateApplicationStatus(appId, newStatus, defaultNote);
          const cand = updated ? (ATSStore.getCandidateById(updated.candidateId) || {}) : {};
          UI.toast({
            message: `Đã cập nhật trạng thái: ${statusLabel}${cand.fullName ? ` (${cand.fullName})` : ''}.`,
            type: 'success',
            duration: 5000
          });
          UI.closeModal('modal-cand-detail');
          this.refresh();
        }
      });
    },

    showRejectModal(appId) {
      const modalHtml = `
        <div class="modal active" id="modal-reject-reason">
          <div class="modal-dialog modal-md">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title text-danger">Từ chối hồ sơ ứng viên</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-reject-reason')">&times;</button>
              </div>
              <div class="modal-body">
                <p class="text-sm text-gray-700 mb-3">Vui lòng nêu rõ lý do từ chối để lưu lại trong hồ sơ ứng viên:</p>
                <div class="form-group mb-3">
                  <label class="form-label required">Lý do từ chối</label>
                  <select id="select-reject-preset" class="form-select mb-2" onchange="document.getElementById('input-reject-reason').value = this.value">
                    <option value="">-- Chọn lý do mẫu --</option>
                    <option value="Chưa đáp ứng đủ số năm kinh nghiệm yêu cầu">Chưa đáp ứng đủ số năm kinh nghiệm</option>
                    <option value="Thiếu kỹ năng chuyên môn bắt buộc">Thiếu kỹ năng chuyên môn bắt buộc</option>
                    <option value="Mức lương kỳ vọng vượt khung ngân sách vị trí">Mức lương vượt khung ngân sách</option>
                    <option value="Đã tuyển đủ chỉ tiêu cho vị trí này">Đã tuyển đủ chỉ tiêu</option>
                  </select>
                  <textarea id="input-reject-reason" class="form-textarea" rows="3" placeholder="Nhập lý do cụ thể..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-reject-reason')">Hủy</button>
                <button type="button" class="btn btn-danger" onclick="CandidatesPage.confirmReject('${appId}')">
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('candidate-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-reject-reason');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    confirmReject(appId) {
      const reason = document.getElementById('input-reject-reason')?.value || 'Không phù hợp tiêu chí tuyển dụng';
      const updated = ATSStore.updateApplicationStatus(appId, 'rejected', reason);
      UI.toast({
        message: 'Đã từ chối hồ sơ ứng viên.',
        type: 'warning',
        duration: 5000
      });
      UI.closeModal('modal-reject-reason');
      UI.closeModal('modal-cand-detail');
      this.refresh();
    },

    handleAddNote(appId) {
      const input = document.getElementById('input-new-note');
      if (!input || !input.value.trim()) return;

      ATSStore.addApplicationNote(appId, input.value.trim());
      UI.toast({ message: 'Đã lưu ghi chú nội bộ!', type: 'success' });
      input.value = '';
      this.showCandidateDetailModal(appId); // Refresh modal view
    },

    downloadRealCV(candidateId, fullName) {
      const cand = (ATSStore.getCandidateById ? ATSStore.getCandidateById(candidateId) : null) || (ATSStore.getCandidates ? ATSStore.getCandidates().find(c => c.id === candidateId) : null);
      const text = cand && cand.rawResumeText ? cand.rawResumeText : null;
      if (!text || !text.trim()) {
        UI.toast({ message: 'Không tìm thấy file CV gốc cho ứng viên này.', type: 'warning' });
        return;
      }
      const filename = (fullName || 'CV') + '.txt';
      try {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        UI.toast({ message: 'Đã bắt đầu tải CV xuống máy.', type: 'success' });
      } catch (err) {
        UI.toast({ message: 'Không thể tải CV. Vui lòng thử lại.', type: 'warning' });
      }
    },

    showManualUploadModal() {
      const requisitions = ATSStore.getRequisitions().filter(r => r.status === 'recruiting' || r.status === 'approved');

      const modalHtml = `
        <div class="modal active" id="modal-manual-upload">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">Tải lên hồ sơ ứng viên thủ công</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-manual-upload')">&times;</button>
              </div>
              <form id="form-manual-upload">
                <div class="modal-body">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Vị trí ứng tuyển</label>
                      <select name="requisitionId" id="select-upload-req" class="form-select" required>
                        ${requisitions.map(r => `<option value="${r.id}">${r.title} (${r.department})</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Nguồn ứng viên</label>
                      <select name="source" class="form-select" required>
                        <option value="referral">Giới thiệu nội bộ</option>
                        <option value="topcv">TopCV (Nhập ngoài)</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="vietnamworks">VietnamWorks</option>
                        <option value="website">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Họ và tên ứng viên</label>
                      <input type="text" name="fullName" id="upload-name" class="form-input" required placeholder="Nguyễn Văn A">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Địa chỉ Email</label>
                      <input type="email" name="email" id="upload-email" class="form-input" required placeholder="email@gmail.com">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Số điện thoại</label>
                      <input type="text" name="phone" id="upload-phone" class="form-input" required placeholder="098xxxxxxx">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Trình độ học vấn</label>
                      <input type="text" name="education" id="upload-edu" class="form-input" value="Đại học">
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label">Giới tính</label>
                      <select name="gender" id="upload-gender" class="form-select">
                        <option value="" selected>Vui lòng chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Ngày sinh</label>
                      <input type="date" name="dob" id="upload-dob" class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Số năm kinh nghiệm</label>
                      <input type="number" step="0.5" min="0" max="60" name="experienceYears" id="upload-exp" class="form-input" value="2" placeholder="Ví dụ: 2.5" oninput="this.value = Math.max(0, Math.min(60, parseFloat(this.value) || 0)); if (this.value === '') this.value = '';">
                    </div>
                  </div>

                  <div class="section-divider mb-3"></div>

                  <!-- Upload or Paste CV Zone (Placed below Experience) -->
                  <div class="form-group mb-3">
                    <label class="form-label required font-bold">Tải lên tệp CV (PDF/DOCX/TXT) hoặc dán văn bản CV</label>
                    <div class="border-2 border-dashed border-gray-300 p-3.5 rounded text-center mb-2 hover:bg-gray-50 transition cursor-pointer" id="drop-cv-zone" role="button" tabindex="0" aria-label="Tải lên tệp CV: bấm hoặc kéo thả tệp vào khung này">
                      <i data-lucide="file-up" class="w-7 h-7 text-primary mx-auto mb-1"></i>
                      <div class="text-xs text-muted">Kéo thả tệp CV vào đây hoặc <span class="text-primary font-bold underline">chọn tệp từ máy</span></div>
                      <input type="file" id="file-cv-input" class="hidden" accept=".txt,.pdf,.docx">
                    </div>
                    <textarea name="rawResumeText" id="textarea-raw-cv" class="form-textarea font-mono text-xs" rows="5" placeholder="Dán nội dung CV văn bản tại đây để hệ thống tự động trích xuất thông tin, phân tích từ khóa NLP và đối chiếu tiêu chí..."></textarea>
                    <button type="button" class="btn btn-xs btn-outline mt-1.5" id="btn-parse-cv-text">
                      <i data-lucide="sparkles" class="icon-xs text-primary"></i> Tự động phân tích & trích xuất CV bằng NLP
                    </button>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-manual-upload')">Đóng</button>
                  <button type="submit" class="btn btn-primary">
                    <i data-lucide="check" class="icon-sm"></i> Thêm hồ sơ & Sàng lọc ngay
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('candidate-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-manual-upload');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Bấm vào BẤT KỲ đâu trong khung hoặc kéo–thả tệp vào khung để chọn CV
        const dropZone = document.getElementById('drop-cv-zone');
        const fileInput = document.getElementById('file-cv-input');

        const assignDroppedFile = (list) => {
          if (!fileInput || !list || !list.length) return false;
          try {
            if (typeof DataTransfer === 'function') {
              const dt = new DataTransfer();
              dt.items.add(list[0]);
              fileInput.files = dt.files;
            } else {
              fileInput.files = list;
            }
          } catch (_) {
            return false;
          }
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        };

        if (dropZone && fileInput) {
          dropZone.addEventListener('click', (e) => {
            if (e.target === fileInput) return;
            e.preventDefault();
            fileInput.click();
          });
          dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
              e.preventDefault();
              fileInput.click();
            }
          });
          ['dragenter', 'dragover'].forEach((eventName) => {
            dropZone.addEventListener(eventName, (e) => {
              e.preventDefault();
              e.stopPropagation();
              dropZone.classList.add('bg-primary-50', 'border-primary');
            });
          });
          ['dragleave', 'dragend'].forEach((eventName) => {
            dropZone.addEventListener(eventName, (e) => {
              e.preventDefault();
              e.stopPropagation();
              dropZone.classList.remove('bg-primary-50', 'border-primary');
            });
          });
          dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('bg-primary-50', 'border-primary');
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length && !assignDroppedFile(files)) {
              UI.toast({ message: 'Không nhận được tệp. Vui lòng bấm vào khung để chọn tệp.', type: 'warning' });
            }
          });
        }

        if (fileInput) {
          fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
              const text = await CVFile.extractText(file);
              if (!text || !text.trim()) {
                UI.toast({ message: `Tệp ${file.name} không có nội dung văn bản đọc được.`, type: 'warning' });
                return;
              }
              const textarea = document.getElementById('textarea-raw-cv');
              if (textarea) textarea.value = text;
              this.parseAndFillCV(text);
              UI.toast({ message: `Đã đọc nội dung từ ${file.name}.`, type: 'success' });
            } catch (err) {
              UI.toast({ message: err && err.message ? err.message : 'Không đọc được tệp CV.', type: 'warning' });
            }
          });
        }

        // Wire parse button
        const parseBtn = document.getElementById('btn-parse-cv-text');
        if (parseBtn) {
          parseBtn.addEventListener('click', () => {
            const text = document.getElementById('textarea-raw-cv')?.value || '';
            if (!text.trim()) {
              UI.toast({ message: 'Vui lòng dán nội dung văn bản CV trước khi bấm phân tích.', type: 'warning' });
              return;
            }
            this.parseAndFillCV(text);
          });
        }

        // Wire submit
        document.getElementById('form-manual-upload').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const reqId = fd.get('requisitionId');
          const source = fd.get('source');
          const rawCV = fd.get('rawResumeText') || '';
          const parsedFromCV = ATSStore.parseCVText ? ATSStore.parseCVText(rawCV) : { skills: [] };

          const experienceYears = parseFloat(fd.get('experienceYears'));
          if (!Helpers.isValidExperienceYears(experienceYears)) {
            UI.toast({
              message: 'Số năm kinh nghiệm phải là số không âm (từ 0 đến 60). Vui lòng nhập lại.',
              type: 'warning',
              duration: 6000
            });
            const expInput = document.getElementById('upload-exp');
            if (expInput) expInput.focus();
            return;
          }

          const candidateData = {
            fullName: fd.get('fullName'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            gender: fd.get('gender') || '',
            dob: fd.get('dob') || '',
            experienceYears,
            education: fd.get('education') || 'Đại học',
            skills: parsedFromCV.skills || [],
            certifications: parsedFromCV.certifications || [],
            rawResumeText: rawCV
          };

          const newApp = ATSStore.submitApplication({
            candidateData,
            requisitionId: reqId,
            source
          });

          const autoNote = newApp.screeningDetails?.autoApproved
            ? ' AI đã tự động duyệt sang bước Đạt – Chờ phỏng vấn.'
            : '';
          UI.toast({ message: `Đã tiếp nhận hồ sơ thành công! AI Sàng lọc đánh giá: ${newApp.screeningScore}đ (${Helpers.getScreeningLabel(newApp.screeningResult)}).${autoNote}`, type: 'success' });
          UI.closeModal('modal-manual-upload');
          this.refresh();
        });
      }
    },

    parseAndFillCV(text) {
      const parsed = ATSStore.parseCVText(text);
      let filled = false;

      // Chỉ điền ô đang trống/giá trị mặc định — không ghi đè dữ liệu HR đã nhập.
      const setIfEmpty = (id, value, defaults = []) => {
        const el = document.getElementById(id);
        if (!el) return;
        const next = value === undefined || value === null ? '' : String(value).trim();
        if (!next) return;
        const current = String(el.value || '').trim();
        if (current !== '' && !defaults.includes(current)) return;
        el.value = next;
        filled = true;
      };

      setIfEmpty('upload-name', parsed.name !== 'Ứng viên chưa rõ họ tên' ? parsed.name : '');
      setIfEmpty('upload-email', parsed.email);
      setIfEmpty('upload-phone', parsed.phone);
      setIfEmpty('upload-gender', parsed.gender);
      setIfEmpty('upload-dob', parsed.dob);
      setIfEmpty('upload-edu', parsed.education !== 'Đang cập nhật' ? parsed.education : '', ['Đại học']);
      setIfEmpty('upload-exp', parsed.experienceYears, ['2']);
      setIfEmpty('upload-skills', parsed.skills && parsed.skills.length ? parsed.skills.join(', ') : '');

      UI.toast({
        message: filled
          ? 'Đã trích xuất thông tin CV (chỉ điền các ô còn trống).'
          : 'CV đã đọc xong nhưng các ô thông tin đã có dữ liệu — giữ nguyên nội dung bạn đã nhập.',
        type: filled ? 'success' : 'info',
        duration: 5000
      });
    }
  };
})();
