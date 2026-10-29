/**
 * reports.js - Module Báo cáo & Thống kê tuyển dụng chuyên sâu
 * Tối ưu hóa theo yêu cầu:
 * - Chỉ hiển thị: Các chỉ số tổng quan (KPI) & Bảng chi tiết tỷ lệ chuyển đổi (Conversion Rate)
 * - Loại bỏ toàn bộ các biểu đồ canvas thừa.
 */

const ReportsPage = (() => {
  let _timeFilter = 'all';
  let _deptFilter = 'all';

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

      const totalApps = ov.totalApplications || 0;
      const hiredCount = ov.hiredCount || 0;
      const overallConversionRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

      return `
        <div class="page-container">
          <div class="page-header mb-4">
            <div>
              <h1 class="page-title">Báo cáo tuyển dụng & Tỷ lệ chuyển đổi</h1>
              <p class="page-subtitle">Theo dõi các chỉ số KPI trọng yếu và bảng phân tích chi tiết tỷ lệ chuyển đổi qua từng giai đoạn</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-export-report-csv">
                <i data-lucide="download" class="icon-sm"></i> Xuất dữ liệu CSV
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
                    <option value="this_month" ${_timeFilter === 'this_month' ? 'selected' : ''}>Tháng này (10/2026)</option>
                    <option value="this_quarter" ${_timeFilter === 'this_quarter' ? 'selected' : ''}>Quý 4/2026</option>
                    <option value="this_year" ${_timeFilter === 'this_year' ? 'selected' : ''}>Năm 2026</option>
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
                  <i data-lucide="refresh-cw" class="icon-xs"></i> Cập nhật thời gian thực
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
            <!-- Funnel Conversion Rate Table -->
            <div class="card">
              <div class="card-header flex items-center justify-between">
                <div>
                  <h3 class="card-title text-sm font-bold flex items-center gap-2">
                    <i data-lucide="filter" class="icon-sm text-primary"></i> Bảng chi tiết tỷ lệ chuyển đổi qua các giai đoạn (Funnel Conversion Rate)
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

      // Export CSV
      document.getElementById('btn-export-report-csv')?.addEventListener('click', () => {
        const reportData = ATSStore.getRecruitmentReport({ timeRange: _timeFilter, department: _deptFilter });
        const funnel = reportData.funnel || [];
        const columns = [
          { key: 'stage', label: 'Giai đoạn tuyển dụng' },
          { key: 'count', label: 'Số lượng ứng viên' },
          { key: 'rate', label: 'Tỷ lệ chuyển đổi vòng' },
          { key: 'dropRate', label: 'Tỷ lệ rơi rụng' }
        ];
        Helpers.exportToCSV(funnel, columns, `Bao_cao_Ty_le_chuyen_doi_${_timeFilter}.csv`);
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast('Đã xuất báo cáo CSV thành công!', 'success');
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
