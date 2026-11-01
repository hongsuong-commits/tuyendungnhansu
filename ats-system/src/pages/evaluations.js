/**
 * evaluations.js - Module Đánh giá ứng viên & Quyết định tuyển dụng
 * Màn hình chính: danh sách ứng viên kèm điểm đánh giá trung bình.
 * Bấm vào một ứng viên: xem toàn bộ phiếu đánh giá của hội đồng phỏng vấn.
 */

const EvaluationsPage = (() => {
  let _selectedCandId = '';

  const ELIGIBLE_STATUSES = ['interview_scheduled', 'proposed', 'hired', 'passed_screening'];

  function getCandidateRows() {
    return ATSStore.getApplications()
      .filter(a => ELIGIBLE_STATUSES.includes(a.status))
      .map(app => {
        const evaluations = ATSStore.getEvaluations(app.candidateId);
        const average = evaluations.length
          ? Math.round(evaluations.reduce((sum, ev) => sum + (Number(ev.overallScore) || 0), 0) / evaluations.length)
          : null;
        return { app, evaluations, average };
      });
  }

  function renderAverage(average, count) {
    if (average === null) {
      return '<span class="is-quiet">Chưa có phiếu</span>';
    }
    return `
      <span class="eval-score">${average}<span class="unit">/100</span></span>
      <span class="table-sub">${count} phiếu đánh giá</span>
    `;
  }

  return {
    render(params = {}) {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      if (params.candidateId) {
        _selectedCandId = params.candidateId;
      }

      const rows = getCandidateRows();

      if (!rows.length) {
        return `
          <div class="page-container">
            <div class="page-header">
              <div class="page-heading">
                <h1 class="page-title">Đánh giá ứng viên</h1>
                <p class="page-subtitle">Điểm trung bình và phiếu đánh giá của hội đồng phỏng vấn</p>
              </div>
            </div>
            <div class="card">
              <div class="card-body">
                <div class="empty-state">
                  <i data-lucide="users" class="empty-state-icon"></i>
                  <h4 class="empty-state-title">Chưa có ứng viên nào ở vòng phỏng vấn</h4>
                </div>
              </div>
            </div>
            <div id="eval-modals-container"></div>
          </div>
        `;
      }

      const active = _selectedCandId
        ? rows.find(row => row.app.candidateId === _selectedCandId)
        : null;

      if (_selectedCandId && !active) {
        _selectedCandId = '';
      }

      return active ? this._renderDetail(active, user) : this._renderList(rows);
    },

    _renderList(rows) {
      const totalScorecards = rows.reduce((sum, row) => sum + row.evaluations.length, 0);

      return `
        <div class="page-container">
          <div class="page-header">
            <div class="page-heading">
              <h1 class="page-title">Đánh giá ứng viên</h1>
              <p class="page-subtitle">Điểm trung bình của hội đồng phỏng vấn. Bấm vào một ứng viên để xem toàn bộ phiếu đánh giá.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Danh sách ứng viên</h3>
                <p class="card-subtitle">Điểm trung bình được tính trên tất cả phiếu đã nộp cho ứng viên đó</p>
              </div>
              <span class="card-note">${rows.length} ứng viên · ${totalScorecards} phiếu</span>
            </div>
            <div class="card-body card-body-no-padding">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Ứng viên</th>
                      <th>Vị trí</th>
                      <th>Trạng thái</th>
                      <th class="text-right">Phiếu đánh giá</th>
                      <th class="text-right">Điểm trung bình</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map(row => `
                      <tr>
                        <td>
                          <a href="javascript:void(0)" class="table-name btn-open-eval" data-id="${row.app.candidateId}">${row.app.candidateName}</a>
                          <span class="table-sub">${row.app.positionTitle}</span>
                        </td>
                        <td>
                          <span class="table-name">${row.app.department || '—'}</span>
                          <span class="table-sub">Điểm sàng lọc ${row.app.screeningScore || 0}%</span>
                        </td>
                        <td>${Helpers.statusBadge(row.app.status)}</td>
                        <td class="text-right font-mono">${row.evaluations.length}</td>
                        <td class="text-right">${renderAverage(row.average, row.evaluations.length)}</td>
                        <td class="text-right">
                          <div class="eval-row-actions">
                            <button class="btn btn-xs btn-outline btn-open-eval" data-id="${row.app.candidateId}">
                              <i data-lucide="clipboard-list" class="icon-xs"></i> Xem phiếu
                            </button>
                            <button class="btn btn-xs btn-primary btn-new-scorecard" data-id="${row.app.candidateId}">
                              <i data-lucide="clipboard-check" class="icon-xs"></i> Nhập phiếu đánh giá
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="eval-modals-container"></div>
        </div>
      `;
    },

    _renderDetail(row, user) {
      const app = row.app;
      const canDecide = user.role === 'director' || user.role === 'hr';

      return `
        <div class="page-container">
          <div class="page-header">
            <div class="page-heading">
              <button class="btn btn-xs btn-outline mb-2" id="btn-back-eval-list">
                <i data-lucide="arrow-left" class="icon-xs"></i> Danh sách ứng viên
              </button>
              <h1 class="page-title">${app.candidateName}</h1>
              <p class="page-subtitle">${app.positionTitle}${app.department ? ` · ${app.department}` : ''}</p>
            </div>
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-create-scorecard">
                <i data-lucide="clipboard-check" class="icon-sm"></i> Nhập phiếu đánh giá mới
              </button>
            </div>
          </div>

          <div class="card mb-4">
            <div class="card-body">
              <div class="eval-summary">
                <div class="eval-summary-score">
                  <span class="eval-figure">${row.average !== null ? row.average : '—'}</span>
                  <span class="eval-figure-unit">/100</span>
                  <span class="eval-figure-label">Điểm trung bình · ${row.evaluations.length} phiếu</span>
                </div>
                <dl class="eval-facts">
                  <div><dt>Trạng thái hồ sơ</dt><dd>${Helpers.getStatusLabel(app.status)}</dd></div>
                  <div><dt>Điểm sàng lọc CV</dt><dd>${app.screeningScore || 0}%</dd></div>
                  <div><dt>Số phiếu đã nộp</dt><dd>${row.evaluations.length}</dd></div>
                </dl>
                ${canDecide ? `
                  <div class="eval-decision">
                    <span class="text-xs font-semibold">Quyết định tuyển dụng</span>
                    <div class="flex flex-wrap items-center gap-2">
                      <button class="btn btn-sm btn-outline" id="btn-propose-hire">
                        <i data-lucide="thumbs-up" class="icon-xs"></i> Đề xuất
                      </button>
                      <button class="btn btn-sm btn-primary" id="btn-confirm-hire">
                        <i data-lucide="check-circle" class="icon-xs"></i> Tuyển dụng
                      </button>
                      <button class="btn btn-sm btn-outline-danger" id="btn-reject-hire">
                        <i data-lucide="x-circle" class="icon-xs"></i> Từ chối
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-base text-gray-800 flex items-center gap-2">
                <i data-lucide="clipboard-list" class="icon-sm text-primary"></i>
                Phiếu đánh giá của hội đồng (${row.evaluations.length})
              </h3>
            </div>

            ${row.evaluations.length > 0 ? row.evaluations.map((ev, index) => this._renderScorecardItem(ev, index)).join('') : `
              <div class="card">
                <div class="card-body">
                  <div class="empty-state">
                    <i data-lucide="clipboard-check" class="empty-state-icon"></i>
                    <h4 class="empty-state-title">Chưa có phiếu đánh giá nào</h4>
                    <p class="empty-state-description">Bấm nút "Nhập phiếu đánh giá mới" ở trên để ghi nhận kết quả phỏng vấn.</p>
                  </div>
                </div>
              </div>
            `}
          </div>

          <div id="eval-modals-container"></div>
        </div>
      `;
    },

    _renderScorecardItem(ev, index) {
      const rec = ev.recommendation || 'continue';
      let recBadge = 'badge-success';
      if (rec === 'consider') recBadge = 'badge-warning';
      else if (rec === 'reject') recBadge = 'badge-danger';

      return `
        <div class="card">
          <div class="card-header flex items-center justify-between py-3">
            <div>
              <strong class="text-sm text-gray-900">${ev.round || 'Vòng phỏng vấn'}</strong>
              <span class="text-xs text-muted ml-2">${ev.evaluatorName} · ${ev.evaluatorRole || 'Hội đồng'}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="badge ${recBadge}">${Helpers.getRecommendationLabel(rec)}</span>
              <span class="eval-score">${ev.overallScore || 0}<span class="unit">/100</span></span>
            </div>
          </div>

          <div class="card-body text-xs space-y-3">
            <div class="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-gray-700">1. Kiến thức chuyên môn:</span>
                  <strong class="text-primary">${ev.scores?.professionalKnowledge || 0} / 5</strong>
                </div>
                <p class="text-muted italic">${ev.criteriaComments?.professionalKnowledge || '—'}</p>
              </div>

              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-gray-700">2. Kỹ năng liên quan công việc:</span>
                  <strong class="text-primary">${ev.scores?.workSkills || 0} / 5</strong>
                </div>
                <p class="text-muted italic">${ev.criteriaComments?.workSkills || '—'}</p>
              </div>

              <div class="border-t pt-2">
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-gray-700">3. Kinh nghiệm thực chiến:</span>
                  <strong class="text-primary">${ev.scores?.experience || 0} / 5</strong>
                </div>
                <p class="text-muted italic">${ev.criteriaComments?.experience || '—'}</p>
              </div>

              <div class="border-t pt-2">
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-gray-700">4. Giao tiếp & Làm việc nhóm:</span>
                  <strong class="text-primary">${ev.scores?.teamworkCommunication || 0} / 5</strong>
                </div>
                <p class="text-muted italic">${ev.criteriaComments?.teamworkCommunication || '—'}</p>
              </div>
            </div>

            <div>
              <span class="font-bold text-gray-800">Nhận xét tổng thể của người đánh giá:</span>
              <p class="text-gray-700 bg-white p-3 rounded border mt-1 leading-relaxed">${ev.comment || 'Không có nhận xét thêm'}</p>
            </div>

            <div class="text-right text-muted text-xs">
              Thời gian nộp phiếu: ${Helpers.formatDateTime(ev.createdAt)}
            </div>
          </div>
        </div>
      `;
    },

    init() {
      document.querySelectorAll('.btn-open-eval').forEach(btn => {
        btn.addEventListener('click', (e) => {
          _selectedCandId = e.currentTarget.getAttribute('data-id');
          Router.navigate('evaluations', { candidateId: _selectedCandId });
        });
      });

      document.getElementById('btn-back-eval-list')?.addEventListener('click', () => {
        _selectedCandId = '';
        Router.navigate('evaluations');
      });

      document.getElementById('btn-create-scorecard')?.addEventListener('click', () => {
        this.showScorecardModal();
      });

      // Mọi vai trò đều có thể nhập phiếu đánh giá ngay từ danh sách ứng viên.
      document.querySelectorAll('.btn-new-scorecard').forEach(btn => {
        btn.addEventListener('click', (e) => {
          _selectedCandId = e.currentTarget.getAttribute('data-id');
          this.showScorecardModal();
        });
      });

      document.getElementById('btn-propose-hire')?.addEventListener('click', () => {
        this.handleDecision('proposed', 'Đề xuất tuyển dụng ứng viên');
      });

      document.getElementById('btn-confirm-hire')?.addEventListener('click', () => {
        this.handleDecision('hired', 'Xác nhận tuyển dụng chính thức (Phê duyệt Offer)');
      });

      document.getElementById('btn-reject-hire')?.addEventListener('click', () => {
        this.handleDecision('rejected', 'Từ chối sau vòng phỏng vấn');
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

    showScorecardModal() {
      const activeApp = ATSStore.getApplications().find(a => a.candidateId === _selectedCandId);
      if (!activeApp) return;

      const user = ATSStore.getCurrentUser();
      const modalHtml = `
        <div class="modal active" id="modal-scorecard-form">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h3 class="modal-title">Phiếu đánh giá phỏng vấn ứng viên</h3>
                  <div class="text-xs text-muted mt-0.5">${activeApp.candidateName} - ${activeApp.positionTitle}</div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-scorecard-form')">&times;</button>
              </div>

              <form id="form-scorecard-submit">
                <div class="modal-body text-xs">
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
                      <label class="form-label required">Người đánh giá</label>
                      <input type="text" name="evaluatorName" class="form-input" required value="${user.fullName || user.username}">
                    </div>
                  </div>

                  <div class="border rounded p-3 bg-gray-50 mb-3 space-y-3">
                    <h4 class="font-bold text-sm text-gray-800">Chấm điểm tiêu chí (Thang điểm 1 - 5)</h4>

                    <div class="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <span class="font-semibold block">1. Kiến thức chuyên môn</span>
                        <span class="text-muted">Nắm vững kiến thức cốt lõi</span>
                      </div>
                      <div>
                        <select name="score_knowledge" class="form-select font-bold text-primary">
                          <option value="5">5 - Xuất sắc</option>
                          <option value="4" selected>4 - Tốt / Đạt yêu cầu</option>
                          <option value="3">3 - Khá / Cần đào tạo thêm</option>
                          <option value="2">2 - Trung bình</option>
                          <option value="1">1 - Không đạt</option>
                        </select>
                      </div>
                      <div>
                        <input type="text" name="comment_knowledge" class="form-input text-xs" placeholder="Ghi chú kiến thức chuyên môn...">
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <span class="font-semibold block">2. Kỹ năng công việc</span>
                        <span class="text-muted">Thao tác, tư duy xử lý vấn đề</span>
                      </div>
                      <div>
                        <select name="score_skills" class="form-select font-bold text-primary">
                          <option value="5">5 - Xuất sắc</option>
                          <option value="4" selected>4 - Tốt / Đạt yêu cầu</option>
                          <option value="3">3 - Khá</option>
                          <option value="2">2 - Trung bình</option>
                          <option value="1">1 - Yếu</option>
                        </select>
                      </div>
                      <div>
                        <input type="text" name="comment_skills" class="form-input text-xs" placeholder="Ghi chú kỹ năng thực hành...">
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <span class="font-semibold block">3. Kinh nghiệm làm việc</span>
                        <span class="text-muted">Dự án và sản phẩm đã làm</span>
                      </div>
                      <div>
                        <select name="score_exp" class="form-select font-bold text-primary">
                          <option value="5">5 - Rất dày dạn</option>
                          <option value="4" selected>4 - Phù hợp tốt</option>
                          <option value="3">3 - Tương đối</option>
                          <option value="2">2 - Còn non nớt</option>
                          <option value="1">1 - Chưa có kinh nghiệm</option>
                        </select>
                      </div>
                      <div>
                        <input type="text" name="comment_exp" class="form-input text-xs" placeholder="Ghi chú về thâm niên & dự án...">
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <span class="font-semibold block">4. Giao tiếp & Teamwork</span>
                        <span class="text-muted">Thái độ, văn hóa doanh nghiệp</span>
                      </div>
                      <div>
                        <select name="score_comms" class="form-select font-bold text-primary">
                          <option value="5" selected>5 - Rất chủ động, tích cực</option>
                          <option value="4">4 - Hòa đồng, hợp tác tốt</option>
                          <option value="3">3 - Bình thường</option>
                          <option value="2">2 - Ngại tương tác</option>
                          <option value="1">1 - Không phù hợp văn hóa</option>
                        </select>
                      </div>
                      <div>
                        <input type="text" name="comment_comms" class="form-input text-xs" placeholder="Ghi chú về thái độ & giao tiếp...">
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Khuyến nghị của bạn</label>
                      <select name="recommendation" class="form-select" required>
                        <option value="continue">Tiếp tục (Khuyến nghị tuyển dụng / Vòng tiếp theo)</option>
                        <option value="consider">Cân nhắc (Cần xem xét thêm với các ứng viên khác)</option>
                        <option value="reject">Không tiếp tục (Dừng tuyển dụng)</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Điểm tổng kết quy đổi (0 - 100)</label>
                      <input type="number" name="overallScore" min="0" max="100" class="form-input font-bold text-primary" value="85">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Nhận xét chi tiết tổng quan</label>
                    <textarea name="comment" class="form-textarea" rows="3" required placeholder="Nêu nhận xét tổng hợp về ứng viên sau buổi phỏng vấn..."></textarea>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-scorecard-form')">Hủy</button>
                  <button type="submit" class="btn btn-primary" id="btn-submit-scorecard">
                    <i data-lucide="save" class="icon-sm"></i> Lưu phiếu đánh giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('eval-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-scorecard-form');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('form-scorecard-submit')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);

          const payload = {
            candidateId: activeApp.candidateId,
            candidateName: activeApp.candidateName,
            requisitionId: activeApp.requisitionId,
            round: fd.get('round'),
            evaluatorName: fd.get('evaluatorName'),
            evaluatorRole: user.title || Helpers.getRoleLabel(user.role),
            scores: {
              professionalKnowledge: parseFloat(fd.get('score_knowledge')),
              workSkills: parseFloat(fd.get('score_skills')),
              experience: parseFloat(fd.get('score_exp')),
              teamworkCommunication: parseFloat(fd.get('score_comms'))
            },
            criteriaComments: {
              professionalKnowledge: fd.get('comment_knowledge'),
              workSkills: fd.get('comment_skills'),
              experience: fd.get('comment_exp'),
              teamworkCommunication: fd.get('comment_comms')
            },
            overallScore: parseInt(fd.get('overallScore'), 10) || 85,
            recommendation: fd.get('recommendation'),
            comment: fd.get('comment'),
            finalDecision: fd.get('recommendation') === 'continue' ? 'Đề xuất tuyển dụng' : (fd.get('recommendation') === 'consider' ? 'Cân nhắc' : 'Từ chối')
          };

          ATSStore.createEvaluation(payload);
          UI.toast({
            message: `Đã lưu phiếu đánh giá cho ${activeApp.candidateName}.`,
            type: 'success',
            duration: 5000
          });
          UI.closeModal('modal-scorecard-form');
          this.refresh();
        });
      }
    },

    handleDecision(newStatus, defaultNote = '') {
      const activeApp = ATSStore.getApplications().find(a => a.candidateId === _selectedCandId);
      if (!activeApp) return;

      const statusLabel = Helpers.getStatusLabel(newStatus);
      UI.confirm({
        title: `Xác nhận quyết định tuyển dụng`,
        message: `Bạn có chắc muốn ra quyết định "${statusLabel}" cho ứng viên ${activeApp.candidateName} không?`,
        type: newStatus === 'rejected' ? 'danger' : 'success',
        confirmText: 'Xác nhận quyết định',
        onConfirm: () => {
          ATSStore.updateApplicationStatus(activeApp.id, newStatus, defaultNote);
          UI.toast({
            message: `Đã cập nhật trạng thái ứng viên: ${statusLabel} (${activeApp.candidateName}).`,
            type: 'success',
            duration: 5000
          });
          this.refresh();
        }
      });
    }
  };
})();
