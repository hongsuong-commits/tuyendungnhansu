/**
 * Dashboard Page - Main dashboard shown after login.
 * Reads as a work queue, not a poster: a four-figure strip, the pipeline
 * (the one place colour is allowed), then the two lists HR actually acts on.
 */
const DashboardPage = {
  _stages: [
    { key: 'pending_review', label: 'Chờ duyệt' },
    { key: 'reviewing', label: 'Xem xét' },
    { key: 'passed_screening', label: 'Đạt sàng lọc' },
    { key: 'interview_scheduled', label: 'Phỏng vấn' },
    { key: 'proposed', label: 'Đề xuất' },
    { key: 'hired', label: 'Đã tuyển' },
  ],

  render() {
    const user = ATSStore.getCurrentUser();
    if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

    const role = user.role;
    const stats = ATSStore.getDashboardStats();
    const stageMap = stats.candidatesByStage || {};
    const sourceCount = Object.keys(stats.candidatesBySource || {}).length;

    return `
      <div class="page-container dashboard-page">
        <div class="page-header">
          <div class="page-heading">
            <h1 class="page-title">Tổng quan tuyển dụng</h1>
            <p class="page-subtitle">
              Chào ${Helpers.truncate(user.fullName || user.username, 30)}. ${this._findingSentence(stats)}
            </p>
          </div>
          <div class="page-actions">
            ${role === 'hr' ? `
              <button class="btn btn-outline btn-sm" onclick="Router.navigate('/screening')">
                <i data-lucide="scan-search" class="icon-xs"></i> Sàng lọc CV
              </button>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('/interviews')">
                <i data-lucide="calendar-plus" class="icon-xs"></i> Lịch phỏng vấn
              </button>
            ` : ''}
          </div>
        </div>

        <div class="metric-strip">
          <div class="metric">
            <span class="metric-label">Vị trí đang tuyển</span>
            <span class="metric-value">${Helpers.formatNumber(stats.activeRequisitions ?? 0)}</span>
            <span class="metric-note">Đã duyệt và đang mở</span>
          </div>
          <div class="metric">
            <span class="metric-label">Hồ sơ ứng viên</span>
            <span class="metric-value">${Helpers.formatNumber(stats.totalCandidates ?? 0)}</span>
            <span class="metric-note">Từ ${sourceCount} nguồn ứng tuyển</span>
          </div>
          <div class="metric">
            <span class="metric-label">Chờ nhân sự duyệt</span>
            <span class="metric-value">${Helpers.formatNumber(stats.pendingReview ?? 0)}</span>
            <span class="metric-note ${stats.pendingReview ? 'is-alert' : ''}">${stats.pendingReview ? 'Cần xử lý hôm nay' : 'Không còn tồn đọng'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Lịch phỏng vấn</span>
            <span class="metric-value">${Helpers.formatNumber(stats.upcomingInterviews ?? 0)}</span>
            <span class="metric-note">${stats.upcomingInterviews ? 'Đã xác nhận với ứng viên' : 'Chưa có lịch nào'}</span>
          </div>
        </div>

        <div class="card section-gap">
          <div class="card-header">
            <div>
              <h2 class="card-title">Luồng hồ sơ</h2>
              <p class="card-subtitle">Số hồ sơ đang đứng ở từng giai đoạn tuyển dụng</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/candidates')">
              Danh sách ứng viên <i data-lucide="arrow-right" class="icon-xs"></i>
            </button>
          </div>
          <div class="card-body">
            ${this._renderPipeline(stageMap)}
          </div>
        </div>

        <div class="split-2 section-gap">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Lịch phỏng vấn sắp tới</h2>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/interviews')">Xem tất cả</button>
            </div>
            <div class="card-body card-body-no-padding">
              ${this._renderUpcomingInterviews(stats.upcomingInterviewsList || [])}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Hồ sơ chờ xử lý</h2>
              ${role === 'hr' ? `<button class="btn btn-ghost btn-sm" onclick="Router.navigate('/candidates')">Tất cả hồ sơ</button>` : ''}
            </div>
            <div class="card-body card-body-no-padding">
              ${this._renderPendingApplications(stats.pendingApplicationsList || [])}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /** One sentence that states what needs attention, built from real counts. */
  _findingSentence(stats) {
    const parts = [];
    if (stats.pendingReview) parts.push(`${stats.pendingReview} hồ sơ chờ duyệt`);
    if (stats.upcomingInterviews) parts.push(`${stats.upcomingInterviews} lịch phỏng vấn đã xác nhận`);
    if (stats.hired) parts.push(`${stats.hired} ứng viên đã nhận việc`);
    if (!parts.length) return 'Hiện không có việc nào đang chờ xử lý.';
    if (parts.length === 1) return `${parts[0]} cần bạn theo dõi.`;
    return `${parts.slice(0, -1).join(', ')} và ${parts[parts.length - 1]} cần bạn theo dõi.`;
  },

  _renderPipeline(stageMap) {
    const stages = this._stages;
    const total = stages.reduce((sum, s) => sum + (Number(stageMap[s.key]) || 0), 0);
    const rejected = Number(stageMap.rejected) || 0;
    const all = total + rejected || 1;
    const share = (n) => Math.round((n / all) * 100);

    const segments = stages.map((s, i) => {
      const count = Number(stageMap[s.key]) || 0;
      if (!count) return '';
      const tone = [1, 0.82, 0.66, 0.52, 0.4, 0.28][i];
      return `<span style="width:${Math.max(share(count), 3)}%;background:rgba(29,95,191,${tone})" title="${s.label}: ${count} hồ sơ"></span>`;
    }).join('');
    const rejectedSegment = rejected
      ? `<span style="width:${Math.max(share(rejected), 3)}%;background:repeating-linear-gradient(135deg,#e3e6ea 0 4px,#d3d7dd 4px 8px)" title="Dừng tuyển dụng: ${rejected} hồ sơ"></span>`
      : '';

    return `
      <div class="pipeline">
        <div class="pipeline-track">${segments}${rejectedSegment}</div>

        <div class="pipeline-stages">
          ${stages.map(s => {
            const count = Number(stageMap[s.key]) || 0;
            return `
              <a class="pipeline-stage ${count ? '' : 'is-zero'}" href="#/candidates" title="Xem hồ sơ ở giai đoạn ${s.label}">
                <span class="stage-name">${s.label}</span>
                <span class="stage-count">${count}</span>
                <span class="stage-share">${count ? share(count) + '% tổng số' : 'chưa có hồ sơ'}</span>
              </a>`;
          }).join('')}
        </div>

        <div class="pipeline-foot">
          <span><strong>${total}</strong> hồ sơ đang trong luồng${rejected ? ` · <strong>${rejected}</strong> hồ sơ dừng tuyển dụng (${share(rejected)}%)` : ''}</span>
          <button class="btn btn-ghost btn-xs" onclick="Router.navigate('/candidates')">
            Xem chi tiết luồng <i data-lucide="arrow-right" class="icon-2xs"></i>
          </button>
        </div>
      </div>
    `;
  },

  _renderUpcomingInterviews(interviews) {
    if (!interviews || interviews.length === 0) {
      return `
        <div class="table-empty">
          <p>Không có lịch phỏng vấn nào đã xác nhận.</p>
          <button class="btn btn-outline btn-xs" onclick="Router.navigate('/interviews')">Tạo lịch phỏng vấn</button>
        </div>`;
    }

    const rows = interviews.slice(0, 5).map(iv => {
      const date = Helpers.formatDate(iv.date || iv.interviewDate);
      const time = iv.startTime || iv.time || '—';
      const typeLabel = iv.type === 'online' ? 'Trực tuyến' : 'Trực tiếp';
      return `
        <tr>
          <td>
            <span class="table-name">${date}</span>
            <span class="table-sub">${time}${iv.endTime ? ' – ' + iv.endTime : ''}</span>
          </td>
          <td>
            <span class="table-name">${Helpers.truncate(iv.candidateName || '—', 22)}</span>
            <span class="table-sub">${Helpers.truncate(iv.positionTitle || '—', 26)}</span>
          </td>
          <td><span class="badge badge-secondary text-2xs">${typeLabel}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="table-responsive">
        <table class="data-table data-table-compact">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Ứng viên · vị trí</th>
              <th>Hình thức</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  _renderPendingApplications(applications) {
    if (!applications || applications.length === 0) {
      return `
        <div class="table-empty">
          <p>Không có hồ sơ nào đang chờ xử lý.</p>
        </div>`;
    }

    const rows = applications.slice(0, 5).map(app => {
      const name = app.candidateName || app.fullName || app.name || '—';
      const position = app.positionTitle || '—';
      const applied = Helpers.formatDate(app.appliedDate || app.createdAt);
      const score = app.screeningScore != null ? app.screeningScore : null;
      return `
        <tr>
          <td>
            <span class="table-name">${Helpers.truncate(name, 22)}</span>
            <span class="table-sub">${Helpers.truncate(position, 30)}</span>
          </td>
          <td><span class="table-sub">${applied}</span></td>
          <td>${score !== null ? `<span class="badge badge-secondary">${score} điểm</span>` : '<span class="text-muted">—</span>'}</td>
          <td class="text-right">
            <button class="btn btn-xs btn-outline" onclick="Router.navigate('/candidates', { search: '${name.replace(/'/g, "\\'")}' })">
              Mở hồ sơ
            </button>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="table-responsive">
        <table class="data-table data-table-compact table-sticky-actions">
          <thead>
            <tr>
              <th>Ứng viên · vị trí</th>
              <th>Ngày nộp</th>
              <th>Điểm</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  init() {
    requestAnimationFrame(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  }
};
