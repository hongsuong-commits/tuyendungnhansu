/**
 * interviews.js - Module Lịch phỏng vấn theo phong cách Tanca ATS
 * Hỗ trợ chế độ xem Lịch Tuần (Week view), Danh sách (List view), phát hiện trùng lịch,
 * gửi thư mời mô phỏng và cập nhật trạng thái phỏng vấn.
 */

const InterviewsPage = (() => {
  let _activeView = 'list'; // 'week' | 'list'
  let _keepView = false;
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

      // Mở màn hình từ menu → luôn vào dạng Danh sách trước.
      if (!_keepView) _activeView = 'list';
      _keepView = false;

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

      const rows = interviews.map((iv) => {
        const canEdit = user.role === 'hr' || user.role === 'department_head';

        return `
          <tr>
            <td>
              <a href="javascript:void(0)" class="table-name btn-view-iv" data-id="${iv.id}">${iv.candidateName}</a>
              <span class="table-sub">${Helpers.truncate(iv.positionTitle, 32)}</span>
            </td>
            <td>
              <span class="table-name">${Helpers.formatDate(iv.date)}</span>
              <span class="table-sub" title="${iv.round}">${iv.startTime}–${iv.endTime} · ${(iv.round || '').split(' - ')[0]}</span>
            </td>
            <td class="col-optional">
              <span class="table-name">${iv.type === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</span>
              <span class="table-sub" title="${iv.location}">${Helpers.truncate(iv.location, 26)}</span>
            </td>
            <td>${Helpers.statusBadge(iv.status)}</td>
            <td class="text-right">
              <div class="table-actions">
                ${canEdit && iv.status !== 'completed' && iv.status !== 'cancelled' ? `
                  <button class="btn btn-xs btn-icon btn-outline btn-reschedule-iv" data-id="${iv.id}" title="Đổi lịch phỏng vấn" aria-label="Đổi lịch">
                    <i data-lucide="calendar-clock" class="icon-xs"></i>
                  </button>
                ` : ''}
                <button class="btn btn-xs btn-icon btn-outline btn-view-iv" data-id="${iv.id}" title="Chi tiết lịch" aria-label="Chi tiết lịch">
                  <i data-lucide="eye" class="icon-xs"></i>
                </button>
                ${canEdit && iv.status !== 'completed' && iv.status !== 'cancelled' ? `
                  <button class="btn btn-xs btn-outline btn-finish-iv" data-id="${iv.id}" title="Đánh dấu hoàn thành & Chấm điểm">
                    <i data-lucide="check" class="icon-xs"></i> Đánh giá
                  </button>
                  <button class="btn btn-xs btn-icon btn-outline btn-cancel-iv" data-id="${iv.id}" title="Hủy lịch" aria-label="Hủy lịch">
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
                <th>Lịch phỏng vấn</th>
                <th class="col-optional">Hình thức · địa điểm</th>
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
      // ── Calendar configuration (single source of truth) ──────────────
      const HOUR_H = 56;                 // must match .week-grid --hour-h in design.css
      const PIXELS_PER_MINUTE = HOUR_H / 60;
      const DAY_START_MIN = 7 * 60;      // 07:00
      const DAY_END_MIN = 18 * 60;       // grid closes after 17:00 row
      const HOURS = 11;                  // 07:00 → 18:00
      const MIN_EVENT_MIN = 20;          // tối thiểu 20 phút để đảm bảo đủ không gian hiển thị nội dung

      const toMin = (t) => {
        const [h, m] = String(t || '0:0').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      // Tính vị trí & chiều cao sự kiện chỉ dựa trên thời gian (không phụ thuộc nội dung)
      const calcEventPos = (startTime, endTime) => {
        const start = toMin(startTime);
        const end = Math.max(toMin(endTime), start + MIN_EVENT_MIN);
        const clampedStart = Math.max(start, DAY_START_MIN);
        const clampedEnd = Math.min(end, DAY_END_MIN);
        if (clampedEnd <= clampedStart) return null;
        return {
          top: (clampedStart - DAY_START_MIN) * PIXELS_PER_MINUTE,
          height: (clampedEnd - clampedStart) * PIXELS_PER_MINUTE,
        };
      };

      // Xác định lớp hiển thị nội dung theo chiều cao sự kiện
      const sizeClassForDuration = (durationMin) => {
        if (durationMin >= 60) return 'size-large';
        if (durationMin >= 30) return 'size-medium';
        return 'size-small';
      };

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

      const hourLabels = Array.from({ length: HOURS }, (_, i) => {
        const hour = 7 + i;
        return `<div class="week-hour-label">${String(hour).padStart(2, '0')}:00</div>`;
      }).join('');

      const dayHeads = weekDays.map((dateObj, idx) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const dayFormatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return `
          <div class="week-day-head ${isToday ? 'is-today' : ''}">
            <span class="dow">${dayNames[idx]}</span>
            <span class="dom">${dayFormatted}</span>
            ${isToday ? '<span class="today-flag">Hôm nay</span>' : ''}
          </div>
        `;
      }).join('');

      const dayCols = weekDays.map((dateObj, idx) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const dayInterviews = interviews
          .filter(iv => iv.date === dateStr && iv.status !== 'cancelled')
          .sort((a, b) => toMin(a.startTime) - toMin(b.startTime));

        // simple lane packing so overlapping interviews sit side by side
        const laneEnds = [];
        const placed = dayInterviews.map(iv => {
          const start = toMin(iv.startTime);
          const end = Math.max(toMin(iv.endTime), start + 30);
          let lane = laneEnds.findIndex(laneEnd => laneEnd <= start);
          if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
          laneEnds[lane] = end;
          return { iv, start, end, lane };
        });
        const laneCount = Math.max(laneEnds.length, 1);

        const cards = placed.map(({ iv, start, end, lane }) => {
          const pos = calcEventPos(iv.startTime, iv.endTime);
          if (!pos) return '';
          const durationMin = end - start;
          const sizeClass = sizeClassForDuration(durationMin);
          const left = `calc(${(lane / laneCount) * 100}% + 4px)`;
          const width = `calc(${100 / laneCount}% - 8px)`;
          return `
            <div class="week-iv-card ${iv.type === 'online' ? 'is-online' : ''} ${sizeClass}"
                 style="top:${pos.top}px;height:${pos.height}px;left:${left};width:${width};"
                 onclick="InterviewsPage.showDetailModal('${iv.id}')"
                 title="${iv.startTime}–${iv.endTime} · ${iv.candidateName} · ${iv.round}">
              <div class="week-iv-content">
                <span class="week-iv-name">${iv.candidateName}</span>
                <span class="week-iv-pos">${iv.positionTitle || ''}</span>
              </div>
            </div>
          `;
        }).join('');

        const slots = Array.from({ length: HOURS }, () => '<div class="week-slot"></div>').join('');

        return `
          <div class="week-col ${isToday ? 'is-today' : ''}" style="height:${HOURS * HOUR_H}px">
            ${slots}
            ${cards}
          </div>
        `;
      }).join('');

      return `
        <div class="calendar-container week-calendar">
          <div class="week-toolbar">
            <div class="week-toolbar-group">
              <button class="btn btn-sm btn-ghost btn-icon" id="btn-prev-week" title="Tuần trước">
                <i data-lucide="chevron-left" class="icon-sm"></i>
              </button>
              <div>
                <h3 class="week-toolbar-title">${weekLabel}</h3>
                <span class="week-toolbar-range">Khung giờ ${String(DAY_START_MIN / 60).padStart(2, '0')}:00 – 17:00</span>
              </div>
              <button class="btn btn-sm btn-ghost btn-icon" id="btn-next-week" title="Tuần tới">
                <i data-lucide="chevron-right" class="icon-sm"></i>
              </button>
            </div>
            <button class="btn btn-xs btn-outline" id="btn-current-today">
              <i data-lucide="calendar" class="icon-2xs"></i> Tuần này
            </button>
          </div>

          <div class="week-scroll">
            <div class="week-grid">
              <div class="week-corner"></div>
              ${dayHeads}
              <div class="week-time-col">${hourLabels}</div>
              ${dayCols}
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

      document.querySelectorAll('.btn-reschedule-iv').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showRescheduleModal(id);
        });
      });
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        // Giữ nguyên chế độ xem khi người dùng tự chuyển Danh sách ↔ Lịch tuần;
        // chỉ lần mở màn hình từ menu mới quay về mặc định Danh sách.
        _keepView = true;
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

        // ── Conflict detection: candidate first, then the panel ──
        const readSchedule = () => {
          const date = document.getElementById('iv-date-input')?.value;
          const startTime = document.getElementById('iv-start-input')?.value;
          const endTime = document.getElementById('iv-end-input')?.value;
          const appId = document.getElementById('select-schedule-app')?.value;
          const app = appId ? ATSStore.getApplicationById(appId) : null;
          const checked = Array.from(document.querySelectorAll('#interviewers-checkbox-group input:checked')).map(cb => cb.value);
          return { date, startTime, endTime, app, checked };
        };

        const evaluateSchedule = () => {
          const { date, startTime, endTime, app, checked } = readSchedule();
          if (!date || !startTime || !endTime || !app) return { ready: false };
          if (endTime <= startTime) {
            return { ready: true, invalid: true, candidateConflict: null, interviewerConflicts: [] };
          }
          const conflicts = ATSStore.checkInterviewConflict(date, startTime, endTime, checked, null, app.candidateId);
          return {
            ready: true,
            invalid: false,
            candidateConflict: conflicts.find(c => c.candidateConflict) || null,
            interviewerConflicts: conflicts.filter(c => c.interviewerConflict && !c.candidateConflict)
          };
        };

        const renderConflictWarning = () => {
          const result = evaluateSchedule();
          const warnBox = document.getElementById('conflict-warning-box');
          const warnText = document.getElementById('conflict-warning-text');
          const submitBtn = document.getElementById('btn-submit-schedule');
          if (!warnBox || !warnText) return result;

          if (!result.ready) {
            warnBox.style.display = 'none';
            if (submitBtn) submitBtn.disabled = false;
            return result;
          }

          if (result.invalid) {
            warnBox.className = 'alert alert-danger mb-3';
            warnBox.style.display = 'flex';
            warnText.innerHTML = '<strong>Giờ kết thúc phải sau giờ bắt đầu.</strong> Vui lòng kiểm tra lại khung giờ phỏng vấn.';
            if (submitBtn) submitBtn.disabled = true;
            return result;
          }

          if (result.candidateConflict) {
            const clash = result.candidateConflict.interview;
            warnBox.className = 'alert alert-danger mb-3';
            warnBox.style.display = 'flex';
            warnText.innerHTML = `<strong>Trùng lịch ứng viên — không thể lưu.</strong> ${clash.candidateName} đã có lịch phỏng vấn <strong>${clash.startTime} – ${clash.endTime}</strong> ngày <strong>${Helpers.formatDate(clash.date)}</strong> (${clash.round}). Mỗi ứng viên chỉ được có một lịch trong cùng khung giờ; vui lòng chọn giờ khác.`;
            if (submitBtn) submitBtn.disabled = true;
            return result;
          }

          if (result.interviewerConflicts.length > 0) {
            const first = result.interviewerConflicts[0];
            warnBox.className = 'alert alert-warning mb-3';
            warnBox.style.display = 'flex';
            warnText.innerHTML = `<strong>Cảnh báo trùng lịch hội đồng.</strong> ${first.conflictingInterviewers.join(', ')} đã có lịch phỏng vấn khác vào ${first.interview.startTime} – ${first.interview.endTime} ngày ${Helpers.formatDate(first.interview.date)} (${first.interview.candidateName}).`;
            if (submitBtn) submitBtn.disabled = false;
            return result;
          }

          warnBox.style.display = 'none';
          if (submitBtn) submitBtn.disabled = false;
          return result;
        };

        ['iv-date-input', 'iv-start-input', 'iv-end-input', 'select-schedule-app'].forEach(id => {
          document.getElementById(id)?.addEventListener('change', renderConflictWarning);
        });
        document.querySelectorAll('#interviewers-checkbox-group input').forEach(cb => {
          cb.addEventListener('change', renderConflictWarning);
        });

        // Submit form
        document.getElementById('form-schedule-iv')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const { date, startTime, endTime, app, checked: selectedInterviewers } = readSchedule();
          if (!app) return;

          if (selectedInterviewers.length === 0) {
            UI.toast({ message: 'Vui lòng chọn ít nhất một người phỏng vấn.', type: 'warning' });
            return;
          }

          const check = renderConflictWarning();
          if (check.candidateConflict) {
            UI.toast({ message: check.candidateConflict.interview.candidateName + ' đã có lịch trong khung giờ này. Vui lòng chọn giờ khác.', type: 'error' });
            return;
          }
          if (check.invalid) {
            UI.toast({ message: 'Giờ kết thúc phải sau giờ bắt đầu.', type: 'error' });
            return;
          }

          const result = ATSStore.createInterview({
            candidateId: app.candidateId,
            candidateName: app.candidateName,
            requisitionId: app.requisitionId,
            positionTitle: app.positionTitle,
            round: new FormData(e.target).get('round'),
            date,
            startTime,
            endTime,
            type: document.getElementById('iv-type-select')?.value,
            location: document.getElementById('iv-loc-input')?.value,
            interviewers: selectedInterviewers,
            notes: new FormData(e.target).get('notes')
          });

          if (!result || result.success === false) {
            UI.toast({ message: (result && result.message) || 'Không thể xếp lịch phỏng vấn.', type: 'error', duration: 6000 });
            return;
          }

          UI.toast({
            message: `Đã xếp lịch phỏng vấn ${result.code} cho ${app.candidateName}.`,
            type: 'success',
            duration: 5000
          });
          UI.closeModal('modal-schedule-iv');
          this.refresh();
        });
      }
    },

    showRescheduleModal(id) {
      const iv = ATSStore.getInterviewById(id);
      if (!iv) return;
      const cand = ATSStore.getCandidateById(iv.candidateId) || {};

      const modalHtml = `
        <div class="modal active" id="modal-reschedule-iv">
          <div class="modal-dialog modal-md">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h3 class="modal-title">Đổi lịch phỏng vấn</h3>
                  <p class="modal-subtitle">${iv.candidateName} · ${iv.positionTitle} · ${iv.round}</p>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-reschedule-iv')">&times;</button>
              </div>
              <form id="form-reschedule-iv">
                <div class="modal-body">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Ngày phỏng vấn</label>
                      <input type="date" id="res-date" class="form-input" required value="${iv.date}">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Địa điểm / Đường dẫn</label>
                      <input type="text" id="res-loc" class="form-input" value="${iv.location || ''}">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Giờ bắt đầu</label>
                      <input type="time" id="res-start" class="form-input" required value="${iv.startTime}">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Giờ kết thúc</label>
                      <input type="time" id="res-end" class="form-input" required value="${iv.endTime}">
                    </div>
                  </div>

                  <div id="reschedule-warning-box" class="alert alert-danger mb-3" style="display: none;">
                    <i data-lucide="alert-triangle" class="icon-sm"></i>
                    <div class="text-xs" id="reschedule-warning-text"></div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-reschedule-iv')">Hủy</button>
                  <button type="submit" class="btn btn-primary" id="btn-confirm-reschedule">
                    <i data-lucide="save" class="icon-sm"></i> Lưu lịch mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('interview-modals-container');
      if (!container) return;
      container.innerHTML = modalHtml;
      UI.openModal('modal-reschedule-iv');
      if (typeof lucide !== 'undefined') lucide.createIcons();

      const check = () => {
        const date = document.getElementById('res-date')?.value;
        const startTime = document.getElementById('res-start')?.value;
        const endTime = document.getElementById('res-end')?.value;
        const box = document.getElementById('reschedule-warning-box');
        const text = document.getElementById('reschedule-warning-text');
        const submit = document.getElementById('btn-confirm-reschedule');
        if (!date || !startTime || !endTime || !box || !text) return null;

        if (endTime <= startTime) {
          box.style.display = 'flex';
          text.innerHTML = '<strong>Giờ kết thúc phải sau giờ bắt đầu.</strong>';
          if (submit) submit.disabled = true;
          return { invalid: true };
        }

        const conflicts = ATSStore.checkInterviewConflict(date, startTime, endTime, iv.interviewers || [], iv.id, iv.candidateId);
        const candidateClash = conflicts.find(c => c.candidateConflict);
        if (candidateClash) {
          const clash = candidateClash.interview;
          box.style.display = 'flex';
          text.innerHTML = `<strong>Trùng lịch ứng viên — không thể lưu.</strong> ${iv.candidateName} đã có lịch ${clash.startTime} – ${clash.endTime} ngày ${Helpers.formatDate(clash.date)} (${clash.round}).`;
          if (submit) submit.disabled = true;
          return { candidateClash };
        }

        box.style.display = 'none';
        if (submit) submit.disabled = false;
        return { ok: true };
      };

      ['res-date', 'res-start', 'res-end'].forEach(elId => {
        document.getElementById(elId)?.addEventListener('change', check);
      });

      document.getElementById('form-reschedule-iv')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const state = check();
        if (state && (state.invalid || state.candidateClash)) {
          UI.toast({ message: 'Khung giờ mới bị trùng. Vui lòng chọn giờ khác.', type: 'error' });
          return;
        }

        const result = ATSStore.updateInterview(iv.id, {
          date: document.getElementById('res-date').value,
          startTime: document.getElementById('res-start').value,
          endTime: document.getElementById('res-end').value,
          location: document.getElementById('res-loc').value
        });

        if (!result || result.success === false) {
          UI.toast({ message: (result && result.message) || 'Không thể đổi lịch phỏng vấn.', type: 'error', duration: 6000 });
          return;
        }

        const emailed = !!(result && result.rescheduleEmailId);
        UI.toast({
          message: `Đã đổi lịch phỏng vấn cho ${iv.candidateName}.`
            + (emailed ? ' Đã gửi email thông báo lịch mới tới ứng viên.' : ''),
          type: 'success',
          duration: 5000
        });
        UI.closeModal('modal-reschedule-iv');
        this.refresh();
      });
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
                <button type="button" class="btn btn-outline" onclick="UI.closeModal('modal-iv-detail'); InterviewsPage.showRescheduleModal('${iv.id}')">
                  <i data-lucide="calendar-clock" class="icon-xs"></i> Đổi lịch
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

    handleCancelInterview(id) {
      UI.confirm({
        title: 'Hủy lịch phỏng vấn',
        message: 'Bạn có chắc chắn muốn hủy cuộc phỏng vấn này không?',
        type: 'danger',
        confirmText: 'Xác nhận hủy lịch',
        onConfirm: () => {
          const iv = ATSStore.getInterviewById(id);
          const cancelled = ATSStore.cancelInterview(id, 'Hủy lịch theo yêu cầu nhân sự');
          const emailed = !!(cancelled && cancelled.cancelEmailId);
          UI.toast({
            message: `Đã hủy lịch phỏng vấn${iv ? ` của ${iv.candidateName}` : ''}.`
              + (emailed ? ' Đã gửi email thông báo hủy tới ứng viên.' : ''),
            type: 'warning',
            duration: 5000
          });
          this.refresh();
        }
      });
    }
  };
})();
