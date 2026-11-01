/**
 * portal.js - Cổng thông tin Tuyển dụng công khai dành cho Ứng viên (Candidate Career Portal)
 * Giao diện độc lập: Tìm kiếm việc làm, xem chi tiết JD, nộp CV trực tuyến với trích xuất tự động,
 * và tra cứu tiến độ xử lý hồ sơ bằng Email/Số điện thoại.
 */

const PortalPage = (() => {
  let _viewMode = 'jobs'; // 'jobs' | 'track'
  let _searchKeyword = '';
  let _activeDept = 'all';
  let _trackingQuery = '';

  /**
   * Job cards show the position name only: no "Tuyển dụng" prefix,
   * no technology parenthetical and no salary suffix.
   */
  function cleanJobTitle(title) {
    return String(title || '')
      .replace(/^\s*(tuyển\s*dụng|tuyen\s*dung|hiring|tuyển)\s*[:|-]?\s*/i, '')
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s*[-–—|]\s*(lương|thu\s*nhập|salary|mức\s*lương).*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function renderJobSearch(departments) {
    return `
      <div class="portal-job-search">
        <form id="form-hero-job-search" class="portal-job-search-form">
          <div class="portal-search-container">
            <div class="portal-job-search-row">
              <div class="portal-job-search-input-wrap">
              <i data-lucide="search" class="portal-search-icon"></i>
              <input type="text" id="hero-job-query" class="portal-job-search-input" placeholder="Tìm theo vị trí hoặc kỹ năng…" value="${_searchKeyword || ''}">
            </div>
            <select id="hero-job-dept" class="portal-job-search-select">
              <option value="all">Tất cả phòng ban</option>
              ${departments.map(d => `<option value="${d}" ${_activeDept === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <button type="submit" class="btn btn-primary portal-job-search-btn">
              <i data-lucide="search" class="icon-xs"></i> Tìm việc
            </button>
          </div>
          </div>
        </form>
      </div>
    `;
  }

  function renderLookupForm() {
    return `
      <div class="portal-lookup">
        <div class="portal-lookup-inner">
            <p class="portal-lookup-title">
              <i data-lucide="search" class="icon-xs"></i> Tra cứu tiến độ hồ sơ ứng tuyển
            </p>
            <form id="form-hero-lookup" class="portal-lookup-form">
            <div class="portal-lookup-input-wrap">
              <i data-lucide="mail" class="portal-search-icon"></i>
              <input type="text" id="hero-track-query" class="portal-lookup-input" placeholder="Nhập email hoặc số điện thoại đã dùng khi nộp CV" value="${_trackingQuery}">
            </div>
            <button type="submit" class="btn btn-primary portal-lookup-btn">
              <i data-lucide="search" class="icon-xs"></i> Tra cứu
            </button>
          </form>
        </div>
      </div>
    `;
  }

  return {
    render(params = {}) {
      const postings = ATSStore.getPostings().filter(p => p.status === 'published');
      const departments = ATSStore.getDepartments();

      let jobs = postings;
      if (_activeDept && _activeDept !== 'all') {
        jobs = jobs.filter(j => j.department === _activeDept);
      }
      if (_searchKeyword) {
        const q = _searchKeyword.toLowerCase();
        jobs = jobs.filter(j =>
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.description && j.description.toLowerCase().includes(q))
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

          <!-- Hero: tiêu đề căn giữa + thanh tìm việc / tra cứu theo từng chế độ -->
          <section class="portal-hero">
            <div class="portal-hero-content">
              <h1 class="portal-hero-title">Hồ sơ của bạn được đọc, không chỉ được nhận.</h1>
              <p class="portal-hero-subtitle">${postings.length} vị trí đang mở. Nộp CV trực tuyến, theo dõi từng vòng và nhận phản hồi qua email.</p>

              ${_viewMode === 'track' ? renderLookupForm() : renderJobSearch(departments)}
            </div>
          </section>

          <!-- Main Body -->
          <main class="portal-main-container">
            ${_viewMode === 'track' ? this._renderTrackingSection() : this._renderJobListSection(jobs)}
          </main>

          <!-- Public Footer -->
          <footer class="portal-footer">
            <div class="portal-footer-content">
              <p><strong>SmartATS Solutions Việt Nam</strong> — Hệ thống Quản lý Tuyển dụng Thông minh.</p>
              <p>Trụ sở: ${(ATSStore.getSettings().companyAddress) || 'Tòa nhà Landmark, Cầu Giấy, Hà Nội'}</p>
              <p>Hotline: ${(ATSStore.getSettings().hotline) || '1900 xxxx'}&nbsp;&nbsp;&nbsp;Email: ${(ATSStore.getSettings().companyEmail) || 'hr@smartats.vn'}</p>
            </div>
          </footer>

          <!-- Portal Modals Container -->
          <div id="portal-modals-container"></div>
        </div>
      `;
    },

    _renderJobListSection(jobs) {
      if (!jobs || jobs.length === 0) {
        const filtered = _searchKeyword || (_activeDept && _activeDept !== 'all');
        return `
          <div class="empty-state py-12">
            <i data-lucide="search-x" class="empty-state-icon"></i>
            <h3 class="empty-state-title">${filtered ? 'Không tìm thấy vị trí phù hợp' : 'Hiện chưa có vị trí nào đang mở'}</h3>
            <p class="empty-state-description">${filtered ? 'Thử từ khóa khác hoặc chọn lại phòng ban.' : 'Các vị trí mới sẽ xuất hiện tại đây ngay khi được đăng tuyển.'}</p>
            ${filtered ? '<button class="btn btn-sm btn-outline mt-3" id="btn-portal-reset-search">Xóa bộ lọc</button>' : ''}
          </div>
        `;
      }

      const jobCards = jobs.map(j => `
        <article class="portal-job-card">
          <span class="portal-job-code">${j.code}</span>
          <h3 class="portal-job-title">${cleanJobTitle(j.title)}</h3>
          <div class="portal-job-dept">${j.department}</div>
          <span class="portal-job-salary">${j.salary || 'Thỏa thuận'}</span>

          <div class="portal-job-meta">
            <span class="portal-tag"><i data-lucide="map-pin"></i>${j.location}</span>
            <span class="portal-tag"><i data-lucide="clock"></i>${j.workType}</span>
            <span class="portal-tag"><i data-lucide="calendar"></i>Hạn nộp ${Helpers.formatDate(j.deadline)}</span>
          </div>

          <p class="portal-job-desc">${Helpers.truncate(j.description || '', 132)}</p>

          <div class="portal-job-card-footer">
            <button class="btn btn-sm btn-job-detail" data-id="${j.id}">
              <i data-lucide="file-text" class="icon-xs"></i> Chi tiết JD
            </button>
            <button class="btn btn-primary btn-sm btn-job-apply" data-id="${j.id}">
              Ứng tuyển
            </button>
          </div>
        </article>
      `).join('');

      return `
        <div>
          <div class="portal-list-head">
            <h2 class="portal-list-title">Vị trí đang mở</h2>
            <span class="portal-list-meta">${jobs.length} vị trí</span>
          </div>
          <div class="portal-jobs-grid">
            ${jobCards}
          </div>
        </div>
      `;
    },

    _renderTrackingSection() {
      const allApps = ATSStore.getApplications();
      const q = _trackingQuery.trim().toLowerCase();
      let matchedApps = [];
      if (q) {
        matchedApps = allApps.filter(a => {
          const cand = ATSStore.getCandidateById(a.candidateId) || {};
          return (cand.email && cand.email.toLowerCase().includes(q)) ||
                 (cand.phone && cand.phone.includes(q)) ||
                 (a.candidateName && a.candidateName.toLowerCase().includes(q));
        });
      }

      return `
        <div class="portal-track-container py-4">
          ${!q ? `
            <div class="empty-state">
              <i data-lucide="search" class="empty-state-icon"></i>
              <h3 class="empty-state-title">Tra cứu tiến độ hồ sơ ứng tuyển</h3>
              <p class="empty-state-description">Nhập email hoặc số điện thoại bạn đã dùng khi nộp CV vào ô tra cứu phía trên để xem trạng thái hồ sơ.</p>
            </div>
          ` : `
            <div class="portal-list-head">
              <h2 class="portal-list-title">Kết quả tra cứu</h2>
              <span class="portal-list-meta">${matchedApps.length} hồ sơ khớp “${_trackingQuery.trim()}”</span>
            </div>
            ${matchedApps.length > 0 ? matchedApps.map(app => {
              const cand = ATSStore.getCandidateById(app.candidateId) || {};
              const ivs = (ATSStore.getInterviews() || []).filter(i => i.candidateId === app.candidateId);

              return `
                <div class="card p-4 mb-3">
                  <div class="flex items-center justify-between border-b pb-3 mb-3">
                    <div>
                      <h4 class="font-bold text-base">${app.candidateName || cand.fullName}</h4>
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
                    <div class="portal-iv-note">
                      <strong class="flex items-center gap-1"><i data-lucide="calendar" class="icon-xs"></i> Lịch phỏng vấn của bạn:</strong>
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
                <p class="text-sm">Không tìm thấy hồ sơ nào khớp với thông tin “${_trackingQuery.trim()}”.</p>
              </div>
            `}
          `}
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

      // Tìm kiếm công việc (thanh tìm kiếm ở hero)
      document.getElementById('form-hero-job-search')?.addEventListener('submit', (e) => {
        e.preventDefault();
        _searchKeyword = document.getElementById('hero-job-query')?.value || '';
        _activeDept = document.getElementById('hero-job-dept')?.value || 'all';
        _viewMode = 'jobs';
        this.refresh();
        const results = document.querySelector('.portal-main-container');
        if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      // Tra cứu tiến độ hồ sơ (thanh tra cứu ở hero)
      document.getElementById('form-hero-lookup')?.addEventListener('submit', (e) => {
        e.preventDefault();
        _trackingQuery = (document.getElementById('hero-track-query')?.value || '').trim();
        _viewMode = 'track';
        this.refresh();
        const results = document.querySelector('.portal-main-container');
        if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      document.getElementById('btn-portal-reset-search')?.addEventListener('click', () => {
        _searchKeyword = '';
        _activeDept = 'all';
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
                  <h3 class="modal-title">${cleanJobTitle(post.title)}</h3>
                  <div class="text-xs text-muted mt-0.5">${post.department} • <strong class="text-primary">${post.salary}</strong></div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-public-jd')">&times;</button>
              </div>

              <div class="modal-body text-xs space-y-4">
                <div class="jd-facts">
                  <div><span>Địa điểm:</span> <strong>${post.location}</strong></div>
                  <div><span>Hình thức:</span> <strong>${post.workType}</strong></div>
                  <div><span>Hạn nộp hồ sơ:</span> <strong>${Helpers.formatDate(post.deadline)}</strong></div>
                  <div><span>Mức lương:</span> <strong>${post.salary}</strong></div>
                </div>

                <div>
                  <h4 class="jd-section-title">1. Mô tả công việc</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.description)}</div>
                </div>

                <div>
                  <h4 class="jd-section-title">2. Yêu cầu ứng viên</h4>
                  <div class="jd-content-box">${Helpers.formatJDText(post.requirements)}</div>
                </div>

                <div>
                  <h4 class="jd-section-title">3. Quyền lợi & Chế độ đãi ngộ</h4>
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
                  <div class="text-xs text-muted mt-0.5">${cleanJobTitle(post.title)} · ${post.department}</div>
                </div>
                <button type="button" class="modal-close" onclick="UI.closeModal('modal-portal-apply')">&times;</button>
              </div>

              <form id="form-portal-apply">
                <div class="modal-body text-xs">
                  <!-- Section 1: Thông tin cá nhân -->
                  <h4 class="form-section-title">Thông tin cá nhân</h4>
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
                  <h4 class="form-section-title">
                    Học vấn & kinh nghiệm làm việc
                  </h4>
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="form-group">
                      <label class="form-label">Trình độ học vấn</label>
                      <input type="text" name="education" id="portal-edu" class="form-input" value="Đại học" placeholder="Đại học / Cao đẳng...">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Giới tính</label>
                      <select name="gender" id="portal-gender" class="form-select">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác" selected>Khác</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Ngày sinh</label>
                      <input type="date" name="dob" id="portal-dob" class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label required">Số năm kinh nghiệm (Năm)</label>
                      <input type="number" step="0.5" min="0" name="experienceYears" id="portal-exp" class="form-input" value="3" placeholder="Ví dụ: 2.5">
                    </div>
                  </div>

                  <!-- Section 3: Upload CV / Dán văn bản CV (Nằm phía dưới phần Kinh nghiệm) -->
                  <h4 class="form-section-title">
                    Tệp CV
                  </h4>
                  <div class="form-group mb-2">
                    <div class="cv-dropzone" id="portal-cv-dropzone">
                      <i data-lucide="upload" class="icon-md"></i>
                      <div class="text-xs text-gray-700">Kéo thả tệp CV (.txt, .pdf, .docx) vào đây hoặc <label for="portal-file-input" class="text-primary font-bold cursor-pointer underline">chọn tệp từ thiết bị</label></div>
                      <input type="file" id="portal-file-input" class="hidden" accept=".txt,.pdf,.docx">
                    </div>

                    <input type="hidden" id="portal-raw-cv" name="rawResumeText" value="">
                    <p class="portal-cv-note" id="portal-cv-status">Tệp CV được lưu kèm hồ sơ để bộ phận tuyển dụng đọc và sàng lọc.</p>
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

        // File drop/change — đọc nội dung tệp và TỰ ĐỘNG ĐIỀN các trường.
        const fileInput = document.getElementById('portal-file-input');
        if (fileInput) {
          fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const status = document.getElementById('portal-cv-status');
            if (status) status.textContent = `Đang đọc ${file.name}…`;
            try {
              const text = await CVFile.extractText(file);
              if (!text || !text.trim()) {
                throw new Error('Tệp không có nội dung văn bản đọc được.');
              }
              const hidden = document.getElementById('portal-raw-cv');
              if (hidden) hidden.value = text;

              const filled = this.autofillPortalForm(text);
              if (status) {
                status.textContent = filled
                  ? `Đã đọc ${file.name} và điền thông tin tìm thấy. Vui lòng kiểm tra lại trước khi gửi.`
                  : `Đã đọc ${file.name} nhưng chưa nhận diện được thông tin. Vui lòng nhập tay.`;
              }
            } catch (err) {
              if (status) status.textContent = `Không đọc được ${file.name}. ${(err && err.message) || ''}`;
              UI.toast({ message: err && err.message ? err.message : 'Không đọc được tệp CV.', type: 'warning', duration: 7000 });
            }
          });
        }

        // Form Submit
        document.getElementById('form-portal-apply')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const rawCV = fd.get('rawResumeText') || '';

          // Parse skills and keywords automatically from CV text using NLP
          const parsedFromCV = ATSStore.parseCVText ? ATSStore.parseCVText(rawCV) : { skills: [] };

          const experienceYears = parseFloat(fd.get('experienceYears'));
          if (!Helpers.isValidExperienceYears(experienceYears)) {
            UI.toast({
              message: 'Số năm kinh nghiệm phải là số không âm (từ 0 đến 60). Vui lòng nhập lại.',
              type: 'warning'
            });
            return;
          }

          const candidateData = {
            fullName: fd.get('fullName'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            gender: fd.get('gender') || 'Khác',
            dob: fd.get('dob') || '',
            experienceYears,
            education: fd.get('education') || 'Đại học',
            skills: parsedFromCV.skills || [],
            certifications: parsedFromCV.certifications || [],
            rawResumeText: rawCV
          };

          const newApp = ATSStore.submitApplication({
            candidateData,
            requisitionId: post.requisitionId,
            postingId: post.id,
            source: 'website'
          });

          const nlpScore = newApp && newApp.screeningScore != null ? ` Điểm đánh giá NLP: ${newApp.screeningScore}đ.` : '';
          const autoNote = newApp?.screeningDetails?.autoApproved
            ? ' Hồ sơ đã vượt qua sàng lọc sơ bộ và được chuyển sang bước phỏng vấn.'
            : '';
          UI.toast({
            message: `Nộp hồ sơ thành công! Mã hồ sơ: ${newApp.id}.${nlpScore}${autoNote} Bộ phận Tuyển dụng sẽ sớm liên hệ lại.`,
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

    /**
     * Tự động điền thông tin từ văn bản CV vào form ứng tuyển.
     * Trả về true nếu điền được ít nhất một trường.
     */
    autofillPortalForm(sourceText) {
      const text = sourceText || document.getElementById('portal-raw-cv')?.value || '';
      if (!text.trim()) return false;

      const parsed = ATSStore.parseCVText(text);
      let filled = false;

      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null && String(value).trim() !== '') {
          el.value = value;
          filled = true;
        }
      };

      setValue('portal-name', parsed.name && parsed.name !== 'Ứng viên chưa rõ họ tên' ? parsed.name : '');
      setValue('portal-email', parsed.email);
      setValue('portal-phone', parsed.phone);
      setValue('portal-gender', parsed.gender && parsed.gender !== 'Khác' ? parsed.gender : '');
      setValue('portal-dob', parsed.dob);
      setValue('portal-edu', parsed.education && parsed.education !== 'Đang cập nhật' ? parsed.education : '');
      if (parsed.experienceYears > 0) setValue('portal-exp', parsed.experienceYears);

      return filled;
    }
  };
})();
