/**
 * Dashboard Page Module - ATS System
 * Displays stat cards, CSS-based charts, upcoming interviews,
 * and pending applications. All data computed dynamically from ATSStore.
 * Role-aware: department_head sees only own department data.
 */
const DashboardPage = (() => {
  'use strict';

  // ─── Helpers ──────────────────────────────────────────────────────────
  function esc(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function safeGet(collection) {
    const store = window.ATSStore;
    if (!store) return [];
    if (typeof store.get === 'function') return store.get(collection) || [];
    if (typeof store.getAll === 'function') return store.getAll(collection) || [];
    if (store[collection]) return store[collection] || [];
    return [];
  }

  function getById(collection, id) {
    const items = safeGet(collection);
    return items.find(item => item.id === id) || null;
  }

  function getCurrentUser() {
    if (window.AuthManager && typeof window.AuthManager.getCurrentUser === 'function') {
      return window.AuthManager.getCurrentUser();
    }
    if (window.ATSStore && typeof window.ATSStore.getCurrentUser === 'function') {
      return window.ATSStore.getCurrentUser();
    }
    return null;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    if (typeof Helpers !== 'undefined' && Helpers.formatDate) return Helpers.formatDate(dateStr);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    if (typeof Helpers !== 'undefined' && Helpers.formatDateTime) return Helpers.formatDateTime(dateStr);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hrs}:${mins}`;
  }

  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (typeof Helpers !== 'undefined' && Helpers.formatNumber) return Helpers.formatNumber(num);
    return Number(num).toLocaleString('vi-VN');
  }

  function truncate(str, maxLen = 30) {
    if (!str) return '';
    if (typeof Helpers !== 'undefined' && Helpers.truncate) return Helpers.truncate(str, maxLen);
    const s = String(str);
    return s.length <= maxLen ? s : s.substring(0, maxLen).trimEnd() + '…';
  }

  // ─── Data Computation ────────────────────────────────────────────────

  /**
   * Compute all dashboard stats from store data.
   * Filters by department if user is department_head.
   */
  function computeStats() {
    const user = getCurrentUser();

    let applications = safeGet('applications');
    let postings = safeGet('jobPostings');
    let interviews = safeGet('interviews');
    let requisitions = safeGet('jobRequisitions');
    let candidates = safeGet('candidates');

    // Department head → filter to own department's data
    if (user && user.role === 'department_head') {
      const userDept = user.department || user.departmentId;
      if (userDept) {
        // Filter requisitions by department
        const deptRequisitions = requisitions.filter(r =>
          r.departmentId === userDept || r.department === userDept
        );
        const deptReqIds = deptRequisitions.map(r => r.id);

        // Filter applications by department's requisitions
        applications = applications.filter(a =>
          deptReqIds.includes(a.requisitionId) || deptReqIds.includes(a.jobRequisitionId)
        );

        // Filter postings by department's requisitions
        postings = postings.filter(p =>
          deptReqIds.includes(p.requisitionId) || deptReqIds.includes(p.jobRequisitionId)
        );

        // Filter interviews by department's requisitions or applications
        const deptAppIds = applications.map(a => a.id);
        interviews = interviews.filter(iv =>
          deptReqIds.includes(iv.requisitionId) ||
          deptReqIds.includes(iv.jobRequisitionId) ||
          deptAppIds.includes(iv.applicationId)
        );
      }
    }

    // ── Stat card values ──
    const openPositions = postings.filter(p =>
      p.status === 'published' || p.status === 'active' || p.status === 'recruiting'
    ).length;

    const totalApplications = applications.length;

    const pendingReview = applications.filter(a =>
      a.status === 'pending_review' || a.status === 'submitted' || a.status === 'new'
    ).length;

    const passedStatuses = [
      'passed_screening', 'interview_scheduled', 'proposed', 'hired', 'completed'
    ];
    const passedScreening = applications.filter(a =>
      passedStatuses.includes(a.status)
    ).length;

    // Upcoming interviews in next 7 days
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const nowStr = now.toISOString().split('T')[0];
    const in7Str = in7Days.toISOString().split('T')[0];

    const upcomingInterviewsList = interviews.filter(iv => {
      const ivDate = iv.date || iv.interviewDate || iv.scheduledDate || '';
      const statusOk = !iv.status ||
        iv.status === 'pending' || iv.status === 'confirmed' ||
        iv.status === 'scheduled' || iv.status === 'interview_scheduled';
      return statusOk && ivDate >= nowStr && ivDate <= in7Str;
    });
    const upcomingInterviews = upcomingInterviewsList.length;

    const hired = applications.filter(a => a.status === 'hired').length;

    // ── Funnel data ──
    const funnelInterviewed = applications.filter(a =>
      a.status === 'interview_scheduled' || a.status === 'interviewed' ||
      a.status === 'completed'
    ).length;
    const funnelProposed = applications.filter(a =>
      a.status === 'proposed'
    ).length;

    const funnel = [
      { label: 'Ứng tuyển', count: totalApplications },
      { label: 'Chờ duyệt', count: pendingReview },
      { label: 'Đạt sàng lọc', count: applications.filter(a => passedStatuses.includes(a.status)).length },
      { label: 'Đã phỏng vấn', count: funnelInterviewed },
      { label: 'Đề xuất tuyển', count: funnelProposed },
      { label: 'Đã tuyển', count: hired },
    ];

    // ── Source effectiveness ──
    const sourceMap = {};
    const sourceLabels = {
      website: 'Website',
      Website: 'Website',
      linkedin: 'LinkedIn',
      LinkedIn: 'LinkedIn',
      topcv: 'TopCV',
      TopCV: 'TopCV',
      vietnamworks: 'VietnamWorks',
      VietnamWorks: 'VietnamWorks',
      referral: 'Giới thiệu',
      'Giới thiệu': 'Giới thiệu',
      other: 'Khác',
      Khác: 'Khác',
    };
    const canonicalSources = ['Website', 'LinkedIn', 'TopCV', 'VietnamWorks', 'Giới thiệu', 'Khác'];
    canonicalSources.forEach(s => { sourceMap[s] = 0; });

    applications.forEach(app => {
      let src = app.source || app.recruitmentSource || app.channel || '';
      // Normalize source
      const mapped = sourceLabels[src];
      if (mapped) {
        sourceMap[mapped] = (sourceMap[mapped] || 0) + 1;
      } else if (src) {
        sourceMap['Khác'] = (sourceMap['Khác'] || 0) + 1;
      } else {
        sourceMap['Khác'] = (sourceMap['Khác'] || 0) + 1;
      }
    });

    // Also check candidates if applications don't have source
    if (totalApplications === 0) {
      candidates.forEach(c => {
        let src = c.source || c.recruitmentSource || c.channel || '';
        const mapped = sourceLabels[src];
        if (mapped) {
          sourceMap[mapped] = (sourceMap[mapped] || 0) + 1;
        } else {
          sourceMap['Khác'] = (sourceMap['Khác'] || 0) + 1;
        }
      });
    }

    const sources = Object.entries(sourceMap)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count }));

    // ── Upcoming interview details (sorted, top 5) ──
    const sortedUpcoming = [...upcomingInterviewsList]
      .sort((a, b) => {
        const dateA = a.date || a.interviewDate || a.scheduledDate || '';
        const dateB = b.date || b.interviewDate || b.scheduledDate || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.time || a.startTime || '';
        const timeB = b.time || b.startTime || '';
        return timeA.localeCompare(timeB);
      })
      .slice(0, 5);

    // Enrich with candidate/position names
    const upcomingDetails = sortedUpcoming.map(iv => {
      const candidate = getById('candidates', iv.candidateId);
      const requisition = getById('jobRequisitions', iv.requisitionId || iv.jobRequisitionId);
      const posting = getById('jobPostings', iv.postingId || iv.jobPostingId);

      const candidateName = candidate
        ? (candidate.fullName || candidate.name || '—')
        : (iv.candidateName || '—');

      const position = requisition
        ? (requisition.title || requisition.position || '—')
        : posting
          ? (posting.title || posting.position || '—')
          : (iv.positionTitle || iv.position || '—');

      const typeMap = {
        phone: 'Điện thoại',
        online: 'Trực tuyến',
        onsite: 'Trực tiếp',
        video: 'Video call',
        technical: 'Kỹ thuật',
        hr: 'HR',
        final: 'Vòng cuối',
      };

      const roundMap = {
        1: 'Vòng 1',
        2: 'Vòng 2',
        3: 'Vòng 3',
        'round_1': 'Vòng 1',
        'round_2': 'Vòng 2',
        'round_3': 'Vòng 3',
        'technical': 'Kỹ thuật',
        'hr': 'HR',
        'final': 'Vòng cuối',
      };

      const statusLabelMap = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        scheduled: 'Đã lên lịch',
        interview_scheduled: 'Đã lên lịch',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
      };

      return {
        id: iv.id,
        dateTime: formatDateTime((iv.date || iv.interviewDate || iv.scheduledDate) + (iv.time ? 'T' + iv.time : '')),
        candidateName: candidateName,
        position: position,
        round: roundMap[iv.round] || roundMap[iv.interviewRound] || iv.round || '—',
        type: typeMap[iv.type] || typeMap[iv.interviewType] || iv.type || '—',
        status: statusLabelMap[iv.status] || iv.status || '—',
        statusRaw: iv.status || 'pending',
      };
    });

    // ── Pending applications details (top 5, most recent first) ──
    const pendingApps = applications
      .filter(a =>
        a.status === 'pending_review' || a.status === 'submitted' || a.status === 'new'
      )
      .sort((a, b) => {
        const dateA = a.appliedDate || a.createdAt || a.submittedDate || '';
        const dateB = b.appliedDate || b.createdAt || b.submittedDate || '';
        return dateB.localeCompare(dateA); // Most recent first
      })
      .slice(0, 5);

    const pendingDetails = pendingApps.map(app => {
      const candidate = getById('candidates', app.candidateId);
      const requisition = getById('jobRequisitions', app.requisitionId || app.jobRequisitionId);
      const posting = getById('jobPostings', app.postingId || app.jobPostingId);

      const candidateName = candidate
        ? (candidate.fullName || candidate.name || '—')
        : (app.candidateName || app.fullName || '—');

      const position = requisition
        ? (requisition.title || requisition.position || '—')
        : posting
          ? (posting.title || posting.position || '—')
          : (app.positionTitle || app.position || '—');

      const source = app.source || app.recruitmentSource || app.channel ||
        (candidate && (candidate.source || candidate.recruitmentSource)) || '—';

      return {
        id: app.id,
        candidateId: app.candidateId || app.id,
        candidateName: candidateName,
        position: position,
        appliedDate: formatDate(app.appliedDate || app.createdAt || app.submittedDate),
        source: sourceLabels[source] || source,
        screeningScore: app.screeningScore ?? app.score ?? null,
      };
    });

    return {
      openPositions,
      totalApplications,
      pendingReview,
      passedScreening,
      upcomingInterviews,
      hired,
      funnel,
      sources,
      upcomingDetails,
      pendingDetails,
    };
  }

  // ─── Rendering Functions ─────────────────────────────────────────────

  function renderStatCards(stats) {
    const cards = [
      {
        icon: '📋', label: 'Vị trí đang tuyển', value: stats.openPositions,
        color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.1)', page: 'postings',
      },
      {
        icon: '👥', label: 'Tổng hồ sơ ứng viên', value: stats.totalApplications,
        color: '#1E3A5F', bgColor: 'rgba(30, 58, 95, 0.1)', page: 'candidates',
      },
      {
        icon: '⏳', label: 'Chờ duyệt hồ sơ', value: stats.pendingReview,
        color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', page: 'screening',
      },
      {
        icon: '✅', label: 'Đạt sàng lọc', value: stats.passedScreening,
        color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', page: 'candidates',
      },
      {
        icon: '📅', label: 'Lịch phỏng vấn sắp tới', value: stats.upcomingInterviews,
        color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.1)', page: 'interviews',
      },
      {
        icon: '🎉', label: 'Đã tuyển', value: stats.hired,
        color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', page: 'candidates',
      },
    ];

    return `
      <div class="stats-grid dashboard-stats-grid">
        ${cards.map(card => `
          <div class="stat-card dashboard-stat-card" data-navigate="${esc(card.page)}" 
               style="cursor:pointer; border-left: 4px solid ${card.color};">
            <div class="stat-card__icon-wrap" style="background:${card.bgColor}; color:${card.color};">
              <span class="stat-card__emoji">${card.icon}</span>
            </div>
            <div class="stat-card__info">
              <span class="stat-card__value" style="color:${card.color};">${formatNumber(card.value)}</span>
              <span class="stat-card__label">${esc(card.label)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderFunnelChart(funnel) {
    const maxCount = Math.max(...funnel.map(f => f.count), 1);
    const total = funnel[0]?.count || 1;
    const gradientColors = [
      '#93C5FD', // light blue
      '#60A5FA',
      '#3B82F6',
      '#2563EB',
      '#1D4ED8',
      '#1E3A5F', // dark blue/navy
    ];

    const barsHtml = funnel.map((stage, i) => {
      const widthPct = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 2);
      const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
      const color = gradientColors[i] || gradientColors[gradientColors.length - 1];

      return `
        <div class="funnel-row">
          <div class="funnel-label">${esc(stage.label)}</div>
          <div class="funnel-bar-wrap">
            <div class="funnel-bar" style="width:${widthPct}%; background:${color};" 
                 title="${esc(stage.label)}: ${stage.count} (${pct}%)">
              <span class="funnel-bar-text">${stage.count}</span>
            </div>
            <span class="funnel-pct">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card chart-card">
        <div class="card-header">
          <h3 class="card-title">Ứng viên theo giai đoạn</h3>
        </div>
        <div class="card-body">
          <div class="funnel-chart">
            ${barsHtml}
          </div>
        </div>
      </div>
    `;
  }

  function renderSourceChart(sources) {
    const total = sources.reduce((sum, s) => sum + s.count, 0) || 1;
    const sourceColors = {
      'Website': '#3B82F6',
      'LinkedIn': '#0A66C2',
      'TopCV': '#FF6B35',
      'VietnamWorks': '#00B14F',
      'Giới thiệu': '#8B5CF6',
      'Khác': '#94A3B8',
    };

    // Build conic-gradient segments
    let accumulated = 0;
    const gradientParts = [];
    const legendItems = [];

    sources.forEach(src => {
      const pct = (src.count / total) * 100;
      const color = sourceColors[src.label] || '#94A3B8';
      gradientParts.push(`${color} ${accumulated}% ${accumulated + pct}%`);
      legendItems.push({
        label: src.label,
        count: src.count,
        pct: Math.round(pct),
        color: color,
      });
      accumulated += pct;
    });

    // If no data, show empty state
    if (sources.length === 0 || total <= 0) {
      return `
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">Hiệu quả nguồn tuyển dụng</h3>
          </div>
          <div class="card-body">
            <div class="chart-empty-state">
              <span class="chart-empty-icon">📊</span>
              <p>Chưa có dữ liệu nguồn tuyển dụng</p>
            </div>
          </div>
        </div>
      `;
    }

    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    const legendHtml = legendItems.map(item => `
      <div class="source-legend-item" title="${esc(item.label)}: ${item.count} (${item.pct}%)">
        <span class="source-legend-dot" style="background:${item.color};"></span>
        <span class="source-legend-label">${esc(item.label)}</span>
        <span class="source-legend-count">${item.count}</span>
        <span class="source-legend-pct">${item.pct}%</span>
      </div>
    `).join('');

    return `
      <div class="card chart-card">
        <div class="card-header">
          <h3 class="card-title">Hiệu quả nguồn tuyển dụng</h3>
        </div>
        <div class="card-body">
          <div class="donut-chart-container">
            <div class="donut-chart">
              <div class="donut-ring" style="background: ${conicGradient};"></div>
              <div class="donut-hole">
                <span class="donut-total-number">${total}</span>
                <span class="donut-total-label">Hồ sơ</span>
              </div>
            </div>
            <div class="source-legend">
              ${legendHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderUpcomingInterviews(details) {
    if (!details || details.length === 0) {
      return `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📅 Lịch phỏng vấn sắp tới</h3>
            <a href="#/interviews" class="card-link">Xem tất cả →</a>
          </div>
          <div class="card-body">
            <div class="empty-state-compact">
              <span class="empty-state-icon">📅</span>
              <p>Không có lịch phỏng vấn sắp tới</p>
            </div>
          </div>
        </div>
      `;
    }

    const statusColorMap = {
      pending: 'badge--warning',
      confirmed: 'badge--success',
      scheduled: 'badge--info',
      interview_scheduled: 'badge--info',
      completed: 'badge--success',
      cancelled: 'badge--danger',
    };

    const rows = details.map(iv => `
      <tr class="dashboard-clickable-row" data-navigate="interviews/${esc(iv.id)}">
        <td class="td-nowrap">${esc(iv.dateTime)}</td>
        <td>${esc(truncate(iv.candidateName, 20))}</td>
        <td>${esc(truncate(iv.position, 20))}</td>
        <td>${esc(iv.round)}</td>
        <td>${esc(iv.type)}</td>
        <td><span class="badge ${statusColorMap[iv.statusRaw] || 'badge--secondary'}">${esc(iv.status)}</span></td>
      </tr>
    `).join('');

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📅 Lịch phỏng vấn sắp tới</h3>
          <a href="#/interviews" class="card-link">Xem tất cả →</a>
        </div>
        <div class="card-body card-body--no-padding">
          <div class="table-wrapper">
            <table class="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Ngày giờ</th>
                  <th>Ứng viên</th>
                  <th>Vị trí</th>
                  <th>Vòng</th>
                  <th>Hình thức</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderPendingApplications(details) {
    if (!details || details.length === 0) {
      return `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📋 Hồ sơ mới cần xử lý</h3>
            <a href="#/candidates" class="card-link">Xem tất cả →</a>
          </div>
          <div class="card-body">
            <div class="empty-state-compact">
              <span class="empty-state-icon">📋</span>
              <p>Không có hồ sơ mới cần xử lý</p>
            </div>
          </div>
        </div>
      `;
    }

    const rows = details.map(app => `
      <tr class="dashboard-clickable-row" data-navigate="candidates/${esc(app.candidateId)}">
        <td>${esc(truncate(app.candidateName, 20))}</td>
        <td>${esc(truncate(app.position, 20))}</td>
        <td class="td-nowrap">${esc(app.appliedDate)}</td>
        <td>${esc(app.source)}</td>
        <td>
          ${app.screeningScore !== null
            ? `<span class="score-badge">${app.screeningScore}đ</span>`
            : '<span class="text-muted">—</span>'}
        </td>
      </tr>
    `).join('');

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 Hồ sơ mới cần xử lý</h3>
          <a href="#/candidates" class="card-link">Xem tất cả →</a>
        </div>
        <div class="card-body card-body--no-padding">
          <div class="table-wrapper">
            <table class="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Ứng viên</th>
                  <th>Vị trí</th>
                  <th>Ngày ứng tuyển</th>
                  <th>Nguồn</th>
                  <th>Điểm sàng lọc</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboardStyles() {
    // Inject scoped styles for CSS-based charts if not already present
    if (document.getElementById('dashboard-module-styles')) return '';

    return `
      <style id="dashboard-module-styles">
        /* ═══ Dashboard Stats Grid ═══ */
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dashboard-stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .dashboard-stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dashboard-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-card__emoji {
          font-size: 24px;
          line-height: 1;
        }
        .stat-card__icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-card__info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stat-card__value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          font-family: 'Inter', sans-serif;
        }
        .stat-card__label {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ═══ Chart Grid ═══ */
        .dashboard-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .dashboard-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }
        .chart-card .card-header {
          padding: 16px 20px 0;
        }
        .chart-card .card-body {
          padding: 16px 20px 20px;
        }
        .chart-card .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          margin: 0;
        }

        /* ═══ Funnel Chart ═══ */
        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .funnel-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .funnel-label {
          width: 110px;
          flex-shrink: 0;
          font-size: 13px;
          color: #475569;
          text-align: right;
          white-space: nowrap;
        }
        .funnel-bar-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .funnel-bar {
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 10px;
          min-width: 36px;
          transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
        }
        .funnel-bar:hover {
          filter: brightness(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .funnel-bar-text {
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .funnel-pct {
          font-size: 12px;
          color: #94A3B8;
          white-space: nowrap;
          min-width: 36px;
        }

        /* ═══ Donut Chart ═══ */
        .donut-chart-container {
          display: flex;
          align-items: center;
          gap: 32px;
          justify-content: center;
        }
        @media (max-width: 640px) {
          .donut-chart-container {
            flex-direction: column;
            gap: 20px;
          }
        }
        .donut-chart {
          position: relative;
          width: 180px;
          height: 180px;
          flex-shrink: 0;
        }
        .donut-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
        }
        .donut-ring:hover {
          filter: brightness(1.05);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .donut-hole {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 8px rgba(0,0,0,0.05);
        }
        .donut-total-number {
          font-size: 28px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1;
        }
        .donut-total-label {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 2px;
        }

        .source-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .source-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
          cursor: default;
        }
        .source-legend-item:hover {
          background: #F1F5F9;
        }
        .source-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .source-legend-label {
          flex: 1;
          color: #475569;
          white-space: nowrap;
        }
        .source-legend-count {
          font-weight: 600;
          color: #1E293B;
          min-width: 24px;
          text-align: right;
        }
        .source-legend-pct {
          color: #94A3B8;
          font-size: 12px;
          min-width: 32px;
          text-align: right;
        }

        /* ═══ Two Column Section ═══ */
        .dashboard-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .dashboard-two-col {
            grid-template-columns: 1fr;
          }
        }
        .dashboard-two-col .card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .dashboard-two-col .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
        }
        .dashboard-two-col .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          margin: 0;
        }
        .card-link {
          font-size: 13px;
          color: #2563EB;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
          white-space: nowrap;
        }
        .card-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }
        .card-body--no-padding {
          padding: 0 !important;
        }

        /* ═══ Compact Table ═══ */
        .data-table--compact {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table--compact th {
          background: #F8FAFC;
          color: #64748B;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 14px;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid #E2E8F0;
        }
        .data-table--compact td {
          padding: 10px 14px;
          color: #334155;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }
        .data-table--compact tbody tr:last-child td {
          border-bottom: none;
        }

        .dashboard-clickable-row {
          cursor: pointer;
          transition: background 0.15s;
        }
        .dashboard-clickable-row:hover {
          background: #EFF6FF !important;
        }

        .td-nowrap {
          white-space: nowrap;
        }

        /* ═══ Badges ═══ */
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge--warning {
          background: #FEF3C7;
          color: #92400E;
        }
        .badge--success {
          background: #D1FAE5;
          color: #065F46;
        }
        .badge--info {
          background: #DBEAFE;
          color: #1E40AF;
        }
        .badge--danger {
          background: #FEE2E2;
          color: #991B1B;
        }
        .badge--secondary {
          background: #F1F5F9;
          color: #475569;
        }

        .score-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          background: #EFF6FF;
          color: #2563EB;
        }

        .text-muted {
          color: #94A3B8;
        }

        /* ═══ Empty States ═══ */
        .empty-state-compact {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          color: #94A3B8;
        }
        .empty-state-compact .empty-state-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .empty-state-compact p {
          margin: 0;
          font-size: 14px;
          color: #64748B;
        }

        .chart-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #94A3B8;
        }
        .chart-empty-state .chart-empty-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }
        .chart-empty-state p {
          margin: 0;
          font-size: 14px;
          color: #64748B;
        }

        /* ═══ Page Header ═══ */
        .dashboard-page-header {
          margin-bottom: 24px;
        }
        .dashboard-page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px 0;
        }
        .dashboard-page-header p {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        /* ═══ Responsive table overflow ═══ */
        .table-wrapper {
          overflow-x: auto;
        }
      </style>
    `;
  }

  // ─── Event Binding ───────────────────────────────────────────────────

  function attachEventListeners(container) {
    // Stat card clicks → navigate to relevant page
    container.querySelectorAll('.dashboard-stat-card[data-navigate]').forEach(card => {
      card.addEventListener('click', () => {
        const page = card.getAttribute('data-navigate');
        if (page && typeof Router !== 'undefined') {
          Router.navigate(page);
        } else if (page) {
          window.location.hash = '#/' + page;
        }
      });
    });

    // Table row clicks → navigate to detail
    container.querySelectorAll('.dashboard-clickable-row[data-navigate]').forEach(row => {
      row.addEventListener('click', () => {
        const path = row.getAttribute('data-navigate');
        if (path && typeof Router !== 'undefined') {
          Router.navigate(path);
        } else if (path) {
          window.location.hash = '#/' + path;
        }
      });
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────

  return {
    /**
     * Render the dashboard page into the given container element.
     * @param {HTMLElement} container - The DOM element to render into
     * @param {Object} [params] - Optional route params
     */
    render(container, params) {
      const user = getCurrentUser();
      if (!user) {
        container.innerHTML = `
          <div class="page-container" style="padding:40px; text-align:center; color:#64748B;">
            <p>Vui lòng đăng nhập để xem trang tổng quan.</p>
          </div>
        `;
        return;
      }

      // Compute all stats from store
      const stats = computeStats();

      const fullName = user.fullName || user.username || user.name || '';
      const greeting = truncate(fullName, 30);

      // Build HTML
      const html = `
        ${renderDashboardStyles()}

        <div class="page-container dashboard-page">
          <div class="dashboard-page-header">
            <h1>Tổng quan</h1>
            <p>Chào mừng trở lại, ${esc(greeting)}</p>
          </div>

          ${renderStatCards(stats)}

          <div class="dashboard-charts-grid chart-grid">
            ${renderFunnelChart(stats.funnel)}
            ${renderSourceChart(stats.sources)}
          </div>

          <div class="dashboard-two-col">
            ${renderUpcomingInterviews(stats.upcomingDetails)}
            ${renderPendingApplications(stats.pendingDetails)}
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Attach click handlers
      attachEventListeners(container);

      // Initialize Lucide icons if available
      requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      });
    },
  };
})();

// Export globally
window.DashboardPage = DashboardPage;
