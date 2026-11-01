/**
 * settings.js - Module Cài đặt hệ thống SmartATS
 * Quản lý cấu hình trọng số sàng lọc CV, ngưỡng điểm, tích hợp dịch vụ và khôi phục dữ liệu
 */

const SettingsPage = (() => {
  return {
    render() {
      const user = ATSStore.getCurrentUser();
      if (!user) return '<div class="page-container"><p>Vui lòng đăng nhập.</p></div>';

      const settings = ATSStore.getSettings();

      return `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">Cài đặt hệ thống</h1>
              <p class="page-subtitle">Quản lý tham số sàng lọc CV, thông tin doanh nghiệp, cổng tích hợp và dữ liệu mẫu</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-6">
            <!-- Left column: Main Settings (2 cols) -->
            <div class="col-span-2 space-y-6">
              <!-- AI Screening Settings Card -->
              <div class="card">
                <div class="card-header py-3">
                  <h3 class="card-title text-sm flex items-center gap-2">
                    <i data-lucide="sliders" class="icon-sm text-primary"></i>
                    Cấu hình Trọng số & Ngưỡng điểm Sàng lọc CV
                  </h3>
                </div>
                <div class="card-body">
                  <form id="form-settings-weights">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div class="form-group">
                        <label class="form-label required">Trọng số Kỹ năng chuyên môn (%)</label>
                        <input type="number" name="weight_skills" min="0" max="100" class="form-input" value="${settings.screeningWeights.skills}">
                      </div>
                      <div class="form-group">
                        <label class="form-label required">Trọng số Số năm kinh nghiệm (%)</label>
                        <input type="number" name="weight_exp" min="0" max="100" class="form-input" value="${settings.screeningWeights.experience}">
                      </div>
                      <div class="form-group">
                        <label class="form-label required">Trọng số Trình độ học vấn (%)</label>
                        <input type="number" name="weight_edu" min="0" max="100" class="form-input" value="${settings.screeningWeights.education}">
                      </div>
                      <div class="form-group">
                        <label class="form-label required">Trọng số Chứng chỉ & Ngoại ngữ (%)</label>
                        <input type="number" name="weight_certs" min="0" max="100" class="form-input" value="${settings.screeningWeights.certifications}">
                      </div>
                    </div>

                    <div class="section-divider mb-4"></div>

                    <h4 class="font-bold text-xs text-gray-800 mb-3">Ngưỡng phân loại kết quả (Score Thresholds)</h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div class="form-group">
                        <label class="form-label required">Mức điểm tối thiểu để "Đạt tiêu chí" (>= điểm)</label>
                        <input type="number" name="threshold_pass" min="50" max="100" class="form-input" value="${settings.scoreThresholds.pass}">
                        <small class="text-xs text-muted">Hồ sơ từ mức này trở lên và không thiếu kỹ năng bắt buộc sẽ được phân loại Đạt.</small>
                      </div>
                      <div class="form-group">
                        <label class="form-label required">Mức điểm "Cần kiểm tra thủ công" (>= điểm)</label>
                        <input type="number" name="threshold_manual" min="20" max="80" class="form-input" value="${settings.scoreThresholds.manual_check}">
                        <small class="text-xs text-muted">Dưới mức này hồ sơ sẽ bị đánh dấu Không đạt tiêu chuẩn.</small>
                      </div>
                    </div>

                    <div class="form-group mb-4">
                      <label class="checkbox-label">
                        <input type="checkbox" name="auto_approve" class="form-checkbox" ${settings.autoApproveEnabled !== false ? 'checked' : ''}>
                        <span>Tự động duyệt hồ sơ đạt ngưỡng</span>
                      </label>
                      <small class="text-xs text-muted">Khi bật, AI chuyển hồ sơ Đạt tiêu chí sang trạng thái “Đạt – Chờ phỏng vấn”. Hồ sơ dưới ngưỡng vẫn vào hàng chờ HR; AI không tự động loại ứng viên.</small>
                    </div>

                    <div class="text-right">
                      <button type="submit" class="btn btn-primary">
                        <i data-lucide="save" class="icon-sm"></i> Lưu cấu hình sàng lọc
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Integrations Card -->
              <div class="card">
                <div class="card-header py-3">
                  <h3 class="card-title text-sm flex items-center gap-2">
                    <i data-lucide="plug" class="icon-sm text-primary"></i>
                    Quản lý Cổng dịch vụ tích hợp (Integrations)
                  </h3>
                </div>
                <div class="card-body">
                  <div class="space-y-3">
                    <div class="p-3 border rounded flex items-center justify-between bg-gray-50">
                      <div>
                        <strong class="text-sm block">Cổng tuyển dụng Doanh nghiệp (Career Portal)</strong>
                        <span class="text-xs text-muted">Trang tuyển dụng công khai cho ứng viên nộp CV trực tuyến</span>
                      </div>
                      <span class="badge badge-success font-medium">Đang hoạt động</span>
                    </div>

                    <div class="p-3 border rounded flex items-center justify-between">
                      <div>
                        <strong class="text-sm block">Tích hợp TopCV Open API (Mô phỏng)</strong>
                        <span class="text-xs text-muted">Tự động đồng bộ tin đăng và tiếp nhận hồ sơ từ TopCV</span>
                      </div>
                      <span class="badge badge-info font-medium">Mô phỏng sẵn sàng</span>
                    </div>

                    <div class="p-3 border rounded flex items-center justify-between">
                      <div>
                        <strong class="text-sm block">LinkedIn Jobs Easy Apply (Mô phỏng)</strong>
                        <span class="text-xs text-muted">Đồng bộ ứng viên quốc tế và mạng lưới chuyên gia LinkedIn</span>
                      </div>
                      <span class="badge badge-info font-medium">Mô phỏng sẵn sàng</span>
                    </div>

                    <div class="p-3 border rounded flex items-center justify-between">
                      <div>
                        <strong class="text-sm block">Google Meet API</strong>
                        <span class="text-xs text-muted">Tự động sinh link phòng phỏng vấn trực tuyến trong lịch hẹn</span>
                      </div>
                      <span class="badge badge-success font-medium">Đã kích hoạt</span>
                    </div>

                    <div class="p-3 border rounded flex items-center justify-between">
                      <div>
                        <strong class="text-sm block">Hệ thống gửi Email SMTP</strong>
                        <span class="text-xs text-muted">Gửi thư mời phỏng vấn và thông báo kết quả ứng tuyển tự động</span>
                      </div>
                      <span class="badge badge-secondary font-medium">Chưa cấu hình Host/Port</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right column: Company info & Reset (1 col) -->
            <div class="space-y-6">
              <!-- Company Info -->
              <div class="card">
                <div class="card-header py-3">
                  <h3 class="card-title text-sm">Thông tin doanh nghiệp</h3>
                </div>
                <div class="card-body text-xs space-y-3">
                  <div class="form-group">
                    <label class="form-label">Hotline</label>
                    <input type="text" id="settings-company-hotline" class="form-input text-xs" value="${settings.hotline || '1900 xxxx'}" placeholder="1900 xxxx">
                    <span class="form-help text-xs text-muted">Số này hiển thị ở chân trang cổng tuyển dụng và trong email gửi ứng viên.</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tên công ty / Tập đoàn</label>
                    <input type="text" id="settings-company-name" class="form-input text-xs" value="${settings.companyName || 'SmartATS Solutions Việt Nam'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email phòng nhân sự (HR)</label>
                    <input type="email" id="settings-company-email" class="form-input text-xs" value="${settings.companyEmail || 'hr@smartats.vn'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Trụ sở chính</label>
                    <input type="text" id="settings-company-address" class="form-input text-xs" value="${settings.companyAddress || 'Tòa nhà Landmark, Cầu Giấy, Hà Nội'}">
                  </div>
                  <button type="button" class="btn btn-xs btn-outline w-full" id="btn-save-company-info">
                    <i data-lucide="save" class="icon-xs"></i> Lưu thông tin
                  </button>
                </div>
              </div>

              <!-- Reset Data -->
              <div class="card border-l-4 border-l-red-500">
                <div class="card-header py-3">
                  <h3 class="card-title text-sm text-danger flex items-center gap-1.5">
                    <i data-lucide="refresh-cw" class="icon-sm"></i>
                    Khôi phục dữ liệu mẫu ban đầu
                  </h3>
                </div>
                <div class="card-body text-xs space-y-3">
                  <p class="text-gray-600 leading-relaxed">
                    Xóa các dữ liệu đã thử nghiệm và đặt lại toàn bộ hệ thống về bộ dữ liệu mẫu chuẩn (bao gồm các yêu cầu, ứng viên mẫu, lịch phỏng vấn và tài khoản demo).
                  </p>
                  <button type="button" class="btn btn-danger w-full" id="btn-reset-store-data">
                    <i data-lucide="alert-triangle" class="icon-xs"></i> Khôi phục dữ liệu mặc định
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init() {
      // Weights form submit
      document.getElementById('form-settings-weights')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const weights = {
          skills: parseInt(fd.get('weight_skills'), 10) || 0,
          experience: parseInt(fd.get('weight_exp'), 10) || 0,
          education: parseInt(fd.get('weight_edu'), 10) || 0,
          certifications: parseInt(fd.get('weight_certs'), 10) || 0
        };
        const weightTotal = weights.skills + weights.experience + weights.education + weights.certifications;
        const passThreshold = parseInt(fd.get('threshold_pass'), 10) || 80;
        const manualThreshold = parseInt(fd.get('threshold_manual'), 10) || 60;

        if (weightTotal !== 100) {
          UI.toast({ message: `Tổng trọng số phải bằng 100% (hiện tại ${weightTotal}%).`, type: 'warning' });
          return;
        }
        if (passThreshold <= manualThreshold) {
          UI.toast({ message: 'Ngưỡng Đạt phải lớn hơn ngưỡng Cần kiểm tra thủ công.', type: 'warning' });
          return;
        }

        const newSettings = {
          screeningWeights: weights,
          scoreThresholds: {
            pass: passThreshold,
            manual_check: manualThreshold
          },
          autoApproveEnabled: fd.get('auto_approve') === 'on'
        };

        ATSStore.updateSettings(newSettings);
        UI.toast({ message: 'Đã lưu cấu hình sàng lọc thành công!', type: 'success' });
      });

      // Company info persistence
      document.getElementById('btn-save-company-info')?.addEventListener('click', () => {
        const companyName = (document.getElementById('settings-company-name')?.value || '').trim();
        const companyEmail = (document.getElementById('settings-company-email')?.value || '').trim();
        const companyAddress = (document.getElementById('settings-company-address')?.value || '').trim();
        const hotline = (document.getElementById('settings-company-hotline')?.value || '').trim();

        if (!companyName || !companyEmail) {
          UI.toast({ message: 'Vui lòng nhập tên công ty và email HR.', type: 'warning' });
          return;
        }
        if (!Helpers.isValidEmail(companyEmail)) {
          UI.toast({ message: 'Email HR chưa đúng định dạng.', type: 'warning' });
          return;
        }

        ATSStore.updateSettings({ companyName, companyEmail, companyAddress, hotline: hotline || '1900 xxxx' });
        UI.toast({ message: 'Đã lưu thông tin doanh nghiệp!', type: 'success' });
      });

      // Reset store data button
      document.getElementById('btn-reset-store-data')?.addEventListener('click', () => {
        UI.confirm({
          title: 'Khôi phục dữ liệu mẫu',
          message: 'Thao tác này sẽ tải lại dữ liệu mẫu gốc của hệ thống. Bạn có muốn tiếp tục không?',
          type: 'danger',
          confirmText: 'Xác nhận khôi phục',
          onConfirm: () => {
            ATSStore.resetAllData();
            UI.toast({ message: 'Đã khôi phục dữ liệu mẫu gốc thành công!', type: 'success' });
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        });
      });
    }
  };
})();
