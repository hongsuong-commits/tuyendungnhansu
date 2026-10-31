/**
 * reports.js - Module Báo cáo & Thống kê tuyển dụng chuyên sâu
 * Cấu trúc báo cáo:
 * 1. Các chỉ số tổng quan (KPI)
 * 2. Bảng chi tiết tỷ lệ chuyển đổi (Conversion Rate)
 * 3. Hiệu quả nguồn tuyển dụng (Sourcing Efficiency)
 * 4. Thời gian đăng tin & Cảnh báo tin tồn đọng
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
      const postings = reportData.postings || [];

      const totalApps = ov.totalApplications || 0;
      const hiredCount = ov.hiredCount || 0;
      const overallConversionRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

      const sourcingWithData = sourcing.filter(s => s.totalApps > 0);
      const bestSource = sourcingWithData.length > 0
        ? sourcingWithData.reduce((best, s) => (s.hired > (best?.hired || 0) ? s : best), null)
        : null;

      const periodLabel = TIME_LABELS[_timeFilter] || 'Toàn bộ thời gian';
      const deptLabel = _deptFilter === 'all' ? 'Tất cả phòng ban' : _deptFilter;
      const readingLine = totalApps === 0
        ? `Chưa có hồ sơ nào trong kỳ đã chọn. Đổi kỳ báo cáo hoặc phòng ban để xem số liệu khác.`
        : `${totalApps} hồ sơ trong kỳ · ${ov.interviewedCount || 0} đã phỏng vấn · ${hiredCount} nhận việc · ${ov.activePositions || 0} vị trí đang mở.`;

      return `
        <div class="page-container">
          <div class="page-header">
            <div class="page-heading">
              <h1 class="page-title">Báo cáo tuyển dụng</h1>
              <p class="page-subtitle">Phễu chuyển đổi và hiệu quả từng nguồn ứng viên theo kỳ đã chọn</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-outline" id="btn-export-report-csv">
                <i data-lucide="download" class="icon-sm"></i> Xuất CSV
              </button>
            </div>
          </div>

          <!-- Kỳ báo cáo: một dải lọc mảnh, không phải một thẻ riêng -->
          <div class="report-bar">
            <div class="report-bar-field">
              <label class="filter-label" for="report-time-filter">Kỳ báo cáo</label>
              <select id="report-time-filter" class="form-select">
                <option value="all" ${_timeFilter === 'all' ? 'selected' : ''}>Toàn bộ thời gian</option>
                <option value="this_month" ${_timeFilter === 'this_month' ? 'selected' : ''}>Tháng này</option>
                <option value="this_quarter" ${_timeFilter === 'this_quarter' ? 'selected' : ''}>Quý này</option>
                <option value="this_year" ${_timeFilter === 'this_year' ? 'selected' : ''}>Năm nay</option>
              </select>
            </div>

            <div class="report-bar-field">
              <label class="filter-label" for="report-dept-filter">Phòng ban</label>
              <select id="report-dept-filter" class="form-select">
                <option value="all" ${_deptFilter === 'all' ? 'selected' : ''}>Tất cả phòng ban</option>
                ${departments.map(d => `<option value="${d}" ${_deptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>

            <p class="report-bar-note">Đang tính: ${periodLabel} · ${deptLabel}</p>
          </div>

          <!-- Các chỉ số của kỳ -->
          <div class="metric-strip metric-strip--6">
            <div class="metric">
              <span class="metric-label">Hồ sơ tiếp nhận</span>
              <span class="metric-value">${totalApps}</span>
              <span class="metric-note">Tổng đầu vào</span>
            </div>
            <div class="metric">
              <span class="metric-label">Chờ xem xét</span>
              <span class="metric-value">${ov.reviewingCount || 0}</span>
              <span class="metric-note">Chưa xử lý</span>
            </div>
            <div class="metric">
              <span class="metric-label">Đã phỏng vấn</span>
              <span class="metric-value">${ov.interviewedCount || 0}</span>
              <span class="metric-note">Qua vòng CV</span>
            </div>
            <div class="metric">
              <span class="metric-label">Đề xuất</span>
              <span class="metric-value">${ov.proposedCount || 0}</span>
              <span class="metric-note">Chờ offer</span>
            </div>
            <div class="metric">
              <span class="metric-label">Nhận việc</span>
              <span class="metric-value">${hiredCount}</span>
              <span class="metric-note">Đã tuyển</span>
            </div>
            <div class="metric">
              <span class="metric-label">Tỷ lệ tuyển</span>
              <span class="metric-value">${overallConversionRate}<span class="metric-unit">%</span></span>
              <span class="metric-note">Trên tổng hồ sơ</span>
            </div>
          </div>

          <p class="page-note">${readingLine}</p>

          <!-- Phễu chuyển đổi: mỗi vòng là một dòng, thu hẹp theo số ứng viên còn lại -->
          <div class="space-y-4">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Phễu tuyển dụng</h3>
                  <p class="card-subtitle">Số ứng viên còn lại sau mỗi vòng và số rơi rụng so với vòng liền trước</p>
                </div>
              </div>
              <div class="card-body">
                <div class="ledger">
                  ${funnel.map((f, i) => {
                    const totalInput = funnel[0]?.count || 1;
                    const width = f.count > 0 ? Math.max(3, Math.round((f.count / totalInput) * 100)) : 0;
                    const isLast = i === funnel.length - 1;
                    const tone = [1, 0.82, 0.66, 0.52, 0.4][i] ?? 0.4;
                    return `
                      <div class="ledger-row${isLast ? ' is-final' : ''}">
                        <div class="ledger-label">
                          ${f.stage}
                          <span class="ledger-note">${i === 0 ? 'Đầu vào của phễu' : (f.count === 0 ? 'Chưa có ứng viên ở vòng này' : `${f.rate} so với vòng trước`)}</span>
                        </div>
                        <div class="ledger-bar"><span style="width:${width}%; opacity:${tone}"></span></div>
                        <div class="ledger-value">${f.count}</div>
                        <div class="ledger-meta">${i === 0 ? '—' : (f.dropRate === '0%' ? 'không rơi' : `−${f.dropRate} rơi`)}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              <div class="card-footer">
                <span>${funnel.length} vòng · tính trên ${totalApps} hồ sơ đầu vào</span>
                <span>Rơi rụng = số mất đi so với vòng liền trước</span>
              </div>
            </div>

            <!-- Hiệu quả nguồn tuyển dụng -->
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Nguồn tuyển dụng</h3>
                  <p class="card-subtitle">Tỷ lệ hồ sơ theo nguồn và số ứng viên nhận việc</p>
                </div>
                ${bestSource ? `<span class="card-note">Dẫn đầu: ${bestSource.sourceName}</span>` : ''}
              </div>
              <div class="card-body">
                ${sourcing.every(s => !s.totalApps) ? `
                  <p class="ledger-empty">Chưa có hồ sơ nào trong kỳ để so sánh nguồn.</p>
                ` : `
                  <div class="ledger">
                    ${sourcing.map(s => {
                      const width = totalApps > 0 ? Math.round((s.totalApps / totalApps) * 100) : 0;
                      return `
                        <div class="ledger-row">
                          <div class="ledger-label">
                            ${s.sourceName}
                            <span class="ledger-note">${s.totalApps} hồ sơ · ${s.passed} đạt · ${s.interviewed} phỏng vấn</span>
                          </div>
                          <div class="ledger-bar"><span style="width:${width}%;${s.totalApps === 0 ? ' opacity:0;' : ''}"></span></div>
                          <div class="ledger-value">${s.hired}</div>
                          <div class="ledger-meta">${s.conversionRate || '0%'} chuyển đổi</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
              <div class="card-footer">
                <span>Cột số: ứng viên nhận việc</span>
                <span>Tỷ lệ tính trên hồ sơ từng nguồn</span>
              </div>
            </div>

            <!-- Tuổi tin đăng -->
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Tuổi tin đăng</h3>
                  <p class="card-subtitle">Tin quá 25 ngày được nhắc sắp hết hạn, quá 30 ngày bị đánh dấu tồn đọng</p>
                </div>
                <span class="card-note">${postings.length} tin trong kỳ</span>
              </div>
              <div class="card-body card-body-no-padding">
                <div class="table-responsive">
                  <table class="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Tin tuyển dụng</th>
                        <th>Ngày đăng</th>
                        <th class="text-right">Số ngày</th>
                        <th class="text-right">Hồ sơ</th>
                        <th class="text-right">Cảnh báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${postings.length === 0 ? `
                        <tr><td colspan="5" class="table-empty">Chưa có tin tuyển dụng phù hợp với bộ lọc.</td></tr>
                      ` : postings.map(p => `
                        <tr>
                          <td>
                            <span class="table-name">${Helpers.truncate(p.title, 34)}</span>
                            <span class="table-sub">${p.code || '—'} · ${p.department || '—'} · ${p.status === 'published' ? 'Đang đăng' : (p.status === 'draft' ? 'Nháp' : 'Đã đóng')}</span>
                          </td>
                          <td>${Helpers.formatDate(p.publishedAt)}</td>
                          <td class="text-right${p.isProlonged ? ' is-alert' : ''}">${p.daysActive}</td>
                          <td class="text-right">${p.applicantsCount}</td>
                          <td class="text-right">
                            ${p.isProlonged
                              ? '<span class="mark is-alert">Tồn đọng</span>'
                              : (p.isExpiringSoon ? '<span class="mark is-warn">Sắp hết hạn</span>' : '<span class="mark">Bình thường</span>')}
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
          { group: 'Tổng quan', item: 'Tỷ lệ tuyển trên tổng hồ sơ', value: (ov.totalApplications || 0) > 0 ? `${Math.round(((ov.hiredCount || 0) / ov.totalApplications) * 100)}%` : '0%' }
        );

        sourcing.forEach(s => {
          rows.push({
            group: 'Hiệu quả nguồn',
            item: s.sourceName,
            value: `${s.totalApps} hồ sơ · ${s.passed} đạt sàng lọc · ${s.interviewed} phỏng vấn · ${s.hired} nhận việc · ${s.conversionRate} chuyển đổi`
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
