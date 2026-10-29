/**
 * portal.js - Cổng thông tin Tuyển dụng công khai dành cho Ứng viên (Candidate Career Portal)
 * Giao diện độc lập: Tìm kiếm việc làm, xem chi tiết JD, nộp CV trực tuyến với trích xuất tự động,
 * và tra cứu tiến độ xử lý hồ sơ bằng Email/Số điện thoại.
 */

const PortalPage = (() => {
  let _activeDept = 'all';
  let _searchKeyword = '';
  let _viewMode = 'jobs'; // 'jobs' | 'track'
  let _trackingQuery = '';

  return {
    render(params = {}) {
      const postings = ATSStore.getPostings().filter(p => p.status === 'published');
      const departments = ATSStore.getDepartments();

      let filteredJobs = postings;
      if (_activeDept !== 'all') {
        filteredJobs = filteredJobs.filter(p => p.department === _activeDept);
      }
      if (_searchKeyword) {
        const q = _searchKeyword.toLowerCase();
        filteredJobs = filteredJobs.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }

      return `
        <div class="portal-wrapper">
          <!-- Public Portal Navigation Bar -->
          <header class="portal-header">
            <div class="portal-header-container">
              <a href="#/portal" class="portal-brand">
                <div class="portal-brand-icon"><i data-lucide="layers"></i></div>
                <span class="portal-brand-text">SmartATS Careers</span>
              </a>

              <div class="portal-nav-links">
                <button class="portal-nav-btn ${_viewMode === 'jobs' ? 'active' : ''}" id="btn-portal-jobs">
                  <i data-lucide="briefcase" class="icon-xs"></i> Cơ hội nghề nghiệp
                </button>
                <button class="portal-nav-btn ${_viewMode === 'track' ? 'active' : ''}" id="btn-portal-track">
                  <i data-lucide="search" class="icon-xs"></i> Tra cứu hồ sơ đã nộp
                </button>
              </div>

              <div class="portal-header-actions">
                <a href="#/login" class="btn btn-sm btn-outline">
                  <i data-lucide="lock" class="icon-xs"></i> Đăng nhập nội bộ
                </a>
              </div>
            </div>
          </header>

          <!-- Hero Banner -->
          <section class="portal-hero">
            <div class="portal-hero-content">
              <span class="portal-hero-tag">Gia nhập đội ngũ nhân tài</span>
              <h1 class="portal-hero-title">Kiến tạo tương lai cùng SmartATS Solutions</h1>
              <p class="portal-hero-subtitle">Môi trường làm việc năng động, đãi ngộ cạnh tranh và lộ trình phát triển rõ ràng</p>

              <!-- Search Bar inside Hero -->
              <div class="portal-search-card">
                <div class="portal-search-input-wrap">
                  <i data-lucide="search" class="portal-search-icon"></i>
                  <input type="text" id="portal-search-job" class="portal-search-input" placeholder="Tìm kiếm vị trí tuyển dụng, kỹ năng..." value="${_searchKeyword}">
                </div>

                <div class="portal-search-select-wrap">
                  <i data-lucide="building" class="portal-search-icon"></i>
                  <select id="portal-dept-select" class="portal-search-select">
                    <option value="all" ${_activeDept === 'all' ? 'selected' : ''}>Tất cả phòng ban</option>
                    ${departments.map(d => `<option value="${d}" ${_activeDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>

                <button class="btn btn-primary portal-search-btn" id="btn-portal-search">
                  Tìm kiếm việc làm
                </button>
              </div>
            </div>
          </section>

          <!-- Main Body -->
          <main class="portal-main-container">
            ${_viewMode === 'track' ? this._renderTrackingSection() : this._renderJobListSection(filteredJobs)}
          </main>

          <!-- Public Footer -->
          <footer class="portal-footer">
            <div class="portal-footer-content">
              <p>© 2026 SmartATS Solutions Việt Nam - Hệ thống Quản lý Tuyển dụng Thông minh.</p>
              <p class="text-xs text-muted mt-1">Trụ sở: Tòa nhà Landmark, Cầu Giấy, Hà Nội • Hotline: 1900 xxxx • Email: hr@smartats.vn</p>
            </div>
          </footer>

          <!-- Portal Modals Container -->
          <div id="portal-modals-container"></div>
        </div>
      `;
    },

    _renderJobListSection(jobs) {
      if (!jobs || jobs.length === 0) {
        return `
          <div class="empty-state py-12">
            <i data-lucide="search-x" class="empty-state-icon"></i>
            <h3 class="empty-state-title">Không tìm thấy vị trí tuyển dụng phù hợp</h3>
            <p class="empty-state-description">Vui lòng thử lại với từ khóa khác hoặc chọn tất cả phòng ban.</p>
          </div>
        `;
      }

      const jobCards = jobs.map(j => `
        <div class="portal-job-card">
          <div class="portal-job-card-header">
            <div>
              <span class="badge badge-secondary font-mono text-xs mb-1">${j.code}</span>
              <h3 class="portal-job-title">${j.title}</h3>
              <div class="portal-job-dept">${j.department}</div>
            </div>
            <span class="portal-job-salary">${j.salary}</span>
          </div>

          <div class="portal-job-badges">
            <span class="portal-tag"><i data-lucide="map-pin" class="icon-xs"></i> ${j.location}</span>
            <span class="portal-tag"><i data-lucide="clock" class="icon-xs"></i> ${j.workType}</span>
            <span class="portal-tag"><i data-lucide="calendar" class="icon-xs"></i> Hạn: ${Helpers.formatDate(j.deadline)}</span>
          </div>

          <p class="portal-job-desc">${Helpers.truncate(j.description || '', 130)}</p>

          <div class="portal-job-card-footer">
            <button class="btn btn-outline btn-sm btn-job-detail" data-id="${j.id}">
              Xem chi tiết JD
            </button>
            <button class="btn btn-primary btn-sm btn-job-apply" data-id="${j.id}">
              <i data-lucide="send" class="icon-xs"></i> Ứng tuyển ngay
            </button>
          </div>
        </div>
      `).join('');

      return `
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Vị trí đang tuyển dụng (${jobs.length} công việc)</h2>
          </div>
          <div class="portal-jobs-grid">
            ${jobCards}
          </div>
        </div>
      `;
    },

    _renderTrackingSection() {
      const allApps = ATSStore.getApplications();
      let matchedApps = [];
      if (_trackingQuery.trim()) {
        const q = _trackingQuery.trim().toLowerCase();
        matchedApps = allApps.filter(a => {
          const cand = ATSStore.getCandidateById(a.candidateId) || {};
          return (cand.email && cand.email.toLowerCase().includes(q)) ||
                 (cand.phone && cand.phone.includes(q)) ||
                 (a.candidateName && a.candidateName.toLowerCase().includes(q));
        });
      }

      return `
        <div class="portal-track-container max-w-3xl mx-auto py-6">
          <div class="card mb-6">
            <div class="card-header py-4 text-center">
              <h2 class="text-lg font-bold text-gray-900">Tra cứu tiến độ hồ sơ ứng tuyển</h2>
              <p class="text-xs text-muted mt-1">Nhập địa chỉ Email hoặc Số điện thoại bạn đã dùng khi nộp CV để kiểm tra trạng thái</p>
            </div>
            <div class="card-body">
              <form id="form-tracking-search" class="flex gap-2">
                <input type="text" id="input-track-query" class="form-input flex-1" placeholder="Nhập email (ví dụ: nam.vu@gmail.com) hoặc SĐT..." value="${_trackingQuery}">
                <button type="submit" class="btn btn-primary">
                  <i data-lucide="search" class="icon-xs"></i> Tra cứu
                </button>
              </form>
            </div>
          </div>

          ${_trackingQuery.trim() ? `
            <div class="space-y-4">
              <h3 class="font-bold text-sm text-gray-800">Kết quả tìm kiếm (${matchedApps.length} hồ sơ):</h3>
              ${matchedApps.length > 0 ? matchedApps.map(app => {
                const cand = ATSStore.getCandidateById(app.candidateId) || {};
                const ivs = (ATSStore.getInterviews() || []).filter(i => i.candidateId === app.candidateId);

                return `
                  <div class="card p-4">
                    <div class="flex items-center justify-between border-b pb-3 mb-3">
                      <div>
                        <h4 class="font-bold text-base text-gray-900">${app.candidateName || cand.fullName}</h4>
                        <div class="text-xs text-muted">Vị trí: <strong class="text-primary">${app.positionTitle}</strong> • Nộp ngày: ${Helpers.formatDate(app.appliedDate)}</div>
                      </div>
                      <div>
                        ${Helpers.statusBadge(app.status)}
                      </div>
                    </div>

                    <!-- Pipeline Stepper -->
                    <div class="pipeline-stepper mb-4 text-xs">
                      <div class="step-item ${app.status !== 'rejected' ? 'step-completed' : ''}">
                        <div class="step-dot"><i data-lucide="check" class="icon-xs"></i></div>
                        <div class="step-label">Tiếp nhận CV</div>
                      </div>
                      <div class="step-item ${app.status !== 'pending_review' && app.status !== 'rejected' ? 'step-completed' : (app.status === 'pending_review' ? 'step-active' : '')}">
                        <div class="step-dot"><i data-lucide="file-check" class="icon-xs"></i></div>
                        <div class="step-label">Duyệt hồ sơ</div>
                      </div>
                      <div class="step-item ${app.status === 'interview_scheduled' || app.status === 'proposed' || app.status === 'hired' ? 'step-completed' : (app.status === 'passed_screening' ? 'step-active' : '')}">
                        <div class="step-dot"><i data-lucide="calendar" class="icon-xs"></i></div>
                        <div class="step-label">Phỏng vấn</div>
                      </div>
                      <div class="step-item ${app.status === 'hired' ? 'step-completed' : (app.status === 'proposed' ? 'step-active' : '')}">
                        <div class="step-dot"><i data-lucide="award" class="icon-xs"></i></div>
                        <div class="step-label">Tuyển dụng</div>
                      </div>
                    </div>

                    ${ivs.length > 0 ? `
                      <div class="bg-blue-50 border border-blue-200 p-3 rounded text-xs space-y-1">
                        <strong class="text-primary flex items-center gap-1"><i data-lucide="calendar" class="icon-xs"></i> Lịch phỏng vấn của bạn:</strong>
                        ${ivs.map(i => `
                          <div>• <strong>${i.round}:</strong> ${Helpers.formatDate(i.date)} (${i.startTime} - ${i.endTime}) - Hình thức: ${i.type === 'online' ? 'Trực tuyến' : 'Trực tiếp tại VP'}</div>
                        `).join('')}
                      </div>
                    ` : ''}

                    <div class="text-xs text-muted mt-3">
                      Lần cập nhật gần nhất: ${Helpers.formatDateTime(app.statusHistory ? app.statusHistory[app.statusHistory.length - 1]?.timestamp : app.appliedDate)}
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="card p-6 text-center text-muted">
                  <i data-lucide="inbox" class="w-8 h-8 text-gray-300 mx-auto mb-2"></i>
                  <p class="text-sm">Không tìm thấy hồ sơ nào khớp với thông tin "${_trackingQuery}".</p>
                </div>
              `}
            </div>
          ` : ''}
        </div>
      `;
    },

    init() {
      // Toggle Portal views
      document.getElementById('btn-portal-jobs')?.addEventListener('click', () => {
        _viewMode = 'jobs';
        this.refresh();
      });

      document.getElementById('btn-portal-track')?.addEventListener('click', () => {
        _viewMode = 'track';
        this.refresh();
      });

      // Search & Filter
      document.getElementById('portal-dept-select')?.addEventListener('change', (e) => {
        _activeDept = e.target.value;
        this.refresh();
      });

      document.getElementById('btn-portal-search')?.addEventListener('click', () => {
        _searchKeyword = document.getElementById('portal-search-job')?.value || '';
        this.refresh();
      });

      // Tracking form submit
      document.getElementById('form-tracking-search')?.addEventListener('submit', (e) => {
        e.preventDefault();
        _trackingQuery = document.getElementById('input-track-query')?.value || '';
        this.refresh();
      });

      // View Detail JD Buttons
      document.querySelectorAll('.btn-job-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showJobDetailModal(id);
        });
      });

      // Apply Buttons
      document.querySelectorAll('.btn-job-apply').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.showApplyModal(id);
        });
      });
    },

    refresh() {
      const container = document.getElementById('app');
      if (container) {
        container.innerHTML = this.render();
        this.init();
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showJobDetailModal(postingId) {
      const post = ATSStore.getPostingById(postingId);
      if (!post) return;

      const modalHtml = `
        <div class="modal active" id="modal-public-jd">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <span class="badge badge-secondary font-mono text-xs mb-1">${post.code}</span>
                  <h3 class="modal-title">${post.title}</h3>
                  <div class="text-xs text-muted mt-0.5">${post.department} • <strong class="text-success">${post.salary}</strong></div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-public-jd')">&times;</button>
              </div>

              <div class="modal-body text-xs space-y-4">
                <div class="bg-gray-50 p-3 rounded flex flex-wrap gap-4 border">
                  <div><span class="text-muted">Địa điểm:</span> <strong>${post.location}</strong></div>
                  <div><span class="text-muted">Hình thức:</span> <strong>${post.workType}</strong></div>
                  <div><span class="text-muted">Hạn nộp hồ sơ:</span> <strong>${Helpers.formatDate(post.deadline)}</strong></div>
                </div>

                <div>
                  <h4 class="font-bold text-sm text-gray-900 mb-2">1. Mô tả công việc</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.description)}</div>
                </div>

                <div>
                  <h4 class="font-bold text-sm text-gray-900 mb-2">2. Yêu cầu ứng viên</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.requirements)}</div>
                </div>

                <div>
                  <h4 class="font-bold text-sm text-gray-900 mb-2">3. Quyền lợi & Chế độ đãi ngộ</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.benefits)}</div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-public-jd')">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="UI.closeModal('modal-public-jd'); PortalPage.showApplyModal('${post.id}')">
                  <i data-lucide="send" class="icon-xs"></i> Ứng tuyển ngay bây giờ
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('portal-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-public-jd');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    },

    showApplyModal(postingId) {
      const post = ATSStore.getPostingById(postingId);
      if (!post) return;

      const modalHtml = `
        <div class="modal active" id="modal-portal-apply">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h3 class="modal-title">Ứng tuyển trực tuyến</h3>
                  <div class="text-xs text-muted mt-0.5">${post.title} · ${post.department}</div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-portal-apply')">&times;</button>
              </div>

              <form id="form-portal-apply">
                <div class="modal-body text-xs">
                  <!-- Section 1: Thông tin cá nhân -->
                  <h4 class="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i data-lucide="user" class="icon-xs text-primary"></i> 1. Thông tin cá nhân
                  </h4>
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label required">Họ và tên</label>
                      <input type="text" name="fullName" id="portal-name" class="form-input" required placeholder="Nguyễn Văn A">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Email</label>
                      <input type="email" name="email" id="portal-email" class="form-input" required placeholder="email@gmail.com">
                    </div>
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label required">Số điện thoại</label>
                    <input type="text" name="phone" id="portal-phone" class="form-input" required placeholder="090xxxxxxx">
                  </div>

                  <!-- Section 2: Học vấn & Kinh nghiệm -->
                  <h4 class="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 pt-2 border-t">
                    <i data-lucide="briefcase" class="icon-xs text-primary"></i> 2. Học vấn & Kinh nghiệm làm việc
                  </h4>
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label">Trình độ học vấn</label>
                      <input type="text" name="education" id="portal-edu" class="form-input" value="Đại học" placeholder="Đại học / Cao đẳng...">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Số năm kinh nghiệm (Năm)</label>
                      <input type="number" step="0.5" name="experienceYears" id="portal-exp" class="form-input" value="3">
                    </div>
                  </div>

                  <!-- Section 3: Upload CV / Dán văn bản CV (Nằm phía dưới phần Kinh nghiệm) -->
                  <h4 class="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 pt-2 border-t">
                    <i data-lucide="file-text" class="icon-xs text-primary"></i> 3. Tải lên tệp CV hoặc Dán văn bản CV
                  </h4>
                  <div class="form-group mb-2">
                    <div class="border-2 border-dashed border-blue-300 p-4 rounded text-center bg-blue-50 hover:bg-blue-100 transition cursor-pointer mb-2" id="portal-cv-dropzone">
                      <i data-lucide="upload-cloud" class="w-8 h-8 text-primary mx-auto mb-1"></i>
                      <div class="text-xs text-gray-700">Kéo thả tệp CV (.txt, .pdf, .docx) vào đây hoặc <label for="portal-file-input" class="text-primary font-bold cursor-pointer underline">chọn tệp từ thiết bị</label></div>
                      <input type="file" id="portal-file-input" class="hidden" accept=".txt,.pdf,.doc,.docx">
                    </div>

                    <textarea id="portal-raw-cv" name="rawResumeText" class="form-textarea font-mono text-xs" rows="5" placeholder="Dán toàn bộ nội dung CV tại đây để hệ thống ứng dụng NLP tự động phân tích từ khóa, đối chiếu tiêu chí và trích xuất thông tin..."></textarea>

                    <div class="flex justify-between items-center mt-2">
                      <button type="button" class="btn btn-xs btn-outline" id="btn-portal-autofill">
                        <i data-lucide="sparkles" class="icon-xs text-primary"></i> Tự động phân tích & điền thông tin bằng NLP
                      </button>
                      <button type="button" class="text-xs text-primary font-medium hover:underline" id="btn-portal-sample-cv">
                        + Dán nội dung CV mẫu có sẵn
                      </button>
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="UI.closeModal('modal-portal-apply')">Hủy</button>
                  <button type="submit" class="btn btn-primary">
                    <i data-lucide="send" class="icon-sm"></i> Gửi hồ sơ ứng tuyển
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('portal-modals-container');
      if (container) {
        container.innerHTML = modalHtml;
        UI.openModal('modal-portal-apply');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Sample CV Fill
        document.getElementById('btn-portal-sample-cv')?.addEventListener('click', () => {
          document.getElementById('portal-raw-cv').value = `HỌ VÀ TÊN: TRẦN VĂN QUANG
Email: quang.tran@gmail.com - SĐT: 0988776655
Học vấn: Đại học Bách Khoa Hà Nội
Kinh nghiệm: 4 năm làm Frontend Developer với React, TypeScript, Next.js, Redux, Tailwind CSS.`;
          this.autofillPortalForm();
        });

        // Autofill button
        document.getElementById('btn-portal-autofill')?.addEventListener('click', () => {
          this.autofillPortalForm();
        });

        // File drop/change
        const fileInput = document.getElementById('portal-file-input');
        if (fileInput) {
          fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
              const text = re.target.result;
              document.getElementById('portal-raw-cv').value = text;
              this.autofillPortalForm();
            };
            reader.readAsText(file);
          });
        }

        // Form Submit
        document.getElementById('form-portal-apply')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const rawCV = fd.get('rawResumeText') || '';

          // Parse skills and keywords automatically from CV text using NLP
          const parsedFromCV = ATSStore.parseCVText ? ATSStore.parseCVText(rawCV) : { skills: [] };

          const candidateData = {
            fullName: fd.get('fullName'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            experienceYears: parseFloat(fd.get('experienceYears')) || 0,
            education: fd.get('education') || 'Đại học',
            skills: parsedFromCV.skills || [],
            rawResumeText: rawCV
          };

          const newApp = ATSStore.submitApplication({
            candidateData,
            requisitionId: post.requisitionId,
            postingId: post.id,
            source: 'website'
          });

          const nlpScore = newApp && newApp.screeningScore != null ? ` Điểm đánh giá NLP: ${newApp.screeningScore}đ.` : '';
          UI.toast({
            message: `Nộp hồ sơ thành công! Mã hồ sơ: ${newApp.id}.${nlpScore} Bộ phận Tuyển dụng sẽ sớm liên hệ lại.`,
            type: 'success',
            duration: 6000
          });
          UI.closeModal('modal-portal-apply');

          // Switch to tracking view automatically
          _viewMode = 'track';
          _trackingQuery = candidateData.email;
          this.refresh();
        });
      }
    },

    autofillPortalForm() {
      const text = document.getElementById('portal-raw-cv')?.value || '';
      if (!text.trim()) {
        UI.toast({ message: 'Vui lòng dán văn bản CV trước.', type: 'warning' });
        return;
      }
      const parsed = ATSStore.parseCVText(text);
      if (parsed.name && document.getElementById('portal-name')) document.getElementById('portal-name').value = parsed.name;
      if (parsed.email && document.getElementById('portal-email')) document.getElementById('portal-email').value = parsed.email;
      if (parsed.phone && document.getElementById('portal-phone')) document.getElementById('portal-phone').value = parsed.phone;
      if (parsed.education && document.getElementById('portal-edu')) document.getElementById('portal-edu').value = parsed.education;
      if (parsed.experienceYears && document.getElementById('portal-exp')) document.getElementById('portal-exp').value = parsed.experienceYears;

      UI.toast({ message: 'NLP đã tự động nhận diện và điền đầy đủ thông tin từ CV!', type: 'success' });
    }
  };
})();
