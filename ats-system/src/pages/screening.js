/**
 * screening.js - Trung tâm Tự động đọc CV & Đối chiếu Tiêu chí tuyển dụng (AI Screening Center)
 * Thực thi quy trình: Trích xuất thông tin CV -> Chuẩn hóa -> So sánh trọng số -> Báo cáo sàng lọc
 */

const ScreeningPage = (() => {
  let _selectedReqId = '';

  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const requisitions = ATSStore.getRequisitions().filter(r => r.status === 'recruiting' || r.status === 'approved');
      if (!_selectedReqId && requisitions.length > 0) {
        _selectedReqId = requisitions[0].id;
      }

      const activeReq = ATSStore.getRequisitionById(_selectedReqId) || requisitions[0];
      const applications = activeReq ? ATSStore.getApplications({ requisitionId: activeReq.id }) : [];
      const settings = ATSStore.getSettings();

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Sàng lọc CV & Đối chiếu tiêu chí</h1>
              <p class="page-subtitle">Module phân tích văn bản CV tự động, trích xuất dữ liệu và hỗ trợ ra quyết định nghiệp vụ</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-open-live-scanner">
                <i data-lucide="scan-face" class="icon-sm"></i> Chạy đọc CV mới ngay
              </button>
            </div>
          </div>

          <!-- Important Rule Alert (Compliance with 5.5) -->
          <div class="alert alert-info mb-4">
            <i data-lucide="shield-alert" class="icon-sm"></i>
            <div class="text-xs leading-relaxed">
              <strong>Nguyên tắc đạo đức & nghiệp vụ hệ thống:</strong> Điểm số và phân loại sàng lọc là gợi ý hỗ trợ nhân sự đối chiếu với tiêu chuẩn công việc, không tự động loại bỏ ứng viên hoặc tự ý thay thế quyết định tuyển dụng cuối cùng. Hệ thống tuyệt đối không sử dụng giới tính, tuổi tác, dân tộc hay yếu tố nhạy cảm để chấm điểm.
            </div>
          </div>

          <div class="alert alert-success mb-4">
            <i data-lucide="sparkles" class="icon-sm"></i>
            <div class="text-xs leading-relaxed">
              <strong>Chính sách duyệt tự động:</strong> AI chuyển hồ sơ sang <strong>Đạt – Chờ phỏng vấn</strong> khi tổng điểm đạt <strong>≥ ${settings.scoreThresholds?.pass ?? 80} điểm</strong> và không còn tiêu chí bắt buộc nào chưa đáp ứng. Hồ sơ dưới ngưỡng được giữ lại cho HR xem xét; AI <strong>không tự động loại</strong> ứng viên.
            </div>
          </div>

          <!-- Position Selector & Scoring Weights Configuration Bar -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
              <div class="card-header py-3">
                <h3 class="card-title text-sm">Vị trí đối chiếu tiêu chí</h3>
              </div>
              <div class="card-body py-3">
                <div class="flex items-center gap-3">
                  <select id="select-screening-req" class="form-select flex-1">
                    ${requisitions.map(r => `<option value="${r.id}" ${r.id === _selectedReqId ? 'selected' : ''}>${r.title} (${r.department})</option>`).join('')}
                  </select>
                </div>

                ${activeReq ? `
                  <div class="grid grid-cols-3 gap-3 mt-3 pt-3 border-t text-xs">
                    <div>
                      <span class="text-muted">Kinh nghiệm tối thiểu:</span>
                      <strong class="block text-primary">${activeReq.minExperience || 2} năm</strong>
                    </div>
                    <div>
                      <span class="text-muted">Trình độ học vấn:</span>
                      <strong class="block text-gray-800">${activeReq.education || 'Đại học'}</strong>
                    </div>
                    <div>
                      <span class="text-muted">Kỹ năng bắt buộc:</span>
                      <div class="flex flex-wrap gap-1 mt-0.5">
                        ${(activeReq.skills || []).map(s => `<span class="badge badge-secondary text-xs">${s}</span>`).join('')}
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Scoring Weights Box -->
            <div class="card">
              <div class="card-header py-3 flex items-center justify-between">
                <h3 class="card-title text-sm">Cơ cấu trọng số tính điểm</h3>
                <span class="badge badge-secondary text-xs">Thang 100đ</span>
              </div>
              <div class="card-body py-3 text-xs space-y-2">
                <div class="flex justify-between items-center">
                  <span>Kỹ năng chuyên môn</span>
                  <strong class="text-primary">${settings.screeningWeights.skills}%</strong>
                </div>
                <div class="flex justify-between items-center">
                  <span>Số năm kinh nghiệm</span>
                  <strong class="text-primary">${settings.screeningWeights.experience}%</strong>
                </div>
                <div class="flex justify-between items-center">
                  <span>Trình độ học vấn</span>
                  <strong class="text-primary">${settings.screeningWeights.education}%</strong>
                </div>
                <div class="flex justify-between items-center">
                  <span>Chứng chỉ & Ngoại ngữ</span>
                  <strong class="text-primary">${settings.screeningWeights.certifications}%</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Thiết lập tiêu chí lọc CV (HR Configuration Section) -->
          <div class="card mb-4" id="card-screening-criteria-settings">
            <div class="card-header py-3 flex items-center justify-between">
              <h3 class="card-title text-sm font-bold flex items-center gap-2">
                <i data-lucide="sliders" class="icon-sm text-primary"></i>
                Thiết lập tiêu chí lọc CV cho vị trí
              </h3>
              <span class="badge badge-primary text-xs">Cấu hình HR${user.role !== 'hr' ? ' · Chỉ xem' : ''}</span>
            </div>
            <div class="card-body py-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Từ khóa / Kỹ năng chuyên môn bắt buộc</label>
                  ${user.role === 'hr' ? `<input type="text" id="criteria-skills-input" class="form-input text-xs" value="${activeReq ? (activeReq.skills || []).join(', ') : 'React, TypeScript, JavaScript'}" placeholder="React, TypeScript, Node.js, SQL...">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs text-gray-700">${activeReq ? (activeReq.skills || []).join(', ') : 'React, TypeScript, JavaScript'}</div>`}
                  <small class="text-2xs text-muted">Phân tách các từ khóa bằng dấu phẩy</small>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Số năm kinh nghiệm tối thiểu</label>
                  ${user.role === 'hr' ? `<input type="number" id="criteria-exp-input" class="form-input text-xs" min="0" max="20" step="0.5" value="${activeReq ? (activeReq.minExperience || 2) : 2}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs text-gray-700 font-mono">${activeReq ? (activeReq.minExperience || 2) : 2}</div>`}
                  <small class="text-2xs text-muted">Số năm tối thiểu yêu cầu cho ứng viên</small>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Trình độ học vấn tối thiểu</label>
                  ${user.role === 'hr' ? `<select id="criteria-edu-input" class="form-select text-xs"><option value="Đại học" ${!activeReq || activeReq.education === 'Đại học' ? 'selected' : ''}>Đại học chính quy trở lên</option><option value="Cao đẳng" ${activeReq && activeReq.education === 'Cao đẳng' ? 'selected' : ''}>Cao đẳng chuyên nghiệp</option><option value="Trung cấp" ${activeReq && activeReq.education === 'Trung cấp' ? 'selected' : ''}>Trung cấp / Chứng chỉ nghề</option><option value="Không yêu cầu" ${activeReq && activeReq.education === 'Không yêu cầu' ? 'selected' : ''}>Không yêu cầu bằng cấp</option></select>` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs text-gray-700">${activeReq ? (activeReq.education || 'Đại học') : 'Đại học'}</div>`}
                  <small class="text-2xs text-muted">Bằng cấp tiêu chuẩn để tính điểm học vấn</small>
                </div>
              </div>

              <!-- Score thresholds and weights row -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t items-end">
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Điểm Đạt (Pass)</label>
                  ${user.role === 'hr' ? `<input type="number" id="criteria-pass-score" class="form-input text-xs font-bold text-success" min="0" max="100" value="${settings.scoreThresholds?.pass ?? 80}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono font-bold text-success">${settings.scoreThresholds?.pass ?? 80}</div>`}
                </div>
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Điểm Xem xét (Review)</label>
                  ${user.role === 'hr' ? `<input type="number" id="criteria-review-score" class="form-input text-xs font-bold text-warning" min="0" max="100" value="${settings.scoreThresholds?.manual_check ?? 60}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono font-bold text-warning">${settings.scoreThresholds?.manual_check ?? 60}</div>`}
                </div>
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Tỷ trọng Kỹ năng (%)</label>
                  ${user.role === 'hr' ? `<input type="number" id="weight-skills" class="form-input text-xs" min="0" max="100" value="${settings.screeningWeights?.skills ?? 40}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono">${settings.screeningWeights?.skills ?? 40}</div>`}
                </div>
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Tỷ trọng Kinh nghiệm (%)</label>
                  ${user.role === 'hr' ? `<input type="number" id="weight-exp" class="form-input text-xs" min="0" max="100" value="${settings.screeningWeights?.experience ?? 30}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono">${settings.screeningWeights?.experience ?? 30}</div>`}
                </div>
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Tỷ trọng Học vấn (%)</label>
                  ${user.role === 'hr' ? `<input type="number" id="weight-edu" class="form-input text-xs" min="0" max="100" value="${settings.screeningWeights?.education ?? 15}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono">${settings.screeningWeights?.education ?? 15}</div>`}
                </div>
                <div class="form-group">
                  <label class="form-label text-2xs font-semibold">Tỷ trọng Chứng chỉ (%)</label>
                  ${user.role === 'hr' ? `<input type="number" id="weight-cert" class="form-input text-xs" min="0" max="100" value="${settings.screeningWeights?.certifications ?? 15}">` : `<div class="bg-gray-50 border rounded px-2 py-1.5 text-xs font-mono">${settings.screeningWeights?.certifications ?? 15}</div>`}
                </div>
              </div>
              <div class="flex items-center justify-between gap-3 mt-3">
                <span class="text-2xs text-muted">
                  Tổng trọng số: <strong id="weight-total" class="font-mono">${(settings.screeningWeights?.skills ?? 40) + (settings.screeningWeights?.experience ?? 30) + (settings.screeningWeights?.education ?? 15) + (settings.screeningWeights?.certifications ?? 15)}%</strong>
                  · phải bằng 100%
                </span>
                ${user.role === 'hr' ? `<button type="button" class="btn btn-primary btn-sm" id="btn-save-criteria"><i data-lucide="save" class="icon-xs"></i> Lưu tiêu chí</button>` : `<span class="text-2xs text-muted italic">Chỉ nhân sự có thể lưu thay đổi</span>`}
              </div>
            </div>
          </div>

          <!-- Screening Results Section for active requisition -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <div>
                <h3 class="card-title">Kết quả sàng lọc ứng viên (${applications.length} hồ sơ)</h3>
                <p class="text-xs text-muted mt-0.5">Danh sách kết quả đối chiếu tự động cho vị trí đang chọn</p>
              </div>
            </div>
            <div class="card-body card-body-no-padding">
              ${this._renderScreeningTable(applications)}
            </div>
          </div>

          <!-- Modals Container -->
          <div id="screening-modals-container"></div>
        </div>
      `;
    },

    _renderScreeningTable(apps) {
      if (!apps || apps.length === 0) {
        return `
          <div class="empty-state">
            <i data-lucide="scan-search" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Chưa có hồ sơ nào cho vị trí này</h3>
            <p class="empty-state-description">Bấm nút "Chạy đọc CV mới ngay" ở góc phải để thử nghiệm công cụ trích xuất CV.</p>
          </div>
        `;
      }

      const rows = apps.map((app, index) => {
        const cand = ATSStore.getCandidateById(app.candidateId) || {};
        const scr = app.screeningDetails || {};
        const score = app.screeningScore != null ? app.screeningScore : 0;

        let scoreBadge = 'badge-secondary';
        if (score >= 80) scoreBadge = 'badge-success';
        else if (score >= 60) scoreBadge = 'badge-warning';
        else scoreBadge = 'badge-danger';

        const metCount = (scr.metCriteria || []).length;
        const unmetCount = (scr.unmetCriteria || []).length;

        return `
          <tr class="${app.manualReview ? 'is-manual' : ''}">
            <td>
              <a href="javascript:void(0)" class="table-name btn-view-scr-detail" data-id="${app.id}">
                ${app.candidateName || cand.fullName}
              </a>
              <span class="table-sub">${cand.email || '—'}</span>
              ${app.manualReview ? `
                <span class="manual-flag">
                  <i data-lucide="alert-triangle" class="icon-2xs"></i>
                  Cần kiểm tra thủ công${app.manualReviewBy ? ` · ${app.manualReviewBy}` : ''}
                </span>` : ''}
            </td>
            <td class="col-optional"><span class="badge badge-secondary text-2xs">${app.source || 'Website'}</span></td>
            <td>
              <span class="badge ${scoreBadge}">${score}%</span>
              <span class="table-sub">${Helpers.getScreeningLabel(app.screeningResult)} · ${metCount}/${metCount + unmetCount} tiêu chí</span>
            </td>
            <td class="col-optional">
              <span class="table-sub">${Helpers.truncate(scr.summary || '—', 46)}</span>
            </td>
            <td>${Helpers.statusBadge(app.status)}</td>
            <td class="col-optional"><span class="table-sub">${Helpers.formatDate(scr.processedAt || app.appliedDate)}</span></td>
            <td class="text-right">
              <div class="table-actions">
                <button class="btn btn-xs btn-icon btn-outline btn-view-scr-detail" data-id="${app.id}" title="Xem chi tiết phân tích" aria-label="Xem chi tiết phân tích">
                  <i data-lucide="file-search" class="icon-xs"></i>
                </button>
                <button class="btn btn-xs btn-icon btn-outline btn-mark-manual ${app.manualReview ? 'is-active' : ''}" data-id="${app.id}" title="${app.manualReview ? 'Đã đánh dấu cần kiểm tra thủ công' : 'Đánh dấu cần kiểm tra thủ công'}" aria-label="Đánh dấu cần kiểm tra">
                  <i data-lucide="flag" class="icon-xs"></i>
                </button>
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
                <th>Ứng viên</th>
                <th class="col-optional">Nguồn</th>
                <th>Điểm · phân loại</th>
                <th class="col-optional">Kết luận sàng lọc</th>
                <th>Trạng thái</th>
                <th class="col-optional">Xử lý lúc</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    },

    init() {
      // Requisition Selector
      const reqSelect = document.getElementById('select-screening-req');
      if (reqSelect) {
        reqSelect.addEventListener('change', (e) => {
          _selectedReqId = e.target.value;
          this.refresh();
        });
      }

      // Save Criteria Settings Button
      const btnSaveCrit = document.getElementById('btn-save-criteria');
      if (btnSaveCrit) {
        btnSaveCrit.addEventListener('click', () => {
          const currentUser = ATSStore.getCurrentUser();
          if (!currentUser || currentUser.role !== 'hr') {
            UI.toast({ message: 'Chỉ nhân sự (HR) có quyền lưu cấu hình sàng lọc.', type: 'warning' });
            return;
          }
          const skillsRaw = document.getElementById('criteria-skills-input')?.value || '';
          const minExp = parseFloat(document.getElementById('criteria-exp-input')?.value) || 0;
          const education = document.getElementById('criteria-edu-input')?.value || 'Đại học';
          const passScore = parseInt(document.getElementById('criteria-pass-score')?.value, 10) || 80;
          const reviewScore = parseInt(document.getElementById('criteria-review-score')?.value, 10) || 60;

          const wSkills = parseInt(document.getElementById('weight-skills')?.value, 10) || 0;
          const wExp = parseInt(document.getElementById('weight-exp')?.value, 10) || 0;
          const wEdu = parseInt(document.getElementById('weight-edu')?.value, 10) || 0;
          const wCert = parseInt(document.getElementById('weight-cert')?.value, 10) || 0;
          const weightTotal = wSkills + wExp + wEdu + wCert;

          if ([wSkills, wExp, wEdu, wCert].some(w => w < 0 || w > 100)) {
            UI.toast({ message: 'Mỗi tỷ trọng phải nằm trong khoảng 0–100%.', type: 'warning' });
            return;
          }
          if (weightTotal !== 100) {
            UI.toast({ message: `Tổng trọng số phải bằng 100% (hiện tại ${weightTotal}%).`, type: 'warning' });
            return;
          }
          if (passScore <= reviewScore) {
            UI.toast({ message: 'Điểm Đạt phải lớn hơn điểm Xem xét.', type: 'warning' });
            return;
          }

          const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

          ATSStore.updateSettings({
            scoreThresholds: { pass: passScore, manual_check: reviewScore },
            screeningWeights: { skills: wSkills, experience: wExp, education: wEdu, certifications: wCert }
          });

          const requisitions = ATSStore.getRequisitions();
          const activeReq = requisitions.find(r => r.id === _selectedReqId) || requisitions[0];
          if (activeReq) {
            ATSStore.updateRequisition(activeReq.id, {
              skills,
              minExperience: minExp,
              education
            });
          }

          UI.toast({ message: 'Đã lưu cấu hình tiêu chí lọc CV thành công!', type: 'success' });
          this.refresh();
        });
      }

      // Live total for the four screening weights
      const weightInputs = ['weight-skills', 'weight-exp', 'weight-edu', 'weight-cert']
        .map(id => document.getElementById(id))
        .filter(Boolean);
      const weightTotalEl = document.getElementById('weight-total');
      const updateWeightTotal = () => {
        if (!weightTotalEl) return;
        const total = weightInputs.reduce((sum, input) => sum + (parseInt(input.value, 10) || 0), 0);
        weightTotalEl.textContent = total + '%';
        weightTotalEl.classList.toggle('text-danger', total !== 100);
        weightTotalEl.classList.toggle('text-success', total === 100);
      };
      weightInputs.forEach(input => input.addEventListener('input', updateWeightTotal));

      // Live Scanner Button
      const btnScan = document.getElementById('btn-open-live-scanner');
      if (btnScan) {
        btnScan.addEventListener('click', () => {
          this.showLiveScannerModal();
        });
      }

      // View Screening Detail buttons
      document.querySelectorAll('.btn-view-scr-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showScreeningDetailModal(id);
        });
      });

      // Mark Manual check buttons
      document.querySelectorAll('.btn-mark-manual').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          ATSStore.markForManualReview(id, 'Đánh dấu cần kiểm tra thủ công lại các tiêu chí chưa rõ');
          UI.toast({ message: 'Đã đánh dấu hồ sơ cần kiểm tra thủ công!', type: 'info' });
          this.refresh();
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

    showScreeningDetailModal(appId) {
      const app = ATSStore.getApplicationById(appId);
      if (!app) return;

      const cand = ATSStore.getCandidateById(app.candidateId) || {};
      const scr = app.screeningDetails || {};
      const metList = scr.metCriteria || [];
      const unmetList = scr.unmetCriteria || [];
      const missingList = scr.missingInfo || [];

      const modalHtml = `
        <div class="modal active" id="modal-scr-detail">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <div class="text-xs text-muted mb-0.5">Báo cáo sàng lọc CV thông minh</div>
                  <h3 class="modal-title">${app.candidateName || cand.fullName} - ${app.positionTitle}</h3>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-scr-detail')">&times;</button>
              </div>

              <div class="modal-body">
                <!-- Score Breakdown Header -->
                <div class="grid grid-cols-4 gap-3 p-3 bg-gray-50 border rounded mb-4">
                  <div class="text-center border-r">
                    <span class="text-xs text-muted">Điểm tổng hợp</span>
                    <div class="text-2xl font-black text-primary">${app.screeningScore || 0}%</div>
                  </div>
                  <div class="text-center border-r">
                    <span class="text-xs text-muted">Phân loại tự động</span>
                    <div class="mt-1">${Helpers.screeningBadge(app.screeningResult)}</div>
                  </div>
                  <div class="text-center border-r">
                    <span class="text-xs text-muted">Trạng thái hồ sơ</span>
                    <div class="mt-1">${Helpers.statusBadge(app.status)}</div>
                  </div>
                  <div class="text-center">
                    <span class="text-xs text-muted">Nguồn ứng viên</span>
                    <div class="mt-1 font-bold text-xs uppercase">${app.source || 'Website'}</div>
                  </div>
                </div>

                <!-- Explanation summary -->
                <div class="mb-4">
                  <h4 class="font-bold text-sm text-gray-800 mb-1">Nhận định & Giải thích kết quả</h4>
                  <p class="text-xs text-gray-700 bg-white p-3 rounded border leading-relaxed">${scr.summary || 'Không có bản tóm tắt'}</p>
                </div>

                <!-- NLP Keyword Analysis Section -->
                <div class="mb-4 border p-3 rounded bg-white">
                  <h4 class="font-bold text-xs text-gray-800 flex items-center gap-1.5 mb-2">
                    <i data-lucide="sparkles" class="icon-xs text-primary"></i> Phân tích từ khóa NLP & Mức độ tương thích
                  </h4>
                  <div class="space-y-2 text-xs">
                    <div>
                      <span class="text-muted block mb-1 font-semibold">Từ khóa chuyên môn khớp:</span>
                      <div class="flex flex-wrap gap-1.5">
                        ${(scr.matchedKeywords || []).map(m => `<span class="nlp-badge nlp-badge-matched"><i data-lucide="check" class="w-3 h-3"></i> ${m.keyword || m}</span>`).join('') || '<span class="text-muted">Chưa khớp từ khóa</span>'}
                      </div>
                    </div>
                    ${(scr.missingKeywords && scr.missingKeywords.length > 0) ? `
                      <div>
                        <span class="text-muted block mb-1 font-semibold">Từ khóa yêu cầu còn thiếu:</span>
                        <div class="flex flex-wrap gap-1.5">
                          ${scr.missingKeywords.map(k => `<span class="nlp-badge nlp-badge-missing"><i data-lucide="alert-circle" class="w-3 h-3"></i> ${k}</span>`).join('')}
                        </div>
                      </div>
                    ` : ''}
                    ${(scr.reasons && scr.reasons.length > 0) ? `
                      <div class="mt-2 pt-2 border-t">
                        <span class="text-muted block mb-1 font-semibold">Lý do chấm điểm NLP chi tiết:</span>
                        <ul class="space-y-1">
                          ${scr.reasons.map(r => `<li class="flex items-start gap-1.5 text-gray-700"><span class="text-primary font-bold">•</span> <span>${r}</span></li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Detailed Criteria Comparison -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="border p-3 rounded bg-white">
                    <h5 class="font-bold text-xs text-success flex items-center gap-1 mb-2">
                      <i data-lucide="check-circle" class="icon-xs"></i> Các tiêu chí đáp ứng (${metList.length})
                    </h5>
                    <ul class="text-xs space-y-1.5">
                      ${metList.map(m => `
                        <li class="bg-green-50 text-green-900 p-2 rounded border border-green-200">${m}</li>
                      `).join('') || '<li class="text-muted">Không có</li>'}
                    </ul>
                  </div>

                  <div class="border p-3 rounded bg-white">
                    <h5 class="font-bold text-xs text-danger flex items-center gap-1 mb-2">
                      <i data-lucide="alert-triangle" class="icon-xs"></i> Tiêu chí chưa đạt hoặc thiếu (${unmetList.length + missingList.length})
                    </h5>
                    <ul class="text-xs space-y-1.5">
                      ${unmetList.map(u => `
                        <li class="bg-red-50 text-red-900 p-2 rounded border border-red-200">${u}</li>
                      `).join('')}
                      ${missingList.map(mi => `
                        <li class="bg-yellow-50 text-yellow-900 p-2 rounded border border-yellow-200">${mi}</li>
                      `).join('')}
                      ${(unmetList.length === 0 && missingList.length === 0) ? '<li class="text-muted">Tất cả tiêu chí đều thỏa mãn!</li>' : ''}
                    </ul>
                  </div>
                </div>

                <!-- Extracted Raw Data vs Original CV -->
                <div class="border rounded p-3 bg-gray-50 mb-3">
                  <h5 class="font-bold text-xs text-gray-800 mb-2">Dữ liệu trích xuất từ CV</h5>
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>Kinh nghiệm: <strong>${cand.experienceYears || 0} năm</strong></div>
                    <div>Học vấn: <strong>${cand.education || '—'}</strong></div>
                    <div>Số kỹ năng tìm thấy: <strong>${(cand.skills || []).length} kỹ năng</strong></div>
                  </div>
                  <div class="mt-2 text-xs">
                    <span class="text-muted">Kỹ năng:</span> ${(cand.skills || []).join(', ') || 'Chưa nhận diện'}
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-scr-detail')">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="UI.closeModal('modal-scr-detail'); CandidatesPage.showCandidateDetailModal('${app.id}')">
                  <i data-lucide="user" class="icon-xs"></i> Xem hồ sơ ứng viên đầy đủ
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('screening-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-scr-detail');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showLiveScannerModal() {
      const requisitions = ATSStore.getRequisitions().filter(r => r.status === 'recruiting' || r.status === 'approved');

      const modalHtml = `
        <div class="modal active" id="modal-live-scanner">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h3 class="modal-title flex items-center gap-2">
                    <i data-lucide="scan-search" class="icon-md text-primary"></i>
                    Công cụ Đọc CV & Đối chiếu Tiêu chí Thời gian thực
                  </h3>
                  <p class="text-xs text-muted">Dán nội dung CV hoặc chọn tệp để kiểm tra thuật toán trích xuất và tính điểm tức thì</p>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-live-scanner')">&times;</button>
              </div>

              <div class="modal-body">
                <div class="grid grid-cols-2 gap-4">
                  <!-- Left column: Input CV & Job -->
                  <div>
                    <div class="form-group mb-3">
                      <label class="form-label required">Vị trí tuyển dụng đối chiếu</label>
                      <select id="live-scan-req" class="form-select">
                        ${requisitions.map(r => `<option value="${r.id}">${r.title} (${r.department})</option>`).join('')}
                      </select>
                    </div>

                    <div class="form-group mb-3">
                      <div class="flex justify-between items-center mb-1">
                        <label class="form-label required mb-0">Nội dung văn bản CV</label>
                        <div class="flex items-center gap-2">
                          <input type="file" id="live-scan-file-input" accept=".txt,.doc,.docx,.pdf" style="display: none;">
                          <button type="button" class="text-xs text-primary font-semibold hover-underline flex items-center gap-1" onclick="document.getElementById('live-scan-file-input').click()">
                            <i data-lucide="upload" class="icon-2xs"></i> Tải tệp CV
                          </button>
                          <span class="text-gray-300">•</span>
                          <button type="button" class="text-xs text-primary font-semibold hover-underline" id="btn-load-sample-cv">
                            + Tải CV mẫu
                          </button>
                        </div>
                      </div>
                      <textarea id="live-scan-text" class="form-textarea font-mono text-xs" rows="11" placeholder="Dán nội dung hồ sơ / CV của ứng viên vào đây (hệ thống sẽ tự động đọc và phân tích ngay)..."></textarea>
                      <div class="flex items-center gap-1.5 text-2xs text-muted mt-1">
                        <i data-lucide="zap" class="icon-2xs text-amber-500"></i>
                        <span>Tự động phân tích tức thì khi dán hoặc tải tệp CV.</span>
                      </div>
                    </div>

                    <button type="button" class="btn btn-primary w-full" id="btn-run-live-analysis">
                      <i data-lucide="cpu" class="icon-sm"></i> Chạy lại phân tích & Đối chiếu
                    </button>
                  </div>

                  <!-- Right column: Live Analysis Result -->
                  <div class="border rounded p-3 bg-gray-50 flex flex-col justify-between" id="live-scan-result-panel">
                    <div class="text-center py-12 text-muted">
                      <i data-lucide="sparkles" class="w-12 h-12 text-gray-300 mx-auto mb-2"></i>
                      <p class="text-sm">Kết quả trích xuất và bảng điểm đối chiếu sẽ hiển thị tại đây.</p>
                      <span class="text-xs text-gray-400">Bấm nút "Tải nội dung CV mẫu" bên trái để thử nghiệm ngay.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-live-scanner')">Đóng</button>
                <button type="button" class="btn btn-success" id="btn-save-as-candidate" style="display: none;">
                  <i data-lucide="user-check" class="icon-sm"></i> Lưu vào danh sách ứng viên
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('screening-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-live-scanner');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        let lastAnalysis = null;

        const runAnalysis = (notifyToast = false) => {
          const text = document.getElementById('live-scan-text')?.value || '';
          if (!text.trim() || text.trim().length < 20) {
            if (notifyToast) {
              UI.toast({ message: 'Vui lòng dán nội dung hoặc tải tệp CV trước khi phân tích.', type: 'warning' });
            }
            return;
          }

          const reqId = document.getElementById('live-scan-req')?.value;
          const req = ATSStore.getRequisitionById(reqId);

          // Run parsing & evaluation
          const parsed = ATSStore.parseCVText(text);
          const evaluation = ATSStore.evaluateCandidate(parsed, req);
          lastAnalysis = { parsed, evaluation, reqId, text };

          // Render result in panel
          const panel = document.getElementById('live-scan-result-panel');
          if (panel) {
            panel.innerHTML = `
              <div class="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                <div class="flex items-center justify-between p-3 bg-white border rounded">
                  <div>
                    <span class="text-xs text-muted">Họ tên nhận diện:</span>
                    <strong class="block text-sm text-primary">${parsed.name}</strong>
                    <div class="text-xs text-muted">${parsed.email} • ${parsed.phone}</div>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-muted">Điểm phù hợp</span>
                    <div class="text-2xl font-black text-primary">${evaluation.score}%</div>
                    <div>${Helpers.screeningBadge(evaluation.classification)}</div>
                  </div>
                </div>

                <div class="p-2.5 bg-white border rounded text-xs">
                  <div class="font-bold text-gray-800 mb-1">Dữ liệu chuẩn hóa trích xuất:</div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>Kinh nghiệm: <strong>${parsed.experienceYears} năm</strong></div>
                    <div>Học vấn: <strong>${parsed.education}</strong></div>
                  </div>
                  <div class="mt-1">
                    Kỹ năng (${parsed.skills.length}): <span class="text-primary font-medium">${parsed.skills.join(', ') || 'Chưa nhận diện'}</span>
                  </div>
                </div>

                <!-- Live NLP Keyword Analysis -->
                <div class="p-2.5 bg-white border rounded text-xs">
                  <div class="font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <i data-lucide="sparkles" class="icon-xs text-primary"></i> Phân tích từ khóa NLP:
                  </div>
                  <div class="mb-1.5">
                    <span class="text-muted block text-2xs mb-0.5">Từ khóa trùng khớp:</span>
                    <div class="flex flex-wrap gap-1">
                      ${(evaluation.matchedKeywords || []).map(m => `<span class="nlp-badge nlp-badge-matched text-2xs py-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> ${m.keyword || m}</span>`).join('') || '<span class="text-muted text-2xs">Không có</span>'}
                    </div>
                  </div>
                  ${(evaluation.missingKeywords && evaluation.missingKeywords.length > 0) ? `
                    <div>
                      <span class="text-muted block text-2xs mb-0.5">Từ khóa còn thiếu:</span>
                      <div class="flex flex-wrap gap-1">
                        ${evaluation.missingKeywords.map(k => `<span class="nlp-badge nlp-badge-missing text-2xs py-0.5"><i data-lucide="alert-circle" class="w-2.5 h-2.5"></i> ${k}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>

                <div class="p-2.5 bg-white border rounded text-xs">
                  <div class="font-bold text-success mb-1 flex items-center gap-1">
                    <i data-lucide="check" class="icon-xs"></i> Tiêu chí đáp ứng (${evaluation.metCriteria.length})
                  </div>
                  <ul class="space-y-1">
                    ${evaluation.metCriteria.map(m => `<li class="text-gray-700">• ${m}</li>`).join('')}
                  </ul>
                </div>

                ${(evaluation.reasons && evaluation.reasons.length > 0) ? `
                  <div class="p-2.5 bg-white border rounded text-xs">
                    <div class="font-bold text-gray-800 mb-1 flex items-center gap-1">
                      <i data-lucide="info" class="icon-xs text-blue-500"></i> Lý do chấm điểm (NLP Justification):
                    </div>
                    <ul class="space-y-1">
                      ${evaluation.reasons.map(r => `<li class="text-gray-700">• ${r}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${(evaluation.unmetCriteria.length > 0 || evaluation.missingInfo.length > 0) ? `
                  <div class="p-2.5 bg-white border rounded text-xs">
                    <div class="font-bold text-danger mb-1 flex items-center gap-1">
                      <i data-lucide="alert-circle" class="icon-xs"></i> Tiêu chí chưa đạt hoặc thiếu
                    </div>
                    <ul class="space-y-1">
                      ${evaluation.unmetCriteria.map(u => `<li class="text-red-700">• ${u}</li>`).join('')}
                      ${evaluation.missingInfo.map(mi => `<li class="text-yellow-700">• ${mi}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                <div class="text-xs text-gray-600 italic bg-blue-50 p-2 rounded border border-blue-200">
                  "${evaluation.summary}"
                </div>
              </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Show save button
            const saveBtn = document.getElementById('btn-save-as-candidate');
            if (saveBtn) {
              saveBtn.style.display = 'inline-flex';
            }

            if (notifyToast) {
              UI.toast({ message: `Đã phân tích CV thành công: ${evaluation.score} điểm (${Helpers.getScreeningLabel(evaluation.classification)})`, type: 'success' });
            }
          }
        };

        // Sample CV button
        document.getElementById('btn-load-sample-cv')?.addEventListener('click', () => {
          document.getElementById('live-scan-text').value = `HỌ VÀ TÊN: TRẦN VĂN QUANG
Email: quang.tran@gmail.com - SĐT: 0988776655 - Địa chỉ: Thanh Xuân, Hà Nội
HỌC VẤN:
- Cử nhân Công nghệ Thông tin - Đại học Bách Khoa Hà Nội (2015 - 2020)
KINH NGHIỆM:
- 2021 - Nay (4 năm): Frontend Developer tại Techcom Securities
  + Thiết kế và xây dựng hệ thống Trading Web với React 18, TypeScript, Tailwind CSS.
  + Quản lý State với Redux Toolkit và Zustand. Tối ưu performance Core Web Vitals.
  + Có kinh nghiệm với Next.js và Git.
KỸ NĂNG:
- React, TypeScript, JavaScript, Tailwind CSS, Redux, Next.js, Git, HTML/CSS.
CHỨNG CHỈ:
- IELTS 6.5`;
          runAnalysis(true);
        });

        // File upload input change
        document.getElementById('live-scan-file-input')?.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            const content = await CVFile.extractText(file);
            const textarea = document.getElementById('live-scan-text');
            if (textarea) {
              textarea.value = content;
              runAnalysis(true);
            }
          } catch (err) {
            UI.toast({ message: err && err.message ? err.message : 'Không đọc được tệp CV.', type: 'warning' });
          }
          e.target.value = '';
        });

        // Automatic real-time analysis on typing or pasting
        let debounceTimer = null;
        document.getElementById('live-scan-text')?.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            runAnalysis(false);
          }, 350);
        });

        document.getElementById('live-scan-text')?.addEventListener('paste', () => {
          setTimeout(() => {
            runAnalysis(false);
          }, 100);
        });

        document.getElementById('live-scan-req')?.addEventListener('change', () => {
          runAnalysis(false);
        });

        // Manual button
        document.getElementById('btn-run-live-analysis')?.addEventListener('click', () => {
          runAnalysis(true);
        });

        // Save as Candidate button
        document.getElementById('btn-save-as-candidate')?.addEventListener('click', () => {
          if (!lastAnalysis) return;

          const candData = {
            fullName: lastAnalysis.parsed.name,
            email: lastAnalysis.parsed.email,
            phone: lastAnalysis.parsed.phone,
            experienceYears: lastAnalysis.parsed.experienceYears,
            education: lastAnalysis.parsed.education,
            skills: lastAnalysis.parsed.skills,
            certifications: lastAnalysis.parsed.certifications,
            rawResumeText: lastAnalysis.text
          };

          const newApp = ATSStore.submitApplication({
            candidateData: candData,
            requisitionId: lastAnalysis.reqId,
            source: 'website'
          });

          const autoNote = newApp?.screeningDetails?.autoApproved
            ? ' AI đã tự động duyệt sang bước Đạt – Chờ phỏng vấn.'
            : '';
          UI.toast({ message: `Đã lưu hồ sơ ứng viên ${candData.fullName} vào hệ thống!${autoNote}`, type: 'success' });
          UI.closeModal('modal-live-scanner');
          this.refresh();
        });
      }
    }
  };
})();
