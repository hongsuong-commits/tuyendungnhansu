/**
 * reports.js - Module Báo cáo & Thống kê tuyển dụng chuyên sâu
 * Cấu trúc báo cáo:
 * 1. Các chỉ số tổng quan (KPI)
 * 2. Bảng chi tiết tỷ lệ chuyển đổi (Conversion Rate)
 * 3. Thời gian & Chi phí tuyển dụng
 * 4. Hiệu quả nguồn tuyển dụng (Sourcing Efficiency)
 * 5. Thời gian đăng tin & Cảnh báo tin tồn đọng
 */

const ReportsPage = (() => {
  let _timeFilter = 'all';
  let _deptFilter = 'all';

  const TIME_LABELS = {
    all: 'Toàn bộ thời gian',
    this_month: 'Tháng này',
    this_quarter: 'Quý này',
    this_year: 'Năm nay'
  };

  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const departments = ATSStore.getDepartments();
      const reportData = ATSStore.getRecruitmentReport({ timeRange: _timeFilter, department: _deptFilter });
      const ov = reportData.overview || {};
      const funnel = reportData.funnel || [];
      const sourcing = reportData.sourcing || [];
      const tc = reportData.timeAndCost || {};
      const postings = reportData.postings || [];

      const totalApps = ov.totalApplications || 0;
      const hiredCount = ov.hiredCount || 0;
      const overallConversionRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

      const sourcingWithData = sourcing.filter(s => s.totalApps > 0);
      const bestSource = sourcingWithData.length > 0
        ? sourcingWithData.reduce((best, s) => (s.hired > (best?.hired || 0) ? s : best), null)
        : null;

      return `
        <div class="page-container">
          <div class="page-header mb-4">
            <div>
              <h1 class="page-title">Báo cáo tuyển dụng & Tỷ lệ chuyển đổi</h1>
              <p class="page-subtitle">Theo dõi KPI, tỷ lệ chuyển đổi, thời gian – chi phí tuyển dụng và hiệu quả từng nguồn ứng viên</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-export-report-csv">
                <i data-lucide="download" class="icon-sm"></i> Xuất báo cáo CSV
              </button>
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="card mb-4">
            <div class="card-body py-3">
              <div class="filter-toolbar">
                <div class="filter-group">
                  <label class="filter-label font-bold text-gray-700">Khoảng thời gian:</label>
                  <select id="report-time-filter" class="form-select">
                    <option value="all" ${_timeFilter === 'all' ? 'selected' : ''}>Toàn bộ thời gian</option>
                    <option value="this_month" ${_timeFilter === 'this_month' ? 'selected' : ''}>Tháng này</option>
                    <option value="this_quarter" ${_timeFilter === 'this_quarter' ? 'selected' : ''}>Quý này</option>
                    <option value="this_year" ${_timeFilter === 'this_year' ? 'selected' : ''}>Năm nay</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label font-bold text-gray-700">Phòng ban:</label>
                  <select id="report-dept-filter" class="form-select">
                    <option value="all" ${_deptFilter === 'all' ? 'selected' : ''}>Tất cả phòng ban</option>
                    ${departments.map(d => `<option value="${d}" ${_deptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>

                <div class="ml-auto text-xs text-muted flex items-center gap-1.5">
                  <i data-lucide="refresh-cw" class="icon-xs"></i>
                  ${TIME_LABELS[_timeFilter] || 'Toàn bộ thời gian'} · ${_deptFilter === 'all' ? 'Tất cả phòng ban' : _deptFilter}
                </div>
              </div>
            </div>
          </div>

          <!-- 1. CÁC CHỈ SỐ TỔNG QUAN (KPI) -->
          <div class="mb-4">
            <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <i data-lucide="gauge" class="icon-xs text-primary"></i> 1. Các chỉ số tổng quan (KPI)
            </h2>
            <div class="stat-cards-grid">
              <div class="stat-card stat-card-blue">
                <div class="stat-card-icon"><i data-lucide="users"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${totalApps}</p>
                  <p class="stat-card-label">Tổng hồ sơ ứng tuyển</p>
                </div>
              </div>

              <div class="stat-card stat-card-orange">
                <div class="stat-card-icon"><i data-lucide="clock"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${ov.reviewingCount || 0}</p>
                  <p class="stat-card-label">Chờ duyệt / Xem xét</p>
                </div>
              </div>

              <div class="stat-card stat-card-purple">
                <div class="stat-card-icon"><i data-lucide="calendar"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${ov.interviewedCount || 0}</p>
                  <p class="stat-card-label">Đã tham gia phỏng vấn</p>
                </div>
              </div>

              <div class="stat-card stat-card-cyan">
                <div class="stat-card-icon"><i data-lucide="send"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${ov.proposedCount || 0}</p>
                  <p class="stat-card-label">Đề xuất / Thư mời việc</p>
                </div>
              </div>

              <div class="stat-card stat-card-emerald">
                <div class="stat-card-icon"><i data-lucide="user-check"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${hiredCount}</p>
                  <p class="stat-card-label">Ứng viên đã tuyển</p>
                </div>
              </div>

              <div class="stat-card stat-card-green">
                <div class="stat-card-icon"><i data-lucide="percent"></i></div>
                <div class="stat-card-content">
                  <p class="stat-card-value">${overallConversionRate}%</p>
                  <p class="stat-card-label">Tỷ lệ tuyển thành công</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. BẢNG CHI TIẾT TỶ LỆ CHUYỂN ĐỔI (CONVERSION RATE) -->
          <div class="space-y-4">
            <div class="card">
              <div class="card-header flex items-center justify-between">
                <div>
                  <h3 class="card-title text-sm font-bold flex items-center gap-2">
                    <i data-lucide="filter" class="icon-sm text-primary"></i> 2. Bảng chi tiết tỷ lệ chuyển đổi qua các giai đoạn (Funnel Conversion Rate)
                  </h3>
                  <p class="text-xs text-muted mt-0.5">Tỷ lệ chuyển đổi lũy tiến và tỷ lệ hao hụt ứng viên theo từng nấc thang tuyển dụng</p>
                </div>
                <span class="badge badge-primary font-mono text-xs">5 Giai đoạn</span>
              </div>
              <div class="card-body card-body-no-padding">
                <div class="table-responsive">
                  <table class="data-table" id="table-funnel-report">
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 50px;">STT</th>
                        <th>Giai đoạn tuyển dụng</th>
                        <th class="text-center">Số lượng ứng viên</th>
                        <th class="text-center">Tỷ lệ chuyển đổi vòng</th>
                        <th class="text-center">Tỷ lệ rơi rụng (Drop Rate)</th>
                        <th class="text-center">Tỷ lệ tích lũy đầu vào</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${funnel.map((f, i) => {
                        const totalInput = funnel[0]?.count || 1;
                        const cumPct = Math.round((f.count / totalInput) * 100);
                        return `
                          <tr>
                            <td class="text-center font-bold text-gray-400">${i + 1}</td>
                            <td>
                              <strong class="text-gray-900">${f.stage}</strong>
                            </td>
                            <td class="text-center font-extrabold text-sm text-primary">${f.count} ứng viên</td>
                            <td class="text-center">
                              <span class="badge badge-success font-bold text-xs">${f.rate}</span>
                            </td>
                            <td class="text-center">
                              <span class="badge ${f.dropRate === '0%' ? 'badge-secondary' : 'badge-danger'} font-bold text-xs">${f.dropRate}</span>
                            </td>
                            <td class="text-center">
                              <div class="flex items-center justify-center gap-2">
                                <div class="w-16 bg-gray-200 rounded-full h-2 overflow-hidden inline-block">
                                  <div class="bg-primary h-2 rounded-full" style="width: ${cumPct}%"></div>
                                </div>
                                <span class="text-xs font-semibold">${cumPct}%</span>
                              </div>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 3. THỜI GIAN & CHI PHÍ TUYỂN DỤNG -->
            <div class="card">
              <div class="card-header flex items-center justify-between">
                <div>
                  <h3 class="card-title text-sm font-bold flex items-center gap-2">
                    <i data-lucide="timer" class="icon-sm text-primary"></i> 3. Thời gian & Chi phí tuyển dụng (Time & Cost to Hire)
                  </h3>
                  <p class="text-xs text-muted mt-0.5">Thời gian trung bình từ khi nhận hồ sơ đến khi ứng viên nhận việc và chi phí phân bổ theo vị trí</p>
                </div>
                <span class="badge badge-secondary text-xs">Ước tính demo</span>
              </div>
              <div class="card-body">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div class="p-3 border rounded bg-gray-50">
                    <p class="text-xs text-muted">Thời gian tuyển trung bình</p>
                    <p class="text-2xl font-extrabold text-primary mt-1">
                      ${hiredCount > 0 && tc.avgTimeToHireDays > 0
                        ? `${tc.avgTimeToHireDays} <span class="text-sm font-medium">ngày</span>`
                        : '<span class="text-base font-semibold">Chưa đủ dữ liệu</span>'}
                    </p>
                    <p class="text-2xs text-muted mt-1">Tính từ hồ sơ tiếp nhận đến khi chuyển trạng thái Đã tuyển</p>
                  </div>
                  <div class="p-3 border rounded bg-gray-50">
                    <p class="text-xs text-muted">Tổng chi phí tuyển dụng</p>
                    <p class="text-2xl font-extrabold text-primary mt-1">${Helpers.formatCurrency(tc.totalRecruitmentCost || 0)}</p>
                    <p class="text-2xs text-muted mt-1">Ngân sách ước tính cho kỳ báo cáo</p>
                  </div>
                  <div class="p-3 border rounded bg-gray-50">
                    <p class="text-xs text-muted">Chi phí / ứng viên nhận việc</p>
                    <p class="text-2xl font-extrabold text-primary mt-1">${hiredCount > 0 ? Helpers.formatCurrency(tc.avgCostPerHire || 0) : 'Chưa có dữ liệu'}</p>
                    <p class="text-2xs text-muted mt-1">${hiredCount > 0 ? `Trên ${hiredCount} ứng viên đã tuyển` : 'Cần thêm ứng viên đã tuyển để tính'}</p>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Vị trí tuyển dụng</th>
                        <th class="col-compact">Phòng ban</th>
                        <th class="text-center">Thời gian xử lý TB (ngày)</th>
                        <th class="text-right">Chi phí ước tính</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(tc.positionsTime || []).length === 0 ? `
                        <tr><td colspan="4" class="text-center text-muted py-4">Chưa có vị trí phù hợp với bộ lọc.</td></tr>
                      ` : (tc.positionsTime || []).map(p => `
                        <tr>
                          <td><strong class="text-gray-900">${p.position}</strong></td>
                          <td class="col-compact text-sm text-muted">${p.department || '—'}</td>
                          <td class="text-center font-semibold">${p.avgDays > 0 ? p.avgDays : '—'}</td>
                          <td class="text-right font-mono text-sm">${Helpers.formatCurrency(p.cost || 0)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <p class="text-2xs text-muted mt-3">
                  <i data-lucide="info" class="icon-xs"></i>
                  Chi phí là số liệu mô phỏng phục vụ trình diễn; khi kết nối ngân sách thực tế, hệ thống sẽ lấy từ phân bổ chi phí tuyển dụng của từng yêu cầu.
                </p>
              </div>
            </div>

            <!-- 4. HIỆU QUẢ NGUỒN TUYỂN DỤNG -->
            <div class="card">
              <div class="card-header flex items-center justify-between">
                <div>
                  <h3 class="card-title text-sm font-bold flex items-center gap-2">
                    <i data-lucide="share-2" class="icon-sm text-primary"></i> 4. Hiệu quả nguồn tuyển dụng (Sourcing Efficiency)
                  </h3>
                  <p class="text-xs text-muted mt-0.5">So sánh số lượng, tỷ lệ đạt sàng lọc, phỏng vấn và tuyển thành công theo từng nguồn</p>
                </div>
                ${bestSource ? `<span class="badge badge-success text-xs">Nguồn hiệu quả nhất: ${bestSource.sourceName}</span>` : ''}
              </div>
              <div class="card-body card-body-no-padding">
                <div class="table-responsive">
                  <table class="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Nguồn tuyển dụng</th>
                        <th class="text-center">Hồ sơ</th>
                        <th class="col-optional text-center">Đạt sàng lọc</th>
                        <th class="col-compact text-center">Phỏng vấn</th>
                        <th class="text-center">Nhận việc</th>
                        <th class="text-center">Tỷ lệ chuyển đổi</th>
                        <th class="text-right">Chi phí</th>
                        <th class="col-optional text-right">Chi phí / tuyển</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sourcing.map(s => `
                        <tr>
                          <td>
                            <strong class="text-gray-900">${s.sourceName}</strong>
                            ${s.totalApps === 0 ? '<div class="text-2xs text-muted">Chưa có hồ sơ trong kỳ</div>' : ''}
                          </td>
                          <td class="text-center font-semibold">${s.totalApps}</td>
                          <td class="col-optional text-center">
                            <span class="badge badge-info text-xs">${s.passRate || '0%'}</span>
                          </td>
                          <td class="col-compact text-center">${s.interviewed}</td>
                          <td class="text-center font-bold text-success">${s.hired}</td>
                          <td class="text-center">
                            <span class="badge ${s.hired > 0 ? 'badge-success' : 'badge-secondary'} text-xs">${s.conversionRate || '0%'}</span>
                          </td>
                          <td class="text-right font-mono text-sm">${s.cost}</td>
                          <td class="col-optional text-right font-mono text-sm">${s.costPerHire ? Helpers.formatCurrency(s.costPerHire) : '—'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 5. THỜI GIAN ĐĂNG TIN & CẢNH BÁO TIN TỒN ĐỌNG -->
            <div class="card">
              <div class="card-header flex items-center justify-between">
                <div>
                  <h3 class="card-title text-sm font-bold flex items-center gap-2">
                    <i data-lucide="calendar-clock" class="icon-sm text-primary"></i> 5. Thời gian đăng tin & Cảnh báo tin tồn đọng
                  </h3>
                  <p class="text-xs text-muted mt-0.5">Tin đăng trên 25 ngày được cảnh báo sắp hết hạn, trên 30 ngày được đánh dấu tồn đọng cần xử lý</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-warning text-xs">Sắp hết hạn: 25–30 ngày</span>
                  <span class="badge badge-danger text-xs">Tồn đọng: &gt; 30 ngày</span>
                </div>
              </div>
              <div class="card-body card-body-no-padding">
                <div class="table-responsive">
                  <table class="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th class="text-center">Tin tuyển dụng</th>
                        <th class="col-compact">Phòng ban</th>
                        <th class="col-compact text-center">Ngày đăng</th>
                        <th class="text-center">Số ngày đăng</th>
                        <th class="text-center">Hồ sơ</th>
                        <th class="text-center">Trạng thái</th>
                        <th class="text-center">Cảnh báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${postings.length === 0 ? `
                        <tr><td colspan="7" class="text-center text-muted py-4">Chưa có tin tuyển dụng phù hợp với bộ lọc.</td></tr>
                      ` : postings.map(p => `
                        <tr>
                          <td class="cell-wrap report-title-cell text-center">
                            <strong class="text-gray-900">${p.title}</strong>
                            <div class="text-2xs text-muted font-mono">${p.code || ''}</div>
                          </td>
                          <td class="col-compact text-sm text-muted">${p.department || '—'}</td>
                          <td class="col-compact text-center text-sm">${Helpers.formatDate(p.publishedAt)}</td>
                          <td class="text-center font-semibold">${p.daysActive}</td>
                          <td class="text-center">${p.applicantsCount}</td>
                          <td class="text-center">
                            <span class="badge ${p.status === 'published' ? 'badge-success' : 'badge-secondary'} text-xs">
                              ${p.status === 'published' ? 'Đang đăng' : (p.status === 'draft' ? 'Nháp' : 'Đã đóng')}
                            </span>
                          </td>
                          <td class="text-center">
                            ${p.isProlonged
                              ? '<span class="badge badge-danger text-xs">Tồn đọng &gt; 30 ngày</span>'
                              : (p.isExpiringSoon
                                ? '<span class="badge badge-warning text-xs">Sắp hết hạn</span>'
                                : '<span class="badge badge-secondary text-xs">Bình thường</span>')}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    initEventListeners() {
      // Filter changes
      document.getElementById('report-time-filter')?.addEventListener('change', (e) => {
        _timeFilter = e.target.value;
        this.refresh();
      });

      document.getElementById('report-dept-filter')?.addEventListener('change', (e) => {
        _deptFilter = e.target.value;
        this.refresh();
      });

      // Export CSV — toàn bộ các nhóm số liệu trong một tệp
      document.getElementById('btn-export-report-csv')?.addEventListener('click', () => {
        const reportData = ATSStore.getRecruitmentReport({ timeRange: _timeFilter, department: _deptFilter });
        const ov = reportData.overview || {};
        const tc = reportData.timeAndCost || {};
        const funnel = reportData.funnel || [];
        const sourcing = reportData.sourcing || [];
        const postings = reportData.postings || [];

        const rows = [
          { group: 'Tổng quan', item: 'Tổng hồ sơ ứng tuyển', value: ov.totalApplications || 0 },
          { group: 'Tổng quan', item: 'Chờ duyệt / Xem xét', value: ov.reviewingCount || 0 },
          { group: 'Tổng quan', item: 'Đã tham gia phỏng vấn', value: ov.interviewedCount || 0 },
          { group: 'Tổng quan', item: 'Đề xuất / Thư mời việc', value: ov.proposedCount || 0 },
          { group: 'Tổng quan', item: 'Ứng viên đã tuyển', value: ov.hiredCount || 0 },
          { group: 'Tổng quan', item: 'Vị trí đang tuyển', value: ov.activePositions || 0 },
          { group: 'Tổng quan', item: 'Vị trí đã đóng', value: ov.closedPositions || 0 }
        ];

        funnel.forEach(f => {
          rows.push({
            group: 'Tỷ lệ chuyển đổi',
            item: f.stage,
            value: `${f.count} ứng viên (chuyển đổi ${f.rate}, rơi rụng ${f.dropRate})`
          });
        });

        rows.push(
          { group: 'Thời gian & Chi phí', item: 'Thời gian tuyển trung bình', value: (ov.hiredCount || 0) > 0 && tc.avgTimeToHireDays > 0 ? `${tc.avgTimeToHireDays} ngày` : 'Chưa đủ dữ liệu' },
          { group: 'Thời gian & Chi phí', item: 'Tổng chi phí tuyển dụng', value: Helpers.formatCurrency(tc.totalRecruitmentCost || 0) },
          { group: 'Thời gian & Chi phí', item: 'Chi phí / ứng viên nhận việc', value: (ov.hiredCount || 0) > 0 ? Helpers.formatCurrency(tc.avgCostPerHire || 0) : 'Chưa có dữ liệu' }
        );

        (tc.positionsTime || []).forEach(p => {
          rows.push({
            group: 'Thời gian & Chi phí',
            item: p.position,
            value: `${p.department || '—'} · ${p.avgDays || 0} ngày · ${Helpers.formatCurrency(p.cost || 0)}`
          });
        });

        sourcing.forEach(s => {
          rows.push({
            group: 'Hiệu quả nguồn',
            item: s.sourceName,
            value: `${s.totalApps} hồ sơ · ${s.passed} đạt sàng lọc · ${s.interviewed} phỏng vấn · ${s.hired} nhận việc · ${s.conversionRate} chuyển đổi · ${s.cost}`
          });
        });

        postings.forEach(p => {
          rows.push({
            group: 'Tin tuyển dụng',
            item: p.title,
            value: `${p.department || '—'} · ${p.daysActive} ngày · ${p.applicantsCount} hồ sơ · ${p.isProlonged ? 'Tồn đọng' : (p.isExpiringSoon ? 'Sắp hết hạn' : 'Bình thường')}`
          });
        });

        const columns = [
          { key: 'group', label: 'Nhóm báo cáo' },
          { key: 'item', label: 'Hạng mục' },
          { key: 'value', label: 'Giá trị' }
        ];
        Helpers.exportToCSV(rows, columns, `Bao_cao_tuyen_dung_${_timeFilter}_${_deptFilter}.csv`);
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast({ message: 'Đã xuất báo cáo CSV thành công!', type: 'success' });
        }
      });
    },

    init() {
      this.initEventListeners();
      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      });
    },

    refresh() {
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = this.render();
        this.init();
      }
    }
  };
})();
