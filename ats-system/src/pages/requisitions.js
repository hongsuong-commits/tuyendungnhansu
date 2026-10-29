/**
 * requisitions.js - Module Quản lý Yêu cầu tuyển dụng
 * Quản lý quy trình: Tạo yêu cầu -> Phê duyệt -> Tạo tin đăng tuyển
 */

const RequisitionsPage = (() => {
  let _activeFilter = 'all';
  let _activeDept = 'all';
  let _searchQuery = '';

  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const role = user.role;
      const canCreate = role === 'department_head';
      const departments = ATSStore.getDepartments();

      // Filter by department head constraint
      let reqs = ATSStore.getRequisitions({
        status: _activeFilter,
        department: role === 'department_head' ? user.department : _activeDept,
        search: _searchQuery
      });

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Yêu cầu tuyển dụng</h1>
              <p class="page-subtitle">Quản lý định biên, nhu cầu nhân sự và phê duyệt kế hoạch tuyển dụng</p>
            </div>
            <div class="page-actions">
              ${canCreate ? `
                <button class="btn btn-primary" id="btn-create-req">
                  <i data-lucide="plus" class="icon-sm"></i> Tạo yêu cầu mới
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="card mb-4">
            <div class="card-body py-3">
              <div class="filter-toolbar">
                <div class="search-box">
                  <i data-lucide="search" class="search-icon"></i>
                  <input type="text" id="req-search-input" class="form-input" placeholder="Tìm theo mã hoặc tên vị trí..." value="${_searchQuery}">
                </div>

                <div class="filter-group">
                  <label class="filter-label">Trạng thái:</label>
                  <select id="req-status-filter" class="form-select">
                    <option value="all" ${_activeFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="pending" ${_activeFilter === 'pending' ? 'selected' : ''}>Chờ phê duyệt</option>
                    <option value="approved" ${_activeFilter === 'approved' ? 'selected' : ''}>Đã phê duyệt</option>
                    <option value="recruiting" ${_activeFilter === 'recruiting' ? 'selected' : ''}>Đang tuyển</option>
                    <option value="rejected" ${_activeFilter === 'rejected' ? 'selected' : ''}>Từ chối</option>
                    <option value="closed" ${_activeFilter === 'closed' ? 'selected' : ''}>Đã đóng</option>
                  </select>
                </div>

                ${role !== 'department_head' ? `
                  <div class="filter-group">
                    <label class="filter-label">Phòng ban:</label>
                    <select id="req-dept-filter" class="form-select">
                      <option value="all" ${_activeDept === 'all' ? 'selected' : ''}>Tất cả phòng ban</option>
                      ${departments.map(d => `<option value="${d}" ${_activeDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Requisitions List Table -->
          <div class="card">
            <div class="card-body card-body-no-padding">
              ${this._renderTable(reqs, user)}
            </div>
          </div>

          <!-- Modals Container -->
          <div id="req-modals-container"></div>
        </div>
      `;
    },

    _renderTable(reqs, user) {
      if (!reqs || reqs.length === 0) {
        return `
          <div class="empty-state">
            <i data-lucide="folder-open" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Chưa có yêu cầu tuyển dụng nào</h3>
            <p class="empty-state-description">Không tìm thấy yêu cầu tuyển dụng phù hợp với bộ lọc hiện tại.</p>
          </div>
        `;
      }

      const rows = reqs.map((r, index) => {
        const canApprove = (user.role === 'director' || user.role === 'hr') && r.status === 'pending';
        const canPost = (user.role === 'hr') && r.status === 'approved';
        const canEdit = (user.role === 'hr') || (user.role === 'department_head' && r.status === 'pending' && r.creatorId === user.id);

        return `
          <tr>
            <td>
              <a href="javascript:void(0)" class="table-name btn-view-req" data-id="${r.id}" title="${r.title}">${Helpers.truncate(r.title, 34)}</a>
              <span class="table-sub">${r.code} · ${r.department}</span>
            </td>
            <td class="col-compact"><span class="table-sub">${r.quantity} người</span></td>
            <td class="col-compact"><span class="table-sub">${r.salary || 'Thỏa thuận'}</span></td>
            <td><span class="table-sub">${Helpers.formatDate(r.deadline)}</span></td>
            <td>${Helpers.statusBadge(r.status)}</td>
            <td class="text-right">
              <div class="table-actions">
                <button class="btn btn-xs btn-outline btn-view-req" data-id="${r.id}" title="Xem chi tiết">
                  <i data-lucide="eye" class="icon-xs"></i> Xem
                </button>

                ${canApprove ? `
                  <button class="btn btn-xs btn-outline btn-quick-approve btn-approve-req" data-id="${r.id}" title="Phê duyệt">
                    <i data-lucide="check" class="icon-xs"></i> Duyệt
                  </button>
                  <button class="btn btn-xs btn-icon btn-outline btn-quick-reject btn-reject-req" data-id="${r.id}" title="Từ chối" aria-label="Từ chối">
                    <i data-lucide="x" class="icon-xs"></i>
                  </button>
                ` : ''}

                ${canPost ? `
                  <button class="btn btn-xs btn-primary btn-publish-req" data-id="${r.id}" title="Tạo & Đăng tin tuyển dụng">
                    <i data-lucide="send" class="icon-xs"></i> Đăng tin
                  </button>
                ` : ''}

                ${canEdit ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-edit-req" data-id="${r.id}" title="Chỉnh sửa" aria-label="Chỉnh sửa">
                    <i data-lucide="edit-3" class="icon-xs"></i>
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
                <th>Yêu cầu · phòng ban</th>
                <th class="col-compact">Số lượng</th>
                <th class="col-compact">Mức lương</th>
                <th>Hạn nộp</th>
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
      const container = document.getElementById('app');
      if (!container) return;

      // Search input with debounce
      const searchInput = document.getElementById('req-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', Helpers.debounce((e) => {
          _searchQuery = e.target.value.trim();
          this.refresh();
        }, 300));
      }

      // Filter change
      const statusFilter = document.getElementById('req-status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          _activeFilter = e.target.value;
          this.refresh();
        });
      }

      const deptFilter = document.getElementById('req-dept-filter');
      if (deptFilter) {
        deptFilter.addEventListener('change', (e) => {
          _activeDept = e.target.value;
          this.refresh();
        });
      }

      // Create Requisition button
      const btnCreate = document.getElementById('btn-create-req');
      if (btnCreate) {
        btnCreate.addEventListener('click', () => {
          this.showCreateModal();
        });
      }

      // View detail buttons
      document.querySelectorAll('.btn-view-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showDetailModal(id);
        });
      });

      // Approve buttons
      document.querySelectorAll('.btn-approve-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleApproval(id, true);
        });
      });

      // Reject buttons
      document.querySelectorAll('.btn-reject-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleApproval(id, false);
        });
      });

      // Publish / Create Posting button
      document.querySelectorAll('.btn-publish-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showPublishModal(id);
        });
      });

      // Edit buttons
      document.querySelectorAll('.btn-edit-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showCreateModal(id);
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

    showDetailModal(id) {
      const req = ATSStore.getRequisitionById(id);
      if (!req) return;

      const user = ATSStore.getCurrentUser();
      const modalHtml = `
        <div class="modal active" id="modal-req-detail">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <div class="text-xs text-muted mb-1 font-mono">${req.code}</div>
                  <h3 class="modal-title">${req.title}</h3>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-req-detail')">&times;</button>
              </div>
              <div class="modal-body">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span class="text-xs text-muted">Phòng ban:</span>
                    <p class="font-semibold">${req.department}</p>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Số lượng cần tuyển:</span>
                    <p class="font-semibold text-primary">${req.quantity} nhân sự</p>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Mức lương dự kiến:</span>
                    <p class="font-semibold text-success">${req.salary || 'Thỏa thuận'}</p>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Hình thức & Địa điểm:</span>
                    <p class="font-medium">${req.workType} • ${req.location}</p>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Hạn nộp hồ sơ:</span>
                    <p class="font-medium">${Helpers.formatDate(req.deadline)}</p>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Trạng thái:</span>
                    <div>${Helpers.statusBadge(req.status)}</div>
                  </div>
                </div>

                <div class="section-divider mb-3"></div>

                <div class="mb-3">
                  <h4 class="font-semibold text-sm mb-1 text-gray-800">Lý do tuyển dụng</h4>
                  <p class="text-sm bg-gray-50 p-2.5 rounded">${req.reason || '—'}</p>
                </div>

                <div class="mb-3">
                  <h4 class="font-semibold text-sm mb-1 text-gray-800">Mô tả công việc</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(req.description)}</div>
                </div>

                <div class="mb-3">
                  <h4 class="font-semibold text-sm mb-1 text-gray-800">Yêu cầu chuyên môn & kinh nghiệm</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(req.requirements)}</div>
                </div>

                <div class="mb-3">
                  <h4 class="font-semibold text-sm mb-1 text-gray-800">Kỹ năng bắt buộc (Dùng cho AI Sàng lọc CV)</h4>
                  <div class="flex flex-wrap gap-2 mt-1">
                    ${(req.skills || []).map(s => `<span class="badge badge-primary">${s}</span>`).join('')}
                  </div>
                </div>

                <div class="mb-3">
                  <h4 class="font-semibold text-sm mb-2 text-gray-800">Lịch sử phê duyệt</h4>
                  <div class="timeline">
                    ${(req.approvalHistory || []).map(h => `
                      <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                          <div class="timeline-header">
                            <span class="font-semibold">${h.by}</span>
                            <span class="text-xs text-muted">${Helpers.formatDateTime(h.date)}</span>
                          </div>
                          <div class="text-sm">${h.note} (${Helpers.getStatusLabel(h.status)})</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-req-detail')">Đóng</button>
                ${(user.role === 'director' || user.role === 'hr') && req.status === 'pending' ? `
                  <button type="button" class="btn btn-danger" onclick="RequisitionsPage.handleApproval('${req.id}', false); UI.closeModal('modal-req-detail');">Từ chối</button>
                  <button type="button" class="btn btn-success" onclick="RequisitionsPage.handleApproval('${req.id}', true); UI.closeModal('modal-req-detail');">Phê duyệt</button>
                ` : ''}
                ${user.role === 'hr' && req.status === 'approved' ? `
                  <button type="button" class="btn btn-primary" onclick="UI.closeModal('modal-req-detail'); RequisitionsPage.showPublishModal('${req.id}');">Tạo tin tuyển dụng</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('req-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-req-detail');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showCreateModal(editId = null) {
      const user = ATSStore.getCurrentUser();
      const isEdit = !!editId;
      const req = isEdit ? ATSStore.getRequisitionById(editId) : null;
      const departments = ATSStore.getDepartments();

      const modalHtml = `
        <div class="modal active" id="modal-req-form">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">${isEdit ? 'Chỉnh sửa yêu cầu tuyển dụng' : 'Tạo yêu cầu tuyển dụng mới'}</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-req-form')">&times;</button>
              </div>
              <form id="form-req-submit">
                <div class="modal-body">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Tên vị trí cần tuyển</label>
                      <input type="text" name="title" class="form-input" required value="${req ? req.title : ''}" placeholder="Ví dụ: Senior Frontend Developer">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Phòng ban</label>
                      <select name="department" class="form-select" required ${user.role === 'department_head' ? 'disabled' : ''}>
                        ${departments.map(d => `<option value="${d}" ${(req ? req.department : user.department) === d ? 'selected' : ''}>${d}</option>`).join('')}
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Số lượng cần tuyển</label>
                      <input type="number" name="quantity" min="1" max="100" class="form-input" required value="${req ? req.quantity : '1'}">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Mức lương dự kiến</label>
                      <input type="text" name="salary" class="form-input" required value="${req ? req.salary : '20.000.000 - 30.000.000 VNĐ'}" placeholder="Ví dụ: 15 - 25 triệu VNĐ">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Hạn nộp hồ sơ</label>
                      <input type="date" name="deadline" class="form-input" required value="${req ? req.deadline : '2026-11-30'}">
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label">Hình thức làm việc</label>
                      <select name="workType" class="form-select">
                        <option value="Toàn thời gian" ${req && req.workType === 'Toàn thời gian' ? 'selected' : ''}>Toàn thời gian</option>
                        <option value="Bán thời gian" ${req && req.workType === 'Bán thời gian' ? 'selected' : ''}>Bán thời gian</option>
                        <option value="Hybrid (Linh hoạt)" ${req && req.workType === 'Hybrid (Linh hoạt)' ? 'selected' : ''}>Hybrid (Linh hoạt)</option>
                        <option value="Remote (Từ xa)" ${req && req.workType === 'Remote (Từ xa)' ? 'selected' : ''}>Remote (Từ xa)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Địa điểm làm việc</label>
                      <input type="text" name="location" class="form-input" value="${req ? req.location : 'Hà Nội'}" placeholder="Ví dụ: Hà Nội / TP.HCM">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Kinh nghiệm tối thiểu (năm)</label>
                      <input type="number" step="0.5" name="minExperience" class="form-input" value="${req ? req.minExperience : '2'}">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Lý do tuyển dụng</label>
                    <input type="text" name="reason" class="form-input" required value="${req ? req.reason : ''}" placeholder="Mở rộng kinh doanh / Thay thế nhân sự...">
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Kỹ năng bắt buộc (Cách nhau bằng dấu phẩy)</label>
                    <input type="text" name="skills" class="form-input" required value="${req ? (req.skills || []).join(', ') : 'React, TypeScript, JavaScript'}" placeholder="React, TypeScript, Tailwind CSS...">
                    <small class="text-xs text-muted">Hệ thống sẽ đối chiếu tự động các kỹ năng này với CV ứng viên khi sàng lọc.</small>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Mô tả công việc (JD)</label>
                    <textarea name="description" class="form-textarea" rows="3" required placeholder="Nêu cụ thể trách nhiệm công việc...">${req ? req.description : ''}</textarea>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Yêu cầu chuyên môn</label>
                    <textarea name="requirements" class="form-textarea" rows="3" required placeholder="Bằng cấp, kỹ năng, thái độ...">${req ? req.requirements : ''}</textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-req-form')">Hủy</button>
                  <button type="submit" class="btn btn-primary" id="btn-submit-req">
                    <i data-lucide="save" class="icon-sm"></i> ${isEdit ? 'Lưu yêu cầu tuyển dụng' : 'Lưu & Gửi yêu cầu tuyển dụng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('req-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-req-form');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('form-req-submit').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const rawSkills = fd.get('skills') ? fd.get('skills').split(',').map(s => s.trim()).filter(Boolean) : [];

          const payload = {
            title: fd.get('title'),
            department: fd.get('department') || user.department,
            quantity: parseInt(fd.get('quantity'), 10) || 1,
            salary: fd.get('salary'),
            deadline: fd.get('deadline'),
            workType: fd.get('workType'),
            location: fd.get('location'),
            minExperience: parseFloat(fd.get('minExperience')) || 0,
            reason: fd.get('reason'),
            skills: rawSkills,
            description: fd.get('description'),
            requirements: fd.get('requirements'),
            creatorId: user.id,
            creatorName: user.fullName || user.username
          };

          if (isEdit) {
            ATSStore.updateRequisition(editId, payload);
            UI.toast({ message: 'Cập nhật yêu cầu tuyển dụng thành công!', type: 'success' });
          } else {
            ATSStore.createRequisition(payload);
            UI.toast({ message: 'Tạo yêu cầu tuyển dụng thành công, đã chuyển sang trạng thái chờ phê duyệt!', type: 'success' });
          }

          UI.closeModal('modal-req-form');
          this.refresh();
        });
      }
    },

    showPublishModal(requisitionId) {
      const req = ATSStore.getRequisitionById(requisitionId);
      if (!req) return;

      const modalHtml = `
        <div class="modal active" id="modal-publish-job">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">Tạo & Xuất bản tin tuyển dụng</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-publish-job')">&times;</button>
              </div>
              <form id="form-publish-job">
                <div class="modal-body">
                  <div class="alert alert-info mb-3">
                    <i data-lucide="info" class="icon-sm"></i>
                    <div>Tin tuyển dụng sẽ được xuất bản lên <strong>Cổng thông tin tuyển dụng SmartATS</strong> và đồng bộ với các kênh được lựa chọn bên dưới.</div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Tiêu đề tin tuyển dụng thu hút ứng viên</label>
                    <input type="text" name="postingTitle" class="form-input" required value="Tuyển dụng ${req.title} - Lương hấp dẫn">
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label">Mức lương hiển thị</label>
                      <input type="text" name="salary" class="form-input" value="${req.salary}">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Hạn ứng tuyển</label>
                      <input type="date" name="deadline" class="form-input" value="${req.deadline}">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label">Chế độ phúc lợi & Đãi ngộ (Benefits)</label>
                    <textarea name="benefits" class="form-textarea" rows="3">- Thưởng tháng 13 + thưởng hiệu quả kinh doanh dự án\n- Bảo hiểm sức khỏe PVI cao cấp\n- Nghỉ phép 14 ngày/năm, du lịch hàng năm\n- Được tài trợ chi phí thi chứng chỉ chuyên môn</textarea>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label font-semibold">Chọn kênh đăng tuyển tích hợp</label>
                    <div class="grid grid-cols-2 gap-2 mt-2">
                      <label class="checkbox-label p-2 border rounded bg-gray-50">
                        <input type="checkbox" name="channel_website" checked disabled class="form-checkbox">
                        <span class="font-medium text-sm">Website Tuyển dụng SmartATS (Mặc định)</span>
                      </label>
                      <label class="checkbox-label p-2 border rounded">
                        <input type="checkbox" name="channel_topcv" checked class="form-checkbox">
                        <span class="font-medium text-sm">TopCV (Đồng bộ qua API)</span>
                      </label>
                      <label class="checkbox-label p-2 border rounded">
                        <input type="checkbox" name="channel_linkedin" checked class="form-checkbox">
                        <span class="font-medium text-sm">LinkedIn Jobs Network</span>
                      </label>
                      <label class="checkbox-label p-2 border rounded">
                        <input type="checkbox" name="channel_vietnamworks" class="form-checkbox">
                        <span class="font-medium text-sm">VietnamWorks</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-publish-job')">Đóng</button>
                  <button type="submit" class="btn btn-primary" id="btn-submit-publish">
                    <i data-lucide="save" class="icon-sm"></i> Lưu & Đăng tin tuyển dụng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('req-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-publish-job');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('form-publish-job').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const postData = {
            title: fd.get('postingTitle'),
            salary: fd.get('salary'),
            deadline: fd.get('deadline'),
            benefits: fd.get('benefits')
          };

          const newPost = ATSStore.createPostingFromRequisition(requisitionId, postData);
          UI.toast({ message: `Đã xuất bản tin tuyển dụng mã ${newPost.code} thành công!`, type: 'success' });
          UI.closeModal('modal-publish-job');
          this.refresh();
        });
      }
    },

    handleApproval(id, isApproved) {
      const actionName = isApproved ? 'Phê duyệt' : 'Từ chối';
      UI.confirm({
        title: `${actionName} yêu cầu tuyển dụng`,
        message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} yêu cầu tuyển dụng này không?`,
        type: isApproved ? 'info' : 'danger',
        confirmText: actionName,
        onConfirm: () => {
          ATSStore.approveRequisition(id, isApproved);
          UI.toast({ message: `Đã ${actionName.toLowerCase()} yêu cầu thành công!`, type: isApproved ? 'success' : 'warning' });
          this.refresh();
        }
      });
    }
  };
})();
