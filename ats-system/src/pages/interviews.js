/**
 * interviews.js - Module Lịch phỏng vấn theo phong cách Tanca ATS
 * Hỗ trợ chế độ xem Lịch Tuần (Week view), Danh sách (List view), phát hiện trùng lịch,
 * gửi thư mời mô phỏng và cập nhật trạng thái phỏng vấn.
 */

const InterviewsPage = (() => {
  let _activeView = 'week'; // 'week' | 'list'
  let _activeStatus = 'all';
  let _activeInterviewer = 'all';
  let _searchQuery = '';
  let _currentWeekDate = new Date();

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  return {
    render(params = {}) {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const interviews = ATSStore.getInterviews({
        status: _activeStatus,
        interviewer: _activeInterviewer,
        search: _searchQuery
      });

      const users = ATSStore.getUsers().filter(u => u.role !== 'candidate');
      const canSchedule = user.role === 'hr' || user.role === 'department_head';

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Lịch phỏng vấn</h1>
              <p class="page-subtitle">Quản lý các vòng phỏng vấn, điều phối hội đồng và gửi thông báo mời ứng viên</p>
            </div>
            <div class="page-actions">
              ${canSchedule ? `
                <button class="btn btn-primary" id="btn-create-interview">
                  <i data-lucide="calendar-plus" class="icon-sm"></i> Thêm lịch
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Toolbar: View Mode Toggle & Filters -->
          <div class="card mb-4">
            <div class="card-body py-3">
              <div class="filter-toolbar">
                <!-- View switch: List vs Week -->
                <div class="btn-group" id="view-mode-toggle">
                  <button class="btn btn-sm ${_activeView === 'week' ? 'btn-primary' : 'btn-outline'}" id="btn-view-week">
                    <i data-lucide="calendar" class="icon-xs"></i> Lịch tuần
                  </button>
                  <button class="btn btn-sm ${_activeView === 'list' ? 'btn-primary' : 'btn-outline'}" id="btn-view-list">
                    <i data-lucide="list" class="icon-xs"></i> Dạng danh sách
                  </button>
                </div>

                <div class="search-box">
                  <i data-lucide="search" class="search-icon"></i>
                  <input type="text" id="iv-search-input" class="form-input" placeholder="Tìm theo tên ứng viên, vị trí..." value="${_searchQuery}">
                </div>

                <div class="filter-group">
                  <label class="filter-label">Trạng thái:</label>
                  <select id="iv-status-filter" class="form-select">
                    <option value="all" ${_activeStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="confirmed" ${_activeStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                    <option value="pending" ${_activeStatus === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
                    <option value="completed" ${_activeStatus === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                    <option value="cancelled" ${_activeStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Người phỏng vấn:</label>
                  <select id="iv-interviewer-filter" class="form-select">
                    <option value="all" ${_activeInterviewer === 'all' ? 'selected' : ''}>Tất cả hội đồng</option>
                    ${users.map(u => `<option value="${u.fullName}" ${_activeInterviewer === u.fullName ? 'selected' : ''}>${u.fullName} (${Helpers.getRoleLabel(u.role)})</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Content: Week Calendar OR List Table -->
          <div class="card">
            <div class="card-body card-body-no-padding">
              ${_activeView === 'week' ? this._renderWeekCalendar(interviews) : this._renderTable(interviews, user)}
            </div>
          </div>

          <!-- Modals Container -->
          <div id="interview-modals-container"></div>
        </div>
      `;
    },

    _renderTable(interviews, user) {
      if (!interviews || interviews.length === 0) {
        return `
          <div class="empty-state">
            <i data-lucide="calendar-x" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Chưa có lịch phỏng vấn nào</h3>
            <p class="empty-state-description">Bấm nút "Xếp lịch phỏng vấn mới" để bắt đầu xếp lịch gặp ứng viên.</p>
          </div>
        `;
      }

      const rows = interviews.map((iv, index) => {
        const canEdit = user.role === 'hr' || user.role === 'department_head';

        return `
          <tr>
            <td class="text-center font-medium">${index + 1}</td>
            <td><span class="badge badge-secondary font-mono">${iv.code}</span></td>
            <td>
              <strong class="text-gray-900">${iv.candidateName}</strong>
              <div class="text-xs text-muted mt-0.5">${Helpers.truncate(iv.positionTitle, 35)}</div>
            </td>
            <td>
              <span class="badge badge-primary text-xs font-semibold">${iv.round}</span>
            </td>
            <td>
              <div class="font-bold text-xs text-primary">${Helpers.formatDate(iv.date)}</div>
              <div class="text-xs text-muted">${iv.startTime} - ${iv.endTime}</div>
            </td>
            <td>
              <span class="badge ${iv.type === 'online' ? 'badge-info' : 'badge-secondary'} text-xs">
                <i data-lucide="${iv.type === 'online' ? 'video' : 'map-pin'}" class="icon-xs inline"></i>
                ${iv.type === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
              </span>
              <div class="text-xs text-muted mt-0.5" title="${iv.location}">${Helpers.truncate(iv.location, 30)}</div>
            </td>
            <td>
              <div class="text-xs font-medium">${(iv.interviewers || []).join(', ')}</div>
            </td>
            <td>${Helpers.statusBadge(iv.status)}</td>
            <td class="text-right">
              <div class="table-actions">
                <button class="btn btn-xs btn-ghost btn-email-preview" data-id="${iv.id}" title="Xem trước thư mời phỏng vấn">
                  <i data-lucide="mail" class="icon-xs"></i>
                </button>
                <button class="btn btn-xs btn-ghost btn-view-iv" data-id="${iv.id}" title="Chi tiết lịch">
                  <i data-lucide="eye" class="icon-xs"></i>
                </button>
                ${canEdit && iv.status !== 'completed' && iv.status !== 'cancelled' ? `
                  <button class="btn btn-xs btn-success btn-finish-iv" data-id="${iv.id}" title="Đánh dấu hoàn thành & Chấm điểm">
                    <i data-lucide="check" class="icon-xs"></i> Đánh giá
                  </button>
                  <button class="btn btn-xs btn-danger btn-cancel-iv" data-id="${iv.id}" title="Hủy lịch">
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
          <table class="data-table table-sticky-actions">
            <thead>
              <tr>
                <th class="text-center" style="width: 45px;">STT</th>
                <th>Mã lịch</th>
                <th>Ứng viên & Vị trí</th>
                <th>Vòng phỏng vấn</th>
                <th>Thời gian</th>
                <th>Hình thức & Địa điểm</th>
                <th>Hội đồng PV</th>
                <th>Trạng thái</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    },

    _renderWeekCalendar(interviews) {
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      const monday = getMonday(_currentWeekDate);
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDays.push(d);
      }

      const sunday = weekDays[6];
      const todayStr = new Date().toISOString().split('T')[0];

      const weekLabel = `Tuần từ ${Helpers.formatDate(monday.toISOString())} đến ${Helpers.formatDate(sunday.toISOString())}`;

      const columnsHtml = weekDays.map((dateObj, idx) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const dayNum = dateObj.getDate();
        const monthNum = dateObj.getMonth() + 1;
        const dayFormatted = `${String(dayNum).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}`;

        const dayInterviews = interviews.filter(iv => iv.date === dateStr && iv.status !== 'cancelled');

        const ivCards = dayInterviews.map(iv => `
          <div class="week-iv-card p-2.5 rounded-lg border bg-white mb-2 shadow-xs cursor-pointer hover:shadow-md transition text-left"
               onclick="InterviewsPage.showDetailModal('${iv.id}')"
               title="${iv.startTime} - ${iv.candidateName} (${iv.round})">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="badge badge-primary text-2xs font-mono font-bold">${iv.startTime} - ${iv.endTime}</span>
              <span class="badge ${iv.type === 'online' ? 'badge-info' : 'badge-secondary'} text-2xs">${iv.type === 'online' ? 'Online' : 'Trực tiếp'}</span>
            </div>
            <div class="font-bold text-xs text-gray-900 truncate">${iv.candidateName}</div>
            <div class="text-2xs text-muted truncate">${iv.positionTitle}</div>
            <div class="mt-1 flex items-center justify-between text-2xs">
              <span class="text-gray-500 font-medium">${iv.round}</span>
              ${Helpers.statusBadge(iv.status)}
            </div>
          </div>
        `).join('');

        return `
          <div class="week-day-col flex-1 min-w-[130px] border-r last:border-r-0 flex flex-col">
            <div class="week-day-header p-2.5 text-center border-b ${isToday ? 'bg-blue-50/70 border-b-2 border-b-primary font-bold' : 'bg-gray-50'}">
              <div class="text-xs ${isToday ? 'text-primary font-bold' : 'text-gray-600 font-medium'}">${dayNames[idx]}</div>
              <div class="text-sm font-extrabold ${isToday ? 'text-primary' : 'text-gray-900'}">${dayFormatted}</div>
              ${isToday ? '<span class="inline-block px-1.5 py-0.2 rounded-full text-3xs bg-primary text-white mt-0.5">Hôm nay</span>' : ''}
            </div>
            <div class="week-day-body p-2 flex-1 min-h-[320px] bg-gray-50/30 overflow-y-auto">
              ${dayInterviews.length > 0 ? ivCards : '<div class="text-center text-gray-400 text-2xs py-8">Không có lịch</div>'}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="calendar-container p-4">
          <!-- Calendar Header -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-2">
              <button class="btn btn-sm btn-ghost" id="btn-prev-week" title="Tuần trước">
                <i data-lucide="chevron-left" class="icon-sm"></i>
              </button>
              <h3 class="font-bold text-sm md:text-base text-gray-800 flex items-center gap-2">
                <i data-lucide="calendar-range" class="icon-xs text-primary"></i> ${weekLabel}
              </h3>
              <button class="btn btn-sm btn-ghost" id="btn-next-week" title="Tuần tới">
                <i data-lucide="chevron-right" class="icon-sm"></i>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-xs btn-outline" id="btn-current-today">
                <i data-lucide="calendar" class="icon-2xs"></i> Tuần này
              </button>
            </div>
          </div>

          <!-- Week Calendar Grid -->
          <div class="table-responsive border rounded-lg bg-white overflow-hidden shadow-xs">
            <div class="flex min-w-[700px]">
              ${columnsHtml}
            </div>
          </div>
        </div>
      `;
    },

    init() {
      // Toggle Views
      document.getElementById('btn-view-list')?.addEventListener('click', () => {
        _activeView = 'list';
        this.refresh();
      });

      document.getElementById('btn-view-week')?.addEventListener('click', () => {
        _activeView = 'week';
        this.refresh();
      });

      // Search input
      const searchInput = document.getElementById('iv-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', Helpers.debounce((e) => {
          _searchQuery = e.target.value.trim();
          this.refresh();
        }, 300));
      }

      // Status & Interviewer Filters
      document.getElementById('iv-status-filter')?.addEventListener('change', (e) => {
        _activeStatus = e.target.value;
        this.refresh();
      });

      document.getElementById('iv-interviewer-filter')?.addEventListener('change', (e) => {
        _activeInterviewer = e.target.value;
        this.refresh();
      });

      // Week pagination buttons
      document.getElementById('btn-prev-week')?.addEventListener('click', () => {
        _currentWeekDate.setDate(_currentWeekDate.getDate() - 7);
        this.refresh();
      });

      document.getElementById('btn-next-week')?.addEventListener('click', () => {
        _currentWeekDate.setDate(_currentWeekDate.getDate() + 7);
        this.refresh();
      });

      document.getElementById('btn-current-today')?.addEventListener('click', () => {
        _currentWeekDate = new Date();
        this.refresh();
      });

      // Schedule Button (Single button in header)
      document.getElementById('btn-create-interview')?.addEventListener('click', () => {
        this.showScheduleModal();
      });

      // Table Action Buttons
      document.querySelectorAll('.btn-view-iv').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showDetailModal(id);
        });
      });

      document.querySelectorAll('.btn-email-preview').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showEmailPreviewModal(id);
        });
      });

      document.querySelectorAll('.btn-finish-iv').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const iv = ATSStore.getInterviewById(id);
          if (iv) {
            ATSStore.updateInterview(id, { status: 'completed' });
            UI.toast({ message: 'Đã hoàn thành phỏng vấn. Đang chuyển sang phiếu đánh giá...', type: 'success' });
            Router.navigate('/evaluations', { interviewId: iv.id, candidateId: iv.candidateId });
          }
        });
      });

      document.querySelectorAll('.btn-cancel-iv').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.handleCancelInterview(id);
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

    showScheduleModal() {
      const applications = ATSStore.getApplications().filter(a => a.status === 'passed_screening' || a.status === 'reviewing' || a.status === 'interview_scheduled');
      const users = ATSStore.getUsers().filter(u => u.role !== 'candidate');

      const modalHtml = `
        <div class="modal active" id="modal-schedule-iv">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">Xếp lịch phỏng vấn ứng viên</h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-schedule-iv')">&times;</button>
              </div>
              <form id="form-schedule-iv">
                <div class="modal-body">
                  <div class="form-group mb-3">
                    <label class="form-label required">Chọn ứng viên & Vị trí ứng tuyển</label>
                    <select name="appId" id="select-schedule-app" class="form-select" required>
                      ${applications.map(a => `<option value="${a.id}">${a.candidateName} - ${a.positionTitle} (${Helpers.getStatusLabel(a.status)})</option>`).join('')}
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Vòng phỏng vấn</label>
                      <select name="round" class="form-select" required>
                        <option value="Vòng 1 - HR Sơ loại">Vòng 1 - HR Sơ loại</option>
                        <option value="Vòng 2 - Đánh giá Chuyên môn" selected>Vòng 2 - Đánh giá Chuyên môn</option>
                        <option value="Vòng 3 - Phỏng vấn Giám đốc">Vòng 3 - Phỏng vấn Giám đốc</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Ngày phỏng vấn</label>
                      <input type="date" name="date" id="iv-date-input" class="form-input" required value="2026-11-05">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Giờ bắt đầu</label>
                      <input type="time" name="startTime" id="iv-start-input" class="form-input" required value="09:30">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Giờ kết thúc</label>
                      <input type="time" name="endTime" id="iv-end-input" class="form-input" required value="11:00">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Hình thức phỏng vấn</label>
                      <select name="type" id="iv-type-select" class="form-select" required onchange="document.getElementById('iv-loc-input').value = this.value === 'online' ? 'https://meet.google.com/ats-demo-meet' : 'Phòng họp A2 - Trụ sở chính SmartATS'">
                        <option value="online">Trực tuyến (Google Meet / Zoom)</option>
                        <option value="onsite">Trực tiếp tại văn phòng</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Địa điểm / Đường dẫn họp</label>
                      <input type="text" name="location" id="iv-loc-input" class="form-input" required value="https://meet.google.com/ats-demo-meet">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Người phỏng vấn (Hội đồng)</label>
                    <div class="grid grid-cols-2 gap-2 p-2 border rounded bg-gray-50" id="interviewers-checkbox-group">
                      ${users.map(u => `
                        <label class="checkbox-label text-xs">
                          <input type="checkbox" name="interviewers" value="${u.fullName}" class="form-checkbox" ${u.username === 'head_it' || u.username === 'hr1' ? 'checked' : ''}>
                          <span>${u.fullName} (${Helpers.getRoleLabel(u.role)})</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Conflict Detection Warning Box -->
                  <div id="conflict-warning-box" class="alert alert-warning mb-3" style="display: none;">
                    <i data-lucide="alert-triangle" class="icon-sm"></i>
                    <div class="text-xs" id="conflict-warning-text"></div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label">Ghi chú & Trọng tâm đánh giá</label>
                    <textarea name="notes" class="form-textarea" rows="2" placeholder="Ghi chú cho hội đồng phỏng vấn..."></textarea>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-schedule-iv')">Hủy</button>
                  <button type="submit" class="btn btn-primary" id="btn-submit-schedule">
                    <i data-lucide="save" class="icon-sm"></i> Lưu lịch phỏng vấn
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('interview-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-schedule-iv');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Conflict detection checker function
        const checkConflict = () => {
          const date = document.getElementById('iv-date-input')?.value;
          const startTime = document.getElementById('iv-start-input')?.value;
          const endTime = document.getElementById('iv-end-input')?.value;
          const checked = Array.from(document.querySelectorAll('#interviewers-checkbox-group input:checked')).map(cb => cb.value);

          if (date && startTime && endTime && checked.length > 0) {
            const conflicts = ATSStore.checkInterviewConflict(date, startTime, endTime, checked);
            const warnBox = document.getElementById('conflict-warning-box');
            const warnText = document.getElementById('conflict-warning-text');
            if (conflicts.length > 0) {
              warnBox.style.display = 'flex';
              warnText.innerHTML = `<strong>Cảnh báo trùng lịch!</strong> Người phỏng vấn (${conflicts[0].conflictingInterviewers.join(', ')}) đã có lịch phỏng vấn khác vào khung giờ ${conflicts[0].interview.startTime} - ${conflicts[0].interview.endTime} ngày ${date} (Lịch: ${conflicts[0].interview.candidateName}).`;
            } else {
              warnBox.style.display = 'none';
            }
          }
        };

        ['iv-date-input', 'iv-start-input', 'iv-end-input'].forEach(id => {
          document.getElementById(id)?.addEventListener('change', checkConflict);
        });
        document.querySelectorAll('#interviewers-checkbox-group input').forEach(cb => {
          cb.addEventListener('change', checkConflict);
        });

        // Submit form
        document.getElementById('form-schedule-iv')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const appId = fd.get('appId');
          const app = ATSStore.getApplicationById(appId);
          if (!app) return;

          const selectedInterviewers = Array.from(document.querySelectorAll('#interviewers-checkbox-group input:checked')).map(cb => cb.value);
          if (selectedInterviewers.length === 0) {
            UI.toast({ message: 'Vui lòng chọn ít nhất một người phỏng vấn.', type: 'warning' });
            return;
          }

          const newIv = ATSStore.createInterview({
            candidateId: app.candidateId,
            candidateName: app.candidateName,
            requisitionId: app.requisitionId,
            positionTitle: app.positionTitle,
            round: fd.get('round'),
            date: fd.get('date'),
            startTime: fd.get('startTime'),
            endTime: fd.get('endTime'),
            type: fd.get('type'),
            location: fd.get('location'),
            interviewers: selectedInterviewers,
            notes: fd.get('notes')
          });

          UI.toast({ message: `Đã xếp lịch phỏng vấn ${newIv.code} thành công!`, type: 'success' });
          UI.closeModal('modal-schedule-iv');
          this.refresh();
        });
      }
    },

    showDetailModal(id) {
      const iv = ATSStore.getInterviewById(id);
      if (!iv) return;

      const modalHtml = `
        <div class="modal active" id="modal-iv-detail">
          <div class="modal-dialog modal-md">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <span class="font-mono text-xs text-muted">${iv.code}</span>
                  <h3 class="modal-title">${iv.candidateName}</h3>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-iv-detail')">&times;</button>
              </div>
              <div class="modal-body text-xs space-y-3">
                <div class="p-3 bg-gray-50 rounded border">
                  <div class="text-xs text-muted">Vị trí:</div>
                  <strong class="text-sm text-primary">${iv.positionTitle}</strong>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>Vòng: <strong>${iv.round}</strong></div>
                  <div>Trạng thái: ${Helpers.statusBadge(iv.status)}</div>
                  <div>Ngày: <strong>${Helpers.formatDate(iv.date)}</strong></div>
                  <div>Thời gian: <strong>${iv.startTime} - ${iv.endTime}</strong></div>
                  <div>Hình thức: <strong>${iv.type === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</strong></div>
                  <div>Địa điểm: <strong class="text-gray-800">${iv.location}</strong></div>
                </div>

                <div class="border-t pt-2">
                  <span class="text-muted">Hội đồng phỏng vấn:</span>
                  <div class="font-semibold text-gray-800 mt-1">${(iv.interviewers || []).join(', ')}</div>
                </div>

                <div class="border-t pt-2">
                  <span class="text-muted">Ghi chú:</span>
                  <p class="text-gray-700 bg-gray-50 p-2 rounded mt-1">${iv.notes || 'Không có ghi chú'}</p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-iv-detail')">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="UI.closeModal('modal-iv-detail'); InterviewsPage.showEmailPreviewModal('${iv.id}')">
                  <i data-lucide="mail" class="icon-xs"></i> Xem email mời
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('interview-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-iv-detail');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showEmailPreviewModal(id) {
      const iv = ATSStore.getInterviewById(id);
      if (!iv) return;

      const cand = ATSStore.getCandidateById(iv.candidateId) || {};
      const modalHtml = `
        <div class="modal active" id="modal-email-preview">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title flex items-center gap-2">
                  <i data-lucide="mail" class="icon-md text-primary"></i>
                  Mô phỏng Thư mời Phỏng vấn (Email Notification)
                </h3>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-email-preview')">&times;</button>
              </div>
              <div class="modal-body">
                <div class="bg-gray-50 border p-3 rounded mb-3 text-xs space-y-1">
                  <div><strong>Người gửi:</strong> SmartATS Recruitment Team &lt;hr@smartats.vn&gt;</div>
                  <div><strong>Người nhận:</strong> ${iv.candidateName} &lt;${cand.email || 'ungvien@gmail.com'}&gt;</div>
                  <div><strong>Tiêu đề:</strong> [SmartATS] Thư mời tham dự phỏng vấn vị trí ${iv.positionTitle} (${iv.round})</div>
                </div>

                <div class="p-4 bg-white border rounded text-xs leading-relaxed text-gray-800 space-y-3 font-sans">
                  <p>Kính gửi bạn <strong>${iv.candidateName}</strong>,</p>
                  <p>Lời đầu tiên, Ban Tuyển dụng SmartATS xin cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí <strong>${iv.positionTitle}</strong> của công ty chúng tôi.</p>
                  <p>Sau khi rà soát hồ sơ, chúng tôi rất ấn tượng với năng lực và kinh nghiệm của bạn. Đại diện công ty trân trọng kính mời bạn tham dự buổi phỏng vấn <strong>${iv.round}</strong> với các thông tin chi tiết như sau:</p>

                  <div class="bg-blue-50 border border-blue-200 p-3 rounded space-y-1">
                    <div>• <strong>Thời gian:</strong> ${iv.startTime} - ${iv.endTime}, ngày ${Helpers.formatDate(iv.date)}</div>
                    <div>• <strong>Hình thức:</strong> ${iv.type === 'online' ? 'Phỏng vấn Trực tuyến qua Google Meet' : 'Phỏng vấn Trực tiếp'}</div>
                    <div>• <strong>Địa điểm / Liên kết:</strong> <a href="${iv.location}" target="_blank" class="text-primary font-bold">${iv.location}</a></div>
                    <div>• <strong>Hội đồng phỏng vấn:</strong> ${(iv.interviewers || []).join(', ')}</div>
                  </div>

                  <p>Để buổi phỏng vấn diễn ra thuận lợi, bạn vui lòng chuẩn bị máy tính có kết nối mạng ổn định, camera và micro hoạt động tốt (nếu phỏng vấn online). Bạn vui lòng phản hồi email này để xác nhận việc tham dự.</p>
                  <p>Chúc bạn có một buổi phỏng vấn thành công tốt đẹp!</p>
                  <p class="mt-4">Trân trọng,<br><strong>Phòng Nhân sự SmartATS Solutions</strong></p>
                </div>

                <div class="alert alert-info mt-3 text-xs">
                  <i data-lucide="info" class="icon-xs"></i>
                  <span>Lưu ý: Tính năng gửi email thực tế yêu cầu cấu hình SMTP server tại phần Cài đặt. Hệ thống đang hiển thị bản xem trước mẫu thư đã tự động điền dữ liệu.</span>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-email-preview')">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="UI.toast({ message: 'Đã gửi thông báo thư mời phỏng vấn mô phỏng thành công!', type: 'success' }); UI.closeModal('modal-email-preview');">
                  <i data-lucide="send" class="icon-xs"></i> Gửi thông báo mô phỏng
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('interview-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-email-preview');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    handleCancelInterview(id) {
      UI.confirm({
        title: 'Hủy lịch phỏng vấn',
        message: 'Bạn có chắc chắn muốn hủy cuộc phỏng vấn này không?',
        type: 'danger',
        confirmText: 'Xác nhận hủy lịch',
        onConfirm: () => {
          ATSStore.cancelInterview(id, 'Hủy lịch theo yêu cầu nhân sự');
          UI.toast({ message: 'Đã hủy lịch phỏng vấn.', type: 'warning' });
          this.refresh();
        }
      });
    }
  };
})();
