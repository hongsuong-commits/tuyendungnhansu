/**
 * store.js - Single Source of Truth for SmartATS
 * Manages State, LocalStorage persistence, Mock Data, CV Parser & Screening Engine.
 */

const ATSStore = (() => {
  const STORAGE_KEY = 'smart_ats_store_v1';
  const CURRENT_USER_KEY = 'smart_ats_current_user';

  // ─────────────────────────────────────────────────────────────
  // Initial Mock Data (Realistic Vietnamese Data)
  // ─────────────────────────────────────────────────────────────
  const INITIAL_USERS = [
    {
      id: 'usr_director',
      username: 'director',
      password: '123456',
      fullName: 'Trần Đình Long',
      email: 'director@smartats.vn',
      phone: '0903123456',
      role: 'director',
      department: 'Ban Giám Đốc',
      title: 'Tổng Giám Đốc',
      status: 'active',
      avatar: 'TDL'
    },
    {
      id: 'usr_hr1',
      username: 'hr1',
      password: '123456',
      fullName: 'Nguyễn Thu Hà',
      email: 'ha.nguyen@smartats.vn',
      phone: '0912345678',
      role: 'hr',
      department: 'Phòng Nhân sự',
      title: 'Trưởng nhóm Tuyển dụng (Senior Talent Acquisition)',
      status: 'active',
      avatar: 'NTH'
    },
    {
      id: 'usr_head_it',
      username: 'head_it',
      password: '123456',
      fullName: 'Lê Văn Hùng',
      email: 'hung.le@smartats.vn',
      phone: '0987654321',
      role: 'department_head',
      department: 'Công nghệ thông tin',
      title: 'Giám đốc Công nghệ (CTO)',
      status: 'active',
      avatar: 'LVH'
    },
    {
      id: 'usr_head_sales',
      username: 'head_sales',
      password: '123456',
      fullName: 'Phạm Thị Mai',
      email: 'mai.pham@smartats.vn',
      phone: '0934567890',
      role: 'department_head',
      department: 'Kinh doanh & Phát triển',
      title: 'Trưởng phòng Kinh doanh Toàn quốc',
      status: 'active',
      avatar: 'PTM'
    }
  ];

  const DEPARTMENTS = [
    'Công nghệ thông tin',
    'Kinh doanh & Phát triển',
    'Marketing & Truyền thông',
    'Tài chính - Kế toán',
    'Phòng Nhân sự',
    'Vận hành & Dịch vụ Khách hàng'
  ];

  const INITIAL_REQUISITIONS = [
    {
      id: 'req_1',
      code: 'YCTD-2026-001',
      title: 'Senior Frontend Developer (React / TypeScript)',
      department: 'Công nghệ thông tin',
      quantity: 2,
      reason: 'Mở rộng dự án phát triển hệ thống ERP thế hệ mới cho doanh nghiệp',
      description: 'Chịu trách nhiệm thiết kế kiến trúc UI/UX phía client, xây dựng các module phức tạp sử dụng React 18, Next.js và TypeScript. Phối hợp chặt chẽ với đội Backend và UI Designer.',
      requirements: '- Tối thiểu 3 năm kinh nghiệm lập trình React.js, TypeScript.\n- Thành thạo Redux Toolkit / Zustand, Tailwind CSS.\n- Có hiểu biết về CI/CD, hiệu năng web và responsive design.\n- Tốt nghiệp Đại học chuyên ngành CNTT hoặc liên quan.',
      skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Redux', 'Next.js'],
      education: 'Đại học',
      minExperience: 3,
      salary: '28.000.000 - 40.000.000 VNĐ',
      workType: 'Toàn thời gian',
      location: 'Hà Nội (Hybrid)',
      startDate: '2026-10-01',
      deadline: '2026-11-20',
      creatorId: 'usr_head_it',
      creatorName: 'Lê Văn Hùng',
      status: 'recruiting',
      createdAt: '2026-10-02T08:30:00Z',
      approvalHistory: [
        { status: 'pending', by: 'Lê Văn Hùng', date: '2026-10-02T08:30:00Z', note: 'Gửi yêu cầu tuyển dụng mới' },
        { status: 'approved', by: 'Trần Đình Long', date: '2026-10-03T10:15:00Z', note: 'Phê duyệt ngân sách tuyển dụng' },
        { status: 'recruiting', by: 'Nguyễn Thu Hà', date: '2026-10-04T09:00:00Z', note: 'Đã xuất bản tin tuyển dụng' }
      ]
    },
    {
      id: 'req_2',
      code: 'YCTD-2026-002',
      title: 'Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)',
      department: 'Kinh doanh & Phát triển',
      quantity: 3,
      reason: 'Đẩy mạnh doanh số quý 4 và khai thác thị trường khách hàng khối sản xuất',
      description: 'Tìm kiếm, tiếp cận và đàm phán hợp đồng cung cấp giải pháp chuyển đổi số cho các doanh nghiệp vừa và lớn. Tham gia hội thảo, triển lãm ngành.',
      requirements: '- Tối thiểu 2 năm kinh nghiệm kinh doanh B2B ngành phần mềm, dịch vụ CNTT.\n- Kỹ năng đàm phán, thuyết trình tốt.\n- Tốt nghiệp Đại học khối Kinh tế, QTKD hoặc Ngoại thương.\n- Tiếng Anh giao tiếp tốt là lợi thế.',
      skills: ['B2B Sales', 'Đàm phán', 'Kỹ năng thuyết trình', 'CRM', 'Quản lý khách hàng'],
      education: 'Đại học',
      minExperience: 2,
      salary: '15.000.000 - 25.000.000 VNĐ + Hoa hồng',
      workType: 'Toàn thời gian',
      location: 'TP. Hồ Chí Minh',
      startDate: '2026-10-05',
      deadline: '2026-11-30',
      creatorId: 'usr_head_sales',
      creatorName: 'Phạm Thị Mai',
      status: 'recruiting',
      createdAt: '2026-10-05T09:00:00Z',
      approvalHistory: [
        { status: 'pending', by: 'Phạm Thị Mai', date: '2026-10-05T09:00:00Z', note: 'Nhu cầu mở rộng kênh bán hàng' },
        { status: 'approved', by: 'Trần Đình Long', date: '2026-10-06T14:20:00Z', note: 'Đồng ý duyệt số lượng 3 chỉ tiêu' },
        { status: 'recruiting', by: 'Nguyễn Thu Hà', date: '2026-10-07T08:30:00Z', note: 'Đang triển khai đăng tuyển' }
      ]
    },
    {
      id: 'req_3',
      code: 'YCTD-2026-003',
      title: 'DevOps / Cloud Engineer (AWS / Kubernetes)',
      department: 'Công nghệ thông tin',
      quantity: 1,
      reason: 'Tối ưu hoá hạ tầng đám mây và chuẩn hóa hệ thống CI/CD tự động',
      description: 'Quản trị hạ tầng AWS, quản lý cụm Kubernetes (EKS), xây dựng các đường ống triển khai tự động (GitLab CI/CD, Terraform). Giám sát độ sẵn sàng 99.99%.',
      requirements: '- Tối thiểu 3 năm kinh nghiệm vận hành DevOps trên AWS.\n- Thành thạo Docker, Kubernetes, Terraform, Prometheus/Grafana.\n- Có chứng chỉ AWS Solutions Architect hoặc CKA là ưu thế lớn.',
      skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Linux'],
      education: 'Đại học',
      minExperience: 3,
      salary: '35.000.000 - 50.000.000 VNĐ',
      workType: 'Toàn thời gian',
      location: 'Hà Nội',
      startDate: '2026-10-10',
      deadline: '2026-11-25',
      creatorId: 'usr_head_it',
      creatorName: 'Lê Văn Hùng',
      status: 'recruiting',
      createdAt: '2026-10-10T10:00:00Z',
      approvalHistory: [
        { status: 'pending', by: 'Lê Văn Hùng', date: '2026-10-10T10:00:00Z', note: 'Cần bổ sung chuyên gia hạ tầng cloud' },
        { status: 'approved', by: 'Trần Đình Long', date: '2026-10-11T11:00:00Z', note: 'Duyệt tuyển dụng' },
        { status: 'recruiting', by: 'Nguyễn Thu Hà', date: '2026-10-12T09:30:00Z', note: 'Đã đăng tin tuyển dụng' }
      ]
    },
    {
      id: 'req_4',
      code: 'YCTD-2026-004',
      title: 'Chuyên viên Tuyển dụng & Đào tạo (HR Recruitment Specialist)',
      department: 'Phòng Nhân sự',
      quantity: 1,
      reason: 'Bổ sung nhân sự quản lý nguồn ứng viên và điều phối đào tạo hội nhập',
      description: 'Lên kế hoạch tìm kiếm ứng viên qua các kênh, quản trị hệ thống ATS, lọc hồ sơ, phỏng vấn sơ bộ và tổ chức chương trình đào tạo định hướng nhân viên mới.',
      requirements: '- Tối thiểu 2 năm kinh nghiệm tuyển dụng trong doanh nghiệp quy mô 100+ nhân sự.\n- Kỹ năng giao tiếp xuất sắc, am hiểu luật lao động.\n- Tốt nghiệp Đại học khối Quản trị Nhân lực, Luật, Kinh tế.',
      skills: ['Tuyển dụng', 'Sàng lọc CV', 'Phỏng vấn', 'Đào tạo nội bộ', 'Luật lao động'],
      education: 'Đại học',
      minExperience: 2,
      salary: '14.000.000 - 20.000.000 VNĐ',
      workType: 'Toàn thời gian',
      location: 'Hà Nội',
      startDate: '2026-10-12',
      deadline: '2026-11-15',
      creatorId: 'usr_hr1',
      creatorName: 'Nguyễn Thu Hà',
      status: 'approved',
      createdAt: '2026-10-12T14:00:00Z',
      approvalHistory: [
        { status: 'pending', by: 'Nguyễn Thu Hà', date: '2026-10-12T14:00:00Z', note: 'Tạo yêu cầu nhân sự phòng HR' },
        { status: 'approved', by: 'Trần Đình Long', date: '2026-10-13T16:00:00Z', note: 'Đã duyệt yêu cầu' }
      ]
    },
    {
      id: 'req_5',
      code: 'YCTD-2026-005',
      title: 'Kế toán Tổng hợp kiêm Thuế (General Accountant)',
      department: 'Tài chính - Kế toán',
      quantity: 1,
      reason: 'Thay thế nhân sự nghỉ thai sản và hỗ trợ lập báo cáo kiểm toán năm 2026',
      description: 'Lập báo cáo tài chính định kỳ, kê khai thuế GTGT, TNCN, TNDN, quyết toán với cơ quan thuế. Kiểm tra chứng từ kế toán và đối chiếu công nợ.',
      requirements: '- Tối thiểu 3 năm kinh nghiệm kế toán tổng hợp.\n- Thành thạo phần mềm MISA / Bravo, Excel nâng cao.\n- Tốt nghiệp Đại học chuyên ngành Tài chính Kế toán, Kiểm toán.',
      skills: ['Kế toán tổng hợp', 'Kê khai thuế', 'MISA', 'Báo cáo tài chính', 'Excel'],
      education: 'Đại học',
      minExperience: 3,
      salary: '16.000.000 - 22.000.000 VNĐ',
      workType: 'Toàn thời gian',
      location: 'Hà Nội',
      startDate: '2026-10-15',
      deadline: '2026-11-28',
      creatorId: 'usr_director',
      creatorName: 'Trần Đình Long',
      status: 'pending',
      createdAt: '2026-10-15T09:00:00Z',
      approvalHistory: [
        { status: 'pending', by: 'Trần Đình Long', date: '2026-10-15T09:00:00Z', note: 'Đang chờ rà soát định biên' }
      ]
    },
    {
      id: 'req_6',
      code: 'YCTD-2026-006',
      title: 'UI/UX Product Designer',
      department: 'Công nghệ thông tin',
      quantity: 1,
      reason: 'Thiết kế giao diện sản phẩm SaaS mới',
      description: 'Xây dựng Design System, Wireframes, High-fidelity prototype trên Figma, thực hiện Usability Testing và bàn giao thiết kế cho đội Front-end.',
      requirements: '- Tối thiểu 2 năm kinh nghiệm UI/UX trên Figma.\n- Có portfolio sản phẩm webapp SaaS thực tế.\n- Tư duy kiến trúc thông tin tốt.',
      skills: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Research'],
      education: 'Đại học / Cao đẳng',
      minExperience: 2,
      salary: '20.000.000 - 30.000.000 VNĐ',
      workType: 'Toàn thời gian',
      location: 'Hà Nội',
      startDate: '2026-09-01',
      deadline: '2026-10-20',
      creatorId: 'usr_head_it',
      creatorName: 'Lê Văn Hùng',
      status: 'closed',
      createdAt: '2026-09-01T10:00:00Z',
      approvalHistory: [
        { status: 'approved', by: 'Trần Đình Long', date: '2026-09-02T10:00:00Z', note: 'Đã duyệt' },
        { status: 'closed', by: 'Nguyễn Thu Hà', date: '2026-10-20T17:00:00Z', note: 'Đã tuyển đủ nhân sự' }
      ]
    }
  ];

  const INITIAL_POSTINGS = [
    {
      id: 'post_1',
      requisitionId: 'req_1',
      code: 'TND-2026-001',
      title: 'Tuyển dụng Senior Frontend Developer (React / TypeScript) - Lương lên tới 40M',
      department: 'Công nghệ thông tin',
      salary: '28 - 40 triệu VNĐ',
      location: 'Hà Nội (Hybrid: 2 ngày WFH)',
      workType: 'Toàn thời gian',
      deadline: '2026-11-20',
      status: 'published',
      publishedAt: '2026-10-04T09:00:00Z',
      views: 524,
      applicantsCount: 6,
      channels: {
        website: { active: true, url: '#/portal/job/post_1', syncStatus: 'Đã đồng bộ', applicants: 3 },
        topcv: { active: true, url: 'https://topcv.vn/demo-job-1', syncStatus: 'Đã đồng bộ', applicants: 2 },
        linkedin: { active: true, url: 'https://linkedin.com/jobs/demo-1', syncStatus: 'Đã đồng bộ', applicants: 1 },
        vietnamworks: { active: false, url: '', syncStatus: 'Chưa cấu hình', applicants: 0 }
      },
      description: 'Tham gia xây dựng nền tảng cốt lõi với hàng trăm nghìn người dùng doanh nghiệp. Môi trường công nghệ hiện đại, trang thiết bị Macbook Pro M-series, review lương 2 lần/năm.',
      requirements: '- Tối thiểu 3 năm kinh nghiệm thực chiến với React.js & TypeScript\n- Làm chủ State Management (Redux Toolkit, Zustand)\n- Hiểu sâu về tối ưu hoá hiệu năng Web Vitals\n- Kỹ năng làm việc nhóm, viết code sạch (Clean Code), Unit Test',
      benefits: '- Thưởng tháng 13 + thưởng hiệu quả kinh doanh dự án (2-4 tháng lương)\n- Bảo hiểm sức khỏe PVI cao cấp dành riêng cho CBNV\n- Nghỉ phép 14 ngày/năm, du lịch nghỉ dưỡng chuẩn 5 sao hàng năm\n- Được tài trợ 100% chi phí thi các chứng chỉ công nghệ'
    },
    {
      id: 'post_2',
      requisitionId: 'req_2',
      code: 'TND-2026-002',
      title: 'Chuyên viên Kinh doanh B2B Giải pháp Doanh nghiệp (Thu nhập 25M - 50M+)',
      department: 'Kinh doanh & Phát triển',
      salary: '15 - 25 triệu VNĐ + Hoa hồng',
      location: 'TP. Hồ Chí Minh',
      workType: 'Toàn thời gian',
      deadline: '2026-11-30',
      status: 'published',
      publishedAt: '2026-10-07T08:30:00Z',
      views: 412,
      applicantsCount: 5,
      channels: {
        website: { active: true, url: '#/portal/job/post_2', syncStatus: 'Đã đồng bộ', applicants: 2 },
        topcv: { active: true, url: 'https://topcv.vn/demo-job-2', syncStatus: 'Đã đồng bộ', applicants: 2 },
        linkedin: { active: true, url: 'https://linkedin.com/jobs/demo-2', syncStatus: 'Đã đồng bộ', applicants: 1 },
        vietnamworks: { active: true, url: 'https://vietnamworks.com/demo-2', syncStatus: 'Đã đồng bộ', applicants: 0 }
      },
      description: 'Chủ động phát triển danh mục khách hàng doanh nghiệp thuộc nhóm tài chính, bán lẻ và sản xuất. Tư vấn các gói giải pháp phần mềm quản trị và chuyển đổi số.',
      requirements: '- Tối thiểu 2 năm kinh nghiệm bán hàng B2B giải pháp / dịch vụ\n- Khả năng giao tiếp thuyết phục, xử lý tình huống linh hoạt\n- Tinh thần chủ động, chịu được áp lực doanh số cao',
      benefits: '- Lương cứng cạnh tranh + % hoa hồng theo doanh số hợp đồng không giới hạn\n- Phụ cấp điện thoại, xăng xe, tiếp khách\n- Cơ hội thăng tiến lên Trưởng nhóm kinh doanh sau 6 tháng'
    },
    {
      id: 'post_3',
      requisitionId: 'req_3',
      code: 'TND-2026-003',
      title: 'DevOps / Cloud Engineer (AWS, K8s, CI/CD) - Lương up to 50M',
      department: 'Công nghệ thông tin',
      salary: '35 - 50 triệu VNĐ',
      location: 'Hà Nội',
      workType: 'Toàn thời gian',
      deadline: '2026-11-25',
      status: 'published',
      publishedAt: '2026-10-12T09:30:00Z',
      views: 310,
      applicantsCount: 4,
      channels: {
        website: { active: true, url: '#/portal/job/post_3', syncStatus: 'Đã đồng bộ', applicants: 2 },
        topcv: { active: false, url: '', syncStatus: 'Chưa kết nối', applicants: 0 },
        linkedin: { active: true, url: 'https://linkedin.com/jobs/demo-3', syncStatus: 'Đã đồng bộ', applicants: 2 },
        vietnamworks: { active: false, url: '', syncStatus: 'Chưa cấu hình', applicants: 0 }
      },
      description: 'Phụ trách thiết kế và vận hành hệ thống đám mây AWS với độ tin cậy cao, tự động hóa toàn bộ quy trình build/deploy hệ thống qua CI/CD pipeline.',
      requirements: '- Từ 3 năm kinh nghiệm quản trị AWS & Kubernetes thực tế\n- Thành thạo IaC với Terraform, quản lý cấu hình Ansible\n- Kinh nghiệm thiết lập Monitoring/Logging với ELK / Prometheus Grafana',
      benefits: '- Môi trường làm việc quốc tế, công nghệ tiên tiến\n- Cơ hội làm việc trực tiếp với các chuyên gia Cloud hàng đầu\n- Được cấp Macbook Pro M3 và màn hình 4K'
    }
  ];

  const INITIAL_CANDIDATES = [
    {
      id: 'cand_1',
      fullName: 'Vũ Hoàng Nam',
      email: 'nam.vu@gmail.com',
      phone: '0978123456',
      gender: 'Nam',
      dob: '1996-05-14',
      address: 'Cầu Giấy, Hà Nội',
      education: 'Đại học Bách Khoa Hà Nội - Kỹ thuật Phần mềm (Khá)',
      experienceYears: 4.5,
      skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Redux', 'Next.js', 'Node.js', 'Git', 'HTML/CSS'],
      certifications: ['AWS Certified Cloud Practitioner', 'IELTS 6.5'],
      currentCompany: 'FPT Software',
      currentTitle: 'Senior Frontend Developer',
      rawResumeText: `HỌ VÀ TÊN: VŨ HOÀNG NAM
Email: nam.vu@gmail.com - SĐT: 0978123456 - Địa chỉ: Cầu Giấy, Hà Nội
HỌC VẤN:
- Cử nhân Kỹ sư Kỹ thuật Phần mềm - Đại học Bách Khoa Hà Nội (2014 - 2019)
KINH NGHIỆM LÀM VIỆC:
- 2021 - Nay: Senior Frontend Developer tại FPT Software (3.5 năm)
  + Phát triển kiến trúc webapp SaaS trên nền tảng React 18, TypeScript, Tailwind CSS.
  + Tối ưu Core Web Vitals, giảm bundle size 35%, cải thiện LCP từ 3.2s xuống 1.4s.
  + Áp dụng Zustand và React Query để đồng bộ cache dữ liệu phía client.
- 2019 - 2021: Frontend Developer tại VNG Corporation (2 năm)
  + Xây dựng giao diện tính năng thanh toán với JavaScript, ReactJS, Redux.
KỸ NĂNG CHUYÊN MÔN:
- React, TypeScript, Next.js, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Redux Toolkit, RESTful API, Git, CI/CD cơ bản.
CHỨNG CHỈ:
- AWS Certified Cloud Practitioner (2023)
- IELTS 6.5`
    },
    {
      id: 'cand_2',
      fullName: 'Trần Minh Anh',
      email: 'minhanh.tran@outlook.com',
      phone: '0912456789',
      gender: 'Nữ',
      dob: '1998-08-22',
      address: 'Đống Đa, Hà Nội',
      education: 'Đại học Công nghệ - ĐHQGHN - Công nghệ thông tin (Giỏi)',
      experienceYears: 3,
      skills: ['React', 'JavaScript', 'HTML/CSS', 'Vue.js', 'Git', 'Bootstrap'],
      certifications: ['TOEIC 780'],
      currentCompany: 'VCCorp',
      currentTitle: 'Frontend Developer',
      rawResumeText: `TRẦN MINH ANH
Email: minhanh.tran@outlook.com | SĐT: 0912456789 | Đống Đa, Hà Nội
HỌC VẤN:
- Đại học Công nghệ - ĐHQGHN (2016 - 2020) - Tốt nghiệp loại Giỏi
KINH NGHIỆM:
- 2021 - Hiện tại: Frontend Developer tại VCCorp (3 năm kinh nghiệm)
  + Phát triển các portal nội bộ với ReactJS, Vue.js, JavaScript, HTML5/CSS3.
  + Làm việc với RESTful API, Git version control.
KỸ NĂNG:
- React, JavaScript, Vue.js, HTML/CSS, Git, Responsive Web Design.`
    },
    {
      id: 'cand_3',
      fullName: 'Nguyễn Đăng Khôi',
      email: 'khoi.nguyen99@gmail.com',
      phone: '0983112233',
      gender: 'Nam',
      dob: '1999-11-03',
      address: 'Nam Từ Liêm, Hà Nội',
      education: 'Cao đẳng FPT Polytechnic - Lập trình Web',
      experienceYears: 1.5,
      skills: ['React', 'JavaScript', 'HTML/CSS', 'Node.js'],
      certifications: [],
      currentCompany: 'Startup Tech',
      currentTitle: 'Junior Web Developer',
      rawResumeText: `NGUYỄN ĐĂNG KHÔI
Email: khoi.nguyen99@gmail.com - 0983112233
Học vấn: Cao đẳng FPT Polytechnic
Kinh nghiệm: 1.5 năm làm Junior Web Developer (React, JavaScript, Node.js)
Kỹ năng: React cơ bản, JavaScript, HTML, CSS.`
    },
    {
      id: 'cand_4',
      fullName: 'Đoàn Quang Huy',
      email: 'huy.dq@gmail.com',
      phone: '0909678123',
      gender: 'Nam',
      dob: '1993-02-18',
      address: 'Quận 1, TP. Hồ Chí Minh',
      education: 'Đại học Ngoại Thương TP.HCM - Quản trị Kinh doanh Quốc tế',
      experienceYears: 5,
      skills: ['B2B Sales', 'Đàm phán', 'Kỹ năng thuyết trình', 'CRM', 'Quản lý khách hàng', 'Tiếng Anh'],
      certifications: ['HubSpot Inbound Sales Certified', 'IELTS 7.5'],
      currentCompany: 'MISA Corporation',
      currentTitle: 'Senior B2B Account Executive',
      rawResumeText: `ĐOÀN QUANG HUY
Email: huy.dq@gmail.com | Điện thoại: 0909678123 | Quận 1, TP. HCM
HỌC VẤN:
- Cử nhân Quản trị Kinh doanh Quốc tế - Đại học Ngoại Thương CS2 (2011 - 2015)
KINH NGHIỆM:
- 2021 - Nay: Senior B2B Account Executive tại MISA Corp (3.5 năm)
  + Đạt 140% KPI doanh số năm 2024 và 2025 với dòng sản phẩm ERP & Kế toán doanh nghiệp.
  + Đàm phán và chốt hợp đồng với hơn 45 khách hàng doanh nghiệp sản xuất và thương mại.
  + Sử dụng thành thạo Salesforce, HubSpot CRM.
- 2018 - 2021: B2B Sales Specialist tại CMC Telecom (3 năm)
  + Bán các giải pháp kênh truyền Internet cáp quang và trung tâm dữ liệu.
KỸ NĂNG:
- B2B Sales, Đàm phán, Kỹ năng thuyết trình, Quản lý tài khoản khách hàng (KAM), CRM, Tiếng Anh thương mại lưu loát.`
    },
    {
      id: 'cand_5',
      fullName: 'Hoàng Bích Thủy',
      email: 'thuy.hoangbich@yahoo.com',
      phone: '0938889911',
      gender: 'Nữ',
      dob: '1997-09-12',
      address: 'Quận 3, TP. Hồ Chí Minh',
      education: 'Đại học Kinh Tế TP.HCM - Marketing & Bán hàng',
      experienceYears: 2.5,
      skills: ['B2B Sales', 'Kỹ năng thuyết trình', 'CRM', 'Chăm sóc khách hàng'],
      certifications: ['TOEIC 700'],
      currentCompany: 'Haravan',
      currentTitle: 'B2B Sales Consultant',
      rawResumeText: `HOÀNG BÍCH THỦY
Email: thuy.hoangbich@yahoo.com - 0938889911 - TP. Hồ Chí Minh
Học vấn: Đại học Kinh Tế TP.HCM (UEH) - Marketing
Kinh nghiệm: 2.5 năm tư vấn giải pháp Omni-channel B2B tại Haravan.
Kỹ năng: B2B Sales, CRM, thuyết trình sản phẩm, đàm phán hợp đồng.`
    },
    {
      id: 'cand_6',
      fullName: 'Phạm Đức Trung',
      email: 'trung.ducpham@gmail.com',
      phone: '0989334455',
      gender: 'Nam',
      dob: '1994-07-30',
      address: 'Cầu Giấy, Hà Nội',
      education: 'Học viện Bưu chính Viễn thông (PTIT) - An toàn thông tin',
      experienceYears: 4,
      skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Linux', 'Ansible', 'Python'],
      certifications: ['AWS Certified Solutions Architect Associate', 'Certified Kubernetes Administrator (CKA)'],
      currentCompany: 'Viettel Telecom',
      currentTitle: 'DevOps Specialist',
      rawResumeText: `PHẠM ĐỨC TRUNG
Email: trung.ducpham@gmail.com | Phone: 0989334455 | Hà Nội
HỌC VẤN:
- Cử nhân An toàn Thông tin - Học viện Công nghệ Bưu chính Viễn thông (2012 - 2017)
KINH NGHIỆM:
- 2022 - Nay: DevOps Engineer tại Viettel Telecom (2.5 năm)
  + Quản trị hơn 20 cụm Kubernetes (EKS & on-premise) phục vụ microservices.
  + Xây dựng hạ tầng tự động hóa hoàn toàn với Terraform và Ansible trên AWS.
  + Thiết lập đường ống CI/CD tự động bằng GitLab CI và ArgoCD.
- 2020 - 2022: Cloud System Administrator tại Viettel IDC (2 năm)
  + Quản trị hạ tầng máy chủ Linux CentOS/Ubuntu, Docker containers.
KỸ NĂNG:
- AWS, Kubernetes (K8s), Docker, Terraform, CI/CD (GitLab, Jenkins), Linux, Shell Scripting, Python, Prometheus/Grafana.
CHỨNG CHỈ:
- CKA (Certified Kubernetes Administrator) - 2023
- AWS Solutions Architect Associate - 2024`
    },
    {
      id: 'cand_7',
      fullName: 'Lê Thanh Vân',
      email: 'van.lethanh@gmail.com',
      phone: '0977221100',
      gender: 'Nữ',
      dob: '1995-12-05',
      address: 'Thanh Xuân, Hà Nội',
      education: 'Đại học Kinh Tế Quốc Dân - Quản trị Nhân lực (Xuất sắc)',
      experienceYears: 3.5,
      skills: ['Tuyển dụng', 'Sàng lọc CV', 'Phỏng vấn', 'Đào tạo nội bộ', 'Luật lao động', 'Onboarding'],
      certifications: ['SHRM-CP Candidate'],
      currentCompany: 'Sun Asterisk',
      currentTitle: 'Senior Talent Acquisition Specialist',
      rawResumeText: `LÊ THANH VÂN
Email: van.lethanh@gmail.com | SĐT: 0977221100 | Hà Nội
HỌC VẤN:
- Đại học Kinh Tế Quốc Dân (NEU) - Chuyên ngành Quản trị Nhân lực - Tốt nghiệp Xuất sắc (2013 - 2017)
KINH NGHIỆM:
- 2022 - Nay: Talent Acquisition Executive tại Sun Asterisk (2.5 năm)
  + Tuyển dụng hơn 80 kỹ sư phần mềm chất lượng cao mỗi năm cho các dự án Offshore.
  + Xây dựng bộ tiêu chuẩn đánh giá năng lực và quy trình phỏng vấn theo phương pháp STAR.
  + Am hiểu sâu sắc Luật Lao động Việt Nam và chính sách đãi ngộ nhân tài.
- 2020 - 2022: HR Specialist tại Tập đoàn Kangaroo (2 năm)
KỸ NĂNG:
- Tuyển dụng nhân sự, Sàng lọc hồ sơ, Phỏng vấn hành vi, Đào tạo nội bộ, Luật lao động.`
    },
    {
      id: 'cand_8',
      fullName: 'Bùi Gia Huy',
      email: 'huy.bg@hotmail.com',
      phone: '0944556677',
      gender: 'Nam',
      dob: '1997-04-10',
      address: 'Hai Bà Trưng, Hà Nội',
      education: 'Đại học Bách Khoa Hà Nội - Hệ thống Thông tin',
      experienceYears: 2,
      skills: ['Docker', 'Linux', 'Git', 'CI/CD', 'Bash'],
      certifications: [],
      currentCompany: 'Công ty Cổ phần Giải pháp Số',
      currentTitle: 'Junior System Admin',
      rawResumeText: `BÙI GIA HUY
Email: huy.bg@hotmail.com | SĐT: 0944556677 | Hà Nội
Học vấn: Đại học Bách Khoa Hà Nội (2015 - 2020)
Kinh nghiệm: 2 năm làm Junior System Admin (Linux, Docker, quản trị máy chủ, Git).
Kỹ năng: Linux, Docker, Scripting Bash, Git. Chưa có chứng chỉ AWS.`
    }
  ];

  const INITIAL_APPLICATIONS = [
    {
      id: 'app_1',
      candidateId: 'cand_1',
      candidateName: 'Vũ Hoàng Nam',
      requisitionId: 'req_1',
      postingId: 'post_1',
      positionTitle: 'Senior Frontend Developer (React / TypeScript)',
      source: 'website',
      appliedDate: '2026-10-06T10:15:00Z',
      status: 'interview_scheduled',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 92,
      screeningResult: 'pass',
      screeningDetails: {
        score: 92,
        classification: 'pass',
        summary: 'Hồ sơ xuất sắc, đáp ứng toàn diện cả kỹ năng bắt buộc và số năm kinh nghiệm.',
        metCriteria: [
          'Kỹ năng bắt buộc: React, TypeScript, JavaScript, Tailwind CSS (Đạt 100%)',
          'Kinh nghiệm: 4.5 năm (Yêu cầu tối thiểu 3 năm - Vượt yêu cầu)',
          'Học vấn: Đại học Bách Khoa Hà Nội (Đạt yêu cầu bằng cấp)',
          'Kỹ năng ưu tiên: Redux Toolkit, Next.js, Git (Đạt)'
        ],
        unmetCriteria: [],
        missingInfo: [],
        extractedData: {
          name: 'Vũ Hoàng Nam',
          email: 'nam.vu@gmail.com',
          phone: '0978123456',
          experienceYears: 4.5,
          education: 'Đại học Bách Khoa Hà Nội',
          skillsCount: 9
        },
        processedAt: '2026-10-06T10:16:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'Hệ thống ATS', timestamp: '2026-10-06T10:15:00Z', note: 'Ứng viên nộp hồ sơ từ Cổng tuyển dụng website' },
        { status: 'passed_screening', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-07T09:30:00Z', note: 'AI sàng lọc 92đ - Duyệt hồ sơ vào vòng phỏng vấn' },
        { status: 'interview_scheduled', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-08T14:00:00Z', note: 'Đã lên lịch phỏng vấn Vòng 2 chuyên môn' }
      ],
      internalNotes: [
        { author: 'Nguyễn Thu Hà', timestamp: '2026-10-07T09:35:00Z', content: 'Ứng viên có profile rất tốt, đã phỏng vấn sơ loại qua điện thoại: thái độ cầu tiến, tiếng Anh khá.' }
      ]
    },
    {
      id: 'app_2',
      candidateId: 'cand_2',
      candidateName: 'Trần Minh Anh',
      requisitionId: 'req_1',
      postingId: 'post_1',
      positionTitle: 'Senior Frontend Developer (React / TypeScript)',
      source: 'topcv',
      appliedDate: '2026-10-08T11:20:00Z',
      status: 'pending_review',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 78,
      screeningResult: 'manual_check',
      screeningDetails: {
        score: 78,
        classification: 'manual_check',
        summary: 'Đạt yêu cầu học vấn và React, nhưng trong CV chưa đề cập rõ kinh nghiệm với TypeScript.',
        metCriteria: [
          'Kỹ năng: React, JavaScript, HTML/CSS (Đạt)',
          'Kinh nghiệm: 3 năm (Đạt tối thiểu)',
          'Học vấn: Đại học Công nghệ - ĐHQGHN loại Giỏi (Đạt)'
        ],
        unmetCriteria: [
          'Chưa xác nhận kinh nghiệm thực tế với TypeScript'
        ],
        missingInfo: [
          'Mức độ thành thạo TypeScript và các thư viện quản lý State nâng cao'
        ],
        extractedData: {
          name: 'Trần Minh Anh',
          email: 'minhanh.tran@outlook.com',
          phone: '0912456789',
          experienceYears: 3,
          education: 'Đại học Công nghệ - ĐHQGHN',
          skillsCount: 6
        },
        processedAt: '2026-10-08T11:22:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'TopCV Sync', timestamp: '2026-10-08T11:20:00Z', note: 'Nhận hồ sơ đồng bộ từ nguồn TopCV' }
      ],
      internalNotes: []
    },
    {
      id: 'app_3',
      candidateId: 'cand_3',
      candidateName: 'Nguyễn Đăng Khôi',
      requisitionId: 'req_1',
      postingId: 'post_1',
      positionTitle: 'Senior Frontend Developer (React / TypeScript)',
      source: 'topcv',
      appliedDate: '2026-10-09T14:40:00Z',
      status: 'rejected',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 42,
      screeningResult: 'fail',
      screeningDetails: {
        score: 42,
        classification: 'fail',
        summary: 'Không đáp ứng số năm kinh nghiệm tối thiểu cho vị trí Senior (chỉ có 1.5 năm / yêu cầu 3 năm) và thiếu TypeScript.',
        metCriteria: [
          'Kỹ năng: React cơ bản, JavaScript (Đạt 1 phần)'
        ],
        unmetCriteria: [
          'Kinh nghiệm thực tế: 1.5 năm (Thiếu so với yêu cầu Senior 3 năm)',
          'Không có kinh nghiệm TypeScript',
          'Bằng cấp: Cao đẳng (Yêu cầu vị trí: Đại học)'
        ],
        missingInfo: [],
        extractedData: {
          name: 'Nguyễn Đăng Khôi',
          email: 'khoi.nguyen99@gmail.com',
          phone: '0983112233',
          experienceYears: 1.5,
          education: 'Cao đẳng FPT Polytechnic',
          skillsCount: 4
        },
        processedAt: '2026-10-09T14:42:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'TopCV Sync', timestamp: '2026-10-09T14:40:00Z', note: 'Hồ sơ tiếp nhận' },
        { status: 'rejected', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-10T09:00:00Z', note: 'Không đạt điều kiện thâm niên vị trí Senior' }
      ],
      internalNotes: [
        { author: 'Nguyễn Thu Hà', timestamp: '2026-10-10T09:02:00Z', content: 'Lưu CV vào talent pool cho các đợt tuyển dụng Junior trong tương lai.' }
      ]
    },
    {
      id: 'app_4',
      candidateId: 'cand_4',
      candidateName: 'Đoàn Quang Huy',
      requisitionId: 'req_2',
      postingId: 'post_2',
      positionTitle: 'Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)',
      source: 'linkedin',
      appliedDate: '2026-10-10T16:00:00Z',
      status: 'proposed',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 95,
      screeningResult: 'pass',
      screeningDetails: {
        score: 95,
        classification: 'pass',
        summary: 'Ứng viên cực kỳ nổi bật, 5 năm kinh nghiệm B2B phần mềm ERP, doanh số vượt trội và tiếng Anh lưu loát.',
        metCriteria: [
          'Kinh nghiệm: 5 năm kinh nghiệm B2B Sales (Yêu cầu 2 năm)',
          'Học vấn: Cử nhân Đại học Ngoại Thương (Đạt)',
          'Kỹ năng: B2B Sales, Đàm phán, Kỹ năng thuyết trình, CRM (Đạt 100%)',
          'Chứng chỉ: IELTS 7.5, HubSpot Sales (Đạt)'
        ],
        unmetCriteria: [],
        missingInfo: [],
        extractedData: {
          name: 'Đoàn Quang Huy',
          email: 'huy.dq@gmail.com',
          phone: '0909678123',
          experienceYears: 5,
          education: 'Đại học Ngoại Thương',
          skillsCount: 6
        },
        processedAt: '2026-10-10T16:05:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'LinkedIn Sync', timestamp: '2026-10-10T16:00:00Z', note: 'Tiếp nhận qua LinkedIn Easy Apply' },
        { status: 'passed_screening', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-11T08:30:00Z', note: 'Hồ sơ rất phù hợp, điểm sàng lọc 95' },
        { status: 'interview_scheduled', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-12T10:00:00Z', note: 'Phỏng vấn Trưởng phòng KD' },
        { status: 'proposed', changedBy: 'Phạm Thị Mai', timestamp: '2026-10-16T15:30:00Z', note: 'Đánh giá vòng phỏng vấn xuất sắc - Đề xuất tuyển dụng mức lương 25M' }
      ],
      internalNotes: [
        { author: 'Phạm Thị Mai', timestamp: '2026-10-16T15:35:00Z', content: 'Ứng viên nắm rất chắc kỹ năng bán giải pháp phần mềm, mạng lưới khách hàng doanh nghiệp sẵn có. Rất cần tuyển dụng ngay!' }
      ]
    },
    {
      id: 'app_5',
      candidateId: 'cand_5',
      candidateName: 'Hoàng Bích Thủy',
      requisitionId: 'req_2',
      postingId: 'post_2',
      positionTitle: 'Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)',
      source: 'website',
      appliedDate: '2026-10-11T09:15:00Z',
      status: 'passed_screening',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 84,
      screeningResult: 'pass',
      screeningDetails: {
        score: 84,
        classification: 'pass',
        summary: 'Đáp ứng tốt các tiêu chí kinh nghiệm và kỹ năng bán hàng SaaS B2B.',
        metCriteria: [
          'Kinh nghiệm 2.5 năm B2B (Đạt)',
          'Học vấn Đại học Kinh Tế TP.HCM (Đạt)',
          'Kỹ năng CRM, thuyết trình sản phẩm (Đạt)'
        ],
        unmetCriteria: [],
        missingInfo: [],
        extractedData: {
          name: 'Hoàng Bích Thủy',
          email: 'thuy.hoangbich@yahoo.com',
          phone: '0938889911',
          experienceYears: 2.5,
          education: 'Đại học Kinh Tế TP.HCM',
          skillsCount: 4
        },
        processedAt: '2026-10-11T09:20:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'Website Form', timestamp: '2026-10-11T09:15:00Z', note: 'Nộp đơn trực tuyến' },
        { status: 'passed_screening', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-12T14:00:00Z', note: 'Duyệt hồ sơ đạt' }
      ],
      internalNotes: []
    },
    {
      id: 'app_6',
      candidateId: 'cand_6',
      candidateName: 'Phạm Đức Trung',
      requisitionId: 'req_3',
      postingId: 'post_3',
      positionTitle: 'DevOps / Cloud Engineer (AWS / Kubernetes)',
      source: 'linkedin',
      appliedDate: '2026-10-13T10:30:00Z',
      status: 'interview_scheduled',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 96,
      screeningResult: 'pass',
      screeningDetails: {
        score: 96,
        classification: 'pass',
        summary: 'Có đầy đủ 2 chứng chỉ uy tín (CKA & AWS Solutions Architect) cùng 4 năm kinh nghiệm thực chiến.',
        metCriteria: [
          'Kỹ năng bắt buộc: AWS, Kubernetes, Docker, Terraform, CI/CD (Đạt 100%)',
          'Kinh nghiệm: 4 năm (Yêu cầu 3 năm - Đạt)',
          'Chứng chỉ chuyên nghiệp: CKA, AWS SAA (Vượt yêu cầu)',
          'Học vấn: PTIT chuyên ngành An toàn thông tin (Đạt)'
        ],
        unmetCriteria: [],
        missingInfo: [],
        extractedData: {
          name: 'Phạm Đức Trung',
          email: 'trung.ducpham@gmail.com',
          phone: '0989334455',
          experienceYears: 4,
          education: 'Học viện PTIT',
          skillsCount: 8
        },
        processedAt: '2026-10-13T10:32:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'LinkedIn Sync', timestamp: '2026-10-13T10:30:00Z', note: 'Ứng tuyển qua LinkedIn' },
        { status: 'passed_screening', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-14T09:00:00Z', note: 'Hồ sơ chuyên môn DevOps xuất sắc' },
        { status: 'interview_scheduled', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-15T11:00:00Z', note: 'Đã xếp lịch phỏng vấn kỹ thuật cùng CTO' }
      ],
      internalNotes: [
        { author: 'Lê Văn Hùng', timestamp: '2026-10-14T11:20:00Z', content: 'Đã xem CV của Trung, chứng chỉ CKA thật sự rất có giá trị cho đợt migrate cụm K8s tới đây. Cần ưu tiên phỏng vấn sớm.' }
      ]
    },
    {
      id: 'app_7',
      candidateId: 'cand_7',
      candidateName: 'Lê Thanh Vân',
      requisitionId: 'req_4',
      postingId: null,
      positionTitle: 'Chuyên viên Tuyển dụng & Đào tạo (HR Recruitment Specialist)',
      source: 'referral',
      appliedDate: '2026-10-14T15:20:00Z',
      status: 'passed_screening',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 90,
      screeningResult: 'pass',
      screeningDetails: {
        score: 90,
        classification: 'pass',
        summary: 'Tốt nghiệp xuất sắc NEU chuyên ngành Nhân sự, 3.5 năm kinh nghiệm Headhunt và IT Recruitment.',
        metCriteria: [
          'Kinh nghiệm: 3.5 năm (Yêu cầu 2 năm)',
          'Học vấn: Đại học Kinh Tế Quốc Dân (Đạt)',
          'Kỹ năng: Tuyển dụng, Sàng lọc, Phỏng vấn, Luật lao động (Đạt 100%)'
        ],
        unmetCriteria: [],
        missingInfo: [],
        extractedData: {
          name: 'Lê Thanh Vân',
          email: 'van.lethanh@gmail.com',
          phone: '0977221100',
          experienceYears: 3.5,
          education: 'Đại học Kinh Tế Quốc Dân',
          skillsCount: 6
        },
        processedAt: '2026-10-14T15:25:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'Nội bộ giới thiệu', timestamp: '2026-10-14T15:20:00Z', note: 'Được nhân sự nội bộ giới thiệu' },
        { status: 'passed_screening', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-15T08:30:00Z', note: 'Duyệt hồ sơ' }
      ],
      internalNotes: []
    },
    {
      id: 'app_8',
      candidateId: 'cand_8',
      candidateName: 'Bùi Gia Huy',
      requisitionId: 'req_3',
      postingId: 'post_3',
      positionTitle: 'DevOps / Cloud Engineer (AWS / Kubernetes)',
      source: 'website',
      appliedDate: '2026-10-15T11:00:00Z',
      status: 'need_info',
      assignedTo: 'usr_hr1',
      assigneeName: 'Nguyễn Thu Hà',
      screeningScore: 65,
      screeningResult: 'manual_check',
      screeningDetails: {
        score: 65,
        classification: 'manual_check',
        summary: 'Có nền tảng Linux và Docker nhưng chưa có kinh nghiệm AWS và Kubernetes thực tế, thiếu chứng chỉ.',
        metCriteria: [
          'Học vấn: Đại học Bách Khoa Hà Nội (Đạt)',
          'Kỹ năng: Docker, Linux, Git (Đạt)'
        ],
        unmetCriteria: [
          'Kinh nghiệm 2 năm (Yêu cầu tối thiểu 3 năm)',
          'Chưa có kinh nghiệm AWS Cloud và Kubernetes production'
        ],
        missingInfo: [
          'Kinh nghiệm thực tế với hạ tầng đám mây công cộng (AWS/GCP/Azure)'
        ],
        extractedData: {
          name: 'Bùi Gia Huy',
          email: 'huy.bg@hotmail.com',
          phone: '0944556677',
          experienceYears: 2,
          education: 'Đại học Bách Khoa Hà Nội',
          skillsCount: 5
        },
        processedAt: '2026-10-15T11:05:00Z'
      },
      statusHistory: [
        { status: 'pending_review', changedBy: 'Website Form', timestamp: '2026-10-15T11:00:00Z', note: 'Ứng tuyển' },
        { status: 'need_info', changedBy: 'Nguyễn Thu Hà', timestamp: '2026-10-16T10:00:00Z', note: 'Yêu cầu ứng viên bổ sung thông tin các dự án Cloud đã tham gia' }
      ],
      internalNotes: []
    }
  ];

  const INITIAL_INTERVIEWS = [
    {
      id: 'iv_1',
      code: 'LPV-2026-001',
      candidateId: 'cand_1',
      candidateName: 'Vũ Hoàng Nam',
      requisitionId: 'req_1',
      positionTitle: 'Senior Frontend Developer (React / TypeScript)',
      round: 'Vòng 2 - Đánh giá Chuyên môn',
      date: '2026-11-03',
      startTime: '09:30',
      endTime: '11:00',
      type: 'online',
      location: 'https://meet.google.com/ats-react-tech',
      interviewers: ['Lê Văn Hùng', 'Nguyễn Thu Hà'],
      status: 'confirmed',
      notes: 'Trọng tâm phỏng vấn: Kiến trúc state management, performance profiling và live-coding React hook tùy chỉnh.',
      createdAt: '2026-10-08T14:00:00Z'
    },
    {
      id: 'iv_2',
      code: 'LPV-2026-002',
      candidateId: 'cand_6',
      candidateName: 'Phạm Đức Trung',
      requisitionId: 'req_3',
      positionTitle: 'DevOps / Cloud Engineer (AWS / Kubernetes)',
      round: 'Vòng 2 - Đánh giá Chuyên môn',
      date: '2026-11-04',
      startTime: '14:00',
      endTime: '15:30',
      type: 'onsite',
      location: 'Phòng họp Tầng 8 - Trụ sở chính SmartATS, Tòa nhà Landmark, Hà Nội',
      interviewers: ['Lê Văn Hùng'],
      status: 'confirmed',
      notes: 'Thảo luận về kinh nghiệm xử lý sự cố cụm K8s và kiến trúc Terraform đa môi trường.',
      createdAt: '2026-10-15T11:00:00Z'
    },
    {
      id: 'iv_3',
      code: 'LPV-2026-003',
      candidateId: 'cand_4',
      candidateName: 'Đoàn Quang Huy',
      requisitionId: 'req_2',
      positionTitle: 'Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)',
      round: 'Vòng 2 - Đánh giá Chuyên môn',
      date: '2026-10-16',
      startTime: '10:00',
      endTime: '11:30',
      type: 'online',
      location: 'https://meet.google.com/ats-sales-interview',
      interviewers: ['Phạm Thị Mai', 'Nguyễn Thu Hà'],
      status: 'completed',
      notes: 'Mô phỏng tình huống tiếp cận khách hàng CEO khó tính, ứng viên xử lý rất bản lĩnh và thuyết phục.',
      createdAt: '2026-10-12T10:00:00Z'
    },
    {
      id: 'iv_4',
      code: 'LPV-2026-004',
      candidateId: 'cand_4',
      candidateName: 'Đoàn Quang Huy',
      requisitionId: 'req_2',
      positionTitle: 'Chuyên viên Phát triển Khách hàng Doanh nghiệp (B2B Sales Executive)',
      round: 'Vòng 3 - Phỏng vấn Giám đốc',
      date: '2026-11-05',
      startTime: '15:00',
      endTime: '16:00',
      type: 'online',
      location: 'https://meet.google.com/ats-director-final',
      interviewers: ['Trần Đình Long', 'Phạm Thị Mai'],
      status: 'confirmed',
      notes: 'Thống nhất định hướng phát triển thị trường phía Nam và mức thu nhập đề xuất.',
      createdAt: '2026-10-18T16:00:00Z'
    }
  ];

  const INITIAL_EVALUATIONS = [
    {
      id: 'eval_1',
      interviewId: 'iv_3',
      candidateId: 'cand_4',
      candidateName: 'Đoàn Quang Huy',
      requisitionId: 'req_2',
      round: 'Vòng 2 - Đánh giá Chuyên môn',
      evaluatorName: 'Phạm Thị Mai',
      evaluatorRole: 'Trưởng phòng Kinh doanh',
      scores: {
        professionalKnowledge: 5, // thang điểm 1-5
        workSkills: 5,
        experience: 5,
        teamworkCommunication: 4.5
      },
      criteriaComments: {
        professionalKnowledge: 'Nắm rất rõ chu kỳ bán hàng B2B, hiểu cách tính ROI giải pháp cho khách hàng.',
        workSkills: 'Kỹ năng thuyết trình trực quan, xử lý từ chối chuyên nghiệp.',
        experience: 'Đã có 5 năm làm việc thực tế và thành tích doanh số xuất sắc tại MISA.',
        teamworkCommunication: 'Giao tiếp lịch thiệp, giọng nói truyền cảm hứng.'
      },
      overallScore: 96,
      recommendation: 'continue', // continue, consider, reject
      finalDecision: 'Đề xuất tuyển dụng',
      comment: 'Ứng viên sáng giá nhất từ đầu năm đến nay cho vị trí B2B Sales. Đề xuất Giám đốc duyệt tuyển dụng và ký hợp đồng ngay.',
      createdAt: '2026-10-16T15:00:00Z'
    }
  ];

  const INITIAL_NOTIFICATIONS = [
    {
      id: 'notif_1',
      title: 'Hồ sơ mới cần xử lý',
      message: 'Ứng viên Phạm Đức Trung vừa ứng tuyển vị trí DevOps / Cloud Engineer qua LinkedIn.',
      date: '2026-10-13T10:30:00Z',
      read: false,
      icon: 'user-plus',
      link: '#/candidates/cand_6'
    },
    {
      id: 'notif_2',
      title: 'Đề xuất tuyển dụng mới',
      message: 'Trưởng phòng Phạm Thị Mai vừa gửi đề xuất tuyển dụng cho ứng viên Đoàn Quang Huy.',
      date: '2026-10-16T15:30:00Z',
      read: false,
      icon: 'check-square',
      link: '#/evaluations'
    },
    {
      id: 'notif_3',
      title: 'Lịch phỏng vấn sắp diễn ra',
      message: 'Lịch phỏng vấn Vũ Hoàng Nam (Senior Frontend) sẽ diễn ra ngày 03/11/2026 lúc 09:30.',
      date: '2026-10-27T08:00:00Z',
      read: true,
      icon: 'calendar',
      link: '#/interviews'
    }
  ];

  const INITIAL_SETTINGS = {
    screeningWeights: {
      skills: 40,
      experience: 30,
      education: 15,
      certifications: 15
    },
    scoreThresholds: {
      pass: 80,
      manual_check: 60
    },
    // AI only auto-approves candidates that clear every required criterion.
    // Below-threshold applications stay in the human review queue; AI never auto-rejects.
    autoApproveEnabled: true,
    companyName: 'SmartATS Solutions Việt Nam',
    companyEmail: 'hr@smartats.vn',
    companyAddress: 'Tòa nhà Landmark, Cầu Giấy, Hà Nội',
    hotline: '1900 xxxx',
    integrations: {
      websitePortal: { active: true, name: 'Cổng tuyển dụng Doanh nghiệp' },
      topcv: { active: true, name: 'TopCV Open API (Mô phỏng)' },
      linkedin: { active: true, name: 'LinkedIn Jobs Integration (Mô phỏng)' },
      vietnamworks: { active: false, name: 'VietnamWorks API' },
      googleMeet: { active: true, name: 'Google Meet Auto Link' },
      smtpEmail: { active: true, name: 'Hệ thống gửi Email tự động' }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // State Initialization & LocalStorage Sync
  // ─────────────────────────────────────────────────────────────
  let _data = null;
  let _currentUser = null;

  // ── Đồng bộ máy chủ (PostgreSQL) ─────────────────────────────
  // Giao diện đọc dữ liệu đồng bộ từ bộ nhớ; mọi thay đổi được đẩy lên
  // API /api/sync ngay sau khi ghi, theo cơ chế so sánh khác biệt.
  const SYNC_COLLECTIONS = [
    'users', 'departments', 'requisitions', 'postings', 'candidates',
    'applications', 'interviews', 'evaluations', 'notifications', 'emailLog'
  ];
  let _syncEnabled = false;
  let _syncedSnapshot = null;
  let _syncTimer = null;
  let _syncing = false;
  let _syncPending = false;

  function cloneData(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function departmentRecords() {
    return (_data.departments || []).map((name, index) => ({
      id: `dept_${index + 1}`,
      name: typeof name === 'string' ? name : (name && name.name) || ''
    }));
  }

  function serverSnapshot() {
    const snapshot = {};
    SYNC_COLLECTIONS.forEach((collection) => {
      snapshot[collection] = collection === 'departments'
        ? departmentRecords()
        : cloneData(_data[collection] || []);
    });
    snapshot.settings = cloneData(_data.settings || null);
    return snapshot;
  }

  function diffAgainstSynced(snapshot) {
    if (!_syncedSnapshot) return null;

    const upserts = {};
    const deletes = {};

    SYNC_COLLECTIONS.forEach((collection) => {
      const previous = _syncedSnapshot[collection] || [];
      const next = snapshot[collection] || [];
      const previousMap = new Map(previous.filter(r => r && r.id).map(r => [r.id, JSON.stringify(r)]));
      const nextIds = new Set();
      const changed = [];

      next.forEach((record) => {
        if (!record || !record.id) return;
        nextIds.add(record.id);
        if (previousMap.get(record.id) !== JSON.stringify(record)) changed.push(record);
      });

      const removed = previous.filter(r => r && r.id && !nextIds.has(r.id)).map(r => r.id);

      if (changed.length) upserts[collection] = changed;
      if (removed.length) deletes[collection] = removed;
    });

    const settingsChanged = JSON.stringify(snapshot.settings) !== JSON.stringify(_syncedSnapshot.settings);
    if (!Object.keys(upserts).length && !Object.keys(deletes).length && !settingsChanged) return null;

    const payload = { upserts, deletes };
    if (settingsChanged) payload.settings = snapshot.settings;
    return payload;
  }

  function scheduleSync() {
    if (!_syncEnabled || typeof fetch !== 'function') return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      _syncTimer = null;
      flushSync();
    }, 250);
  }

  async function flushSync() {
    if (!_syncEnabled || typeof fetch !== 'function') return;
    if (_syncing) {
      _syncPending = true;
      return;
    }

    const snapshot = serverSnapshot();
    const payload = diffAgainstSynced(snapshot);
    if (!payload) return;

    _syncing = true;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _syncedSnapshot = snapshot;
    } catch (err) {
      console.warn('[ATSStore] Không đồng bộ được lên máy chủ:', err.message);
      if (_syncTimer) clearTimeout(_syncTimer);
      _syncTimer = setTimeout(() => {
        _syncTimer = null;
        flushSync();
      }, 3000);
    } finally {
      _syncing = false;
    }

    if (_syncPending) {
      _syncPending = false;
      scheduleSync();
    } else if (diffAgainstSynced(serverSnapshot())) {
      scheduleSync();
    }
  }

  /** Nạp toàn bộ dữ liệu từ PostgreSQL khi ứng dụng khởi động. */
  async function init() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/state', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const incoming = payload && payload.data;
      if (!incoming) throw new Error('Phản hồi API không hợp lệ');

      // Máy chủ chưa có người dùng nghĩa là chưa nạp được dữ liệu mẫu:
      // giữ dữ liệu cục bộ để hệ thống vẫn dùng được.
      if (!Array.isArray(incoming.users) || incoming.users.length === 0) {
        throw new Error('Cơ sở dữ liệu chưa có dữ liệu người dùng');
      }

      SYNC_COLLECTIONS.forEach((collection) => {
        if (collection === 'departments') {
          _data.departments = (incoming.departments || [])
            .map(d => (typeof d === 'string' ? d : (d && d.name) || ''))
            .filter(Boolean);
          return;
        }
        _data[collection] = Array.isArray(incoming[collection]) ? incoming[collection] : [];
      });

      if (incoming.settings) _data.settings = incoming.settings;
      if (_data.settings && !_data.settings.hotline) _data.settings.hotline = '1900 xxxx';

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
      } catch (_) { /* bộ nhớ trình duyệt đầy */ }

      // Tài khoản đang đăng nhập phải tồn tại trong dữ liệu máy chủ.
      if (_currentUser) {
        const fresh = (_data.users || []).find(u => u.id === _currentUser.id);
        if (fresh) {
          _currentUser = fresh;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fresh));
        } else {
          _currentUser = null;
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }

      _syncedSnapshot = serverSnapshot();
      _syncEnabled = true;
      return true;
    } catch (err) {
      console.warn('[ATSStore] Dùng dữ liệu cục bộ:', err.message);
      return false;
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        _data = JSON.parse(saved);
      } else {
        resetToDefault();
      }
    } catch (e) {
      console.error('[ATSStore] Error loading storage:', e);
      resetToDefault();
    }

    // ── schema top-up for stores saved before the e-mail outbox existed ──
    if (_data) {
      if (!Array.isArray(_data.emailLog)) _data.emailLog = [];
      if (!Array.isArray(_data.interviews)) _data.interviews = [];
      if (!Array.isArray(_data.evaluations)) _data.evaluations = [];
      if (_data.settings && !_data.settings.hotline) _data.settings.hotline = '1900 xxxx';
      if (_data.settings && _data.settings.integrations && _data.settings.integrations.smtpEmail) {
        _data.settings.integrations.smtpEmail.active = true;
      }
    }

    // Load active session user
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        _currentUser = JSON.parse(savedUser);
      } else {
        // Default to HR recruiter if none
        _currentUser = _data.users.find(u => u.username === 'hr1') || _data.users[0];
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(_currentUser));
      }
    } catch (e) {
      _currentUser = _data.users[0];
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('[ATSStore] Error saving storage:', e);
    }
    scheduleSync();
  }

  function resetToDefault() {
    _data = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      departments: [...DEPARTMENTS],
      requisitions: JSON.parse(JSON.stringify(INITIAL_REQUISITIONS)),
      postings: JSON.parse(JSON.stringify(INITIAL_POSTINGS)),
      candidates: JSON.parse(JSON.stringify(INITIAL_CANDIDATES)),
      applications: JSON.parse(JSON.stringify(INITIAL_APPLICATIONS)),
      interviews: JSON.parse(JSON.stringify(INITIAL_INTERVIEWS)),
      evaluations: JSON.parse(JSON.stringify(INITIAL_EVALUATIONS)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
      emailLog: [],
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS))
    };
    saveState();
  }

  // Initial load
  loadState();

  // ─────────────────────────────────────────────────────────────
  // CV Parsing & Criteria Matching Engine
  // ─────────────────────────────────────────────────────────────
  const CVEngine = {
    /**
     * Parse raw text extracted from a CV
     */
    parseText(text) {
      if (!text || typeof text !== 'string') {
        return {
          name: '',
          email: '',
          phone: '',
          education: '',
          experienceYears: 0,
          skills: [],
          certifications: []
        };
      }

      // Normalise Unicode (PDF/DOCX exports often use decomposed Vietnamese),
      // strip control characters and NBSP before any heuristic runs.
      const cleanText = (text.normalize ? text.normalize('NFC') : text)
        .replace(/\r\n?/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const cleanupValue = (value) => String(value || '')
        .replace(/^[\s\-•*|]+/, '')
        .split(/\s{2,}|\s*[|•]\s*|\s+[-–—]\s+|\t/)[0]
        .replace(/[.,;:]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();

      const isLikelyName = (value) => {
        if (!value || value.length < 3 || value.length > 60) return false;
        if (/@|\d|https?:|www\./i.test(value)) return false;
        if (/(email|phone|address|developer|engineer|manager|sales|intern|resume|curriculum|kinh nghiệm|học vấn|kỹ năng|chứng chỉ|liên hệ|thông tin)/i.test(value)) return false;
        const words = value.split(/\s+/);
        if (words.length < 2 || words.length > 6) return false;
        return words.every(word => /^[A-ZÀ-Ỹ][A-ZÀ-Ỹa-zà-ỹ'’.]*$/u.test(word));
      };

      // Extract Email
      const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0].replace(/[.,;]+$/, '') : '';

      // Extract Phone (accepts +84, spaces, dots and dashes)
      let phone = '';
      const phoneCandidates = cleanText.match(/(?:\+?84[\s.-]?|0)(?:\d[\s.-]?){9}\b/g) || [];
      for (const raw of phoneCandidates) {
        const digits = raw.replace(/\D/g, '');
        const local = digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
        if (/^0[35789]\d{8}$/.test(local)) { phone = local; break; }
      }

      // Extract Name — labelled field first, then the first plausible person-name line
      let name = '';
      const nameLabel = cleanText.match(/(?:HỌ\s*(?:VÀ\s*)?TÊN|HỌ\s*TÊN|FULL\s*NAME|NAME|ỨNG\s*VIÊN)\s*[:：\-]\s*([^\n]{2,80})/i);
      if (nameLabel) name = cleanupValue(nameLabel[1]);
      if (!name) {
        const lines = cleanText.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 14);
        for (const line of lines) {
          const candidate = cleanupValue(line);
          if (isLikelyName(candidate)) { name = candidate; break; }
        }
      }

      // Extract Experience Years
      let experienceYears = 1;
      const expMatch = cleanText.match(/(\d+(?:[.,]\d+)?)\s*\+?\s*(?:năm|years?)\b/i);
      if (expMatch && expMatch[1]) {
        experienceYears = parseFloat(String(expMatch[1]).replace(',', '.'));
      } else {
        // Count year spans like 2021 - 2024
        const yearSpans = [...cleanText.matchAll(/(20\d\d)\s*[-–]\s*(20\d\d|nay|hiện tại|present)/gi)];
        if (yearSpans.length > 0) {
          let totalSpan = 0;
          const currentYear = new Date().getFullYear();
          yearSpans.forEach(m => {
            const start = parseInt(m[1], 10);
            const end = (m[2].toLowerCase().includes('nay') || m[2].toLowerCase().includes('hiện') || m[2].toLowerCase().includes('present')) ? currentYear : parseInt(m[2], 10);
            if (end >= start) totalSpan += (end - start);
          });
          experienceYears = Math.max(1, Math.min(15, totalSpan));
        }
      }

      // Extract Education — prefer the labelled field, then a university line
      let education = 'Đại học';
      const eduLabel = cleanText.match(/(?:HỌC\s*VẤN|TRÌNH\s*ĐỘ|EDUCATION)\s*[:：]?\s*\n?\s*([^\n]{2,120})/i);
      if (eduLabel && eduLabel[1]) {
        education = cleanupValue(eduLabel[1]).substring(0, 90) || 'Đại học';
      } else if (/thạc sĩ|master/i.test(cleanText)) {
        education = 'Thạc sĩ';
      } else if (/cao đẳng|college/i.test(cleanText)) {
        education = 'Cao đẳng';
      } else if (/bách khoa|đại học|cử nhân|kỹ sư|university|bachelor/i.test(cleanText)) {
        const eduLine = cleanText.split('\n').map(l => l.trim()).find(l => /đại học|university|cử nhân|học viện/i.test(l));
        education = eduLine ? eduLine.substring(0, 80) : 'Đại học';
      }

      // Known Skills Dictionary
      const COMMON_SKILLS = [
        'React', 'React.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Redux', 'Next.js',
        'Node.js', 'Vue.js', 'Angular', 'HTML', 'CSS', 'HTML/CSS', 'Git', 'RESTful API',
        'Python', 'Java', 'Spring Boot', 'PHP', 'Laravel', 'Golang', 'C#', '.NET',
        'MongoDB', 'SQL', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL',
        'AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Linux', 'Ansible', 'Bash',
        'B2B Sales', 'Đàm phán', 'Kỹ năng thuyết trình', 'CRM', 'Quản lý khách hàng',
        'Tuyển dụng', 'Sàng lọc CV', 'Phỏng vấn', 'Đào tạo nội bộ', 'Luật lao động',
        'Kế toán tổng hợp', 'Kê khai thuế', 'MISA', 'Báo cáo tài chính', 'Excel',
        'Figma', 'UI/UX', 'Design System', 'Prototyping'
      ];

      const detectedSkills = [];
      COMMON_SKILLS.forEach(skill => {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?:^|[\\s,;.:/(-])${escaped}(?:$|[\\s,;.:/)-])`, 'i');
        if (pattern.test(cleanText)) {
          if (!detectedSkills.includes(skill)) {
            detectedSkills.push(skill);
          }
        }
      });

      // Extract Certifications
      const detectedCerts = [];
      const certPatterns = [
        'AWS Certified Cloud Practitioner', 'AWS Certified Solutions Architect',
        'AWS Solutions Architect Associate', 'Certified Kubernetes Administrator (CKA)',
        'CKA', 'IELTS 6.5', 'IELTS 7.0', 'IELTS 7.5', 'IELTS 8.0', 'TOEIC', 'HubSpot Inbound Sales',
        'PMP', 'Scrum Master', 'SHRM-CP'
      ];
      certPatterns.forEach(cert => {
        if (new RegExp(cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(cleanText)) {
          detectedCerts.push(cert);
        }
      });

      return {
        name: name || 'Ứng viên chưa rõ họ tên',
        email: email || '',
        phone: phone || '',
        education: education || 'Đang cập nhật',
        experienceYears: Math.round(experienceYears * 10) / 10,
        skills: detectedSkills,
        certifications: detectedCerts
      };
    },

    /**
     * NLP & Keyword Analysis Engine
     * Analyzes candidate CV text against job requirements, extracts keywords,
     * computes match density, missing keywords, and detailed reasoning.
     */
    analyzeNLPKeywords(cvText, requisition) {
      if (!requisition) {
        return {
          score: 70,
          classification: 'manual_check',
          matchPercentage: 70,
          matchedKeywords: [],
          missingKeywords: [],
          reasons: ['Chưa xác định được vị trí tuyển dụng để so khớp từ khóa'],
          summary: 'Chưa có thông tin vị trí để phân tích NLP.'
        };
      }

      const text = (cvText || '').toLowerCase();

      // Vietnamese & English Stop Words
      const STOP_WORDS = new Set([
        'và', 'các', 'những', 'của', 'là', 'trong', 'cho', 'với', 'để', 'từ', 'có', 'được',
        'tại', 'về', 'khi', 'này', 'đó', 'thì', 'ở', 'đến', 'theo', 'như', 'bởi', 'rằng',
        'trên', 'dưới', 'sau', 'trước', 'năm', 'tháng', 'ngày', 'kinh', 'nghiệm', 'yêu', 'cầu',
        'ứng', 'viên', 'tối', 'thiểu', 'thành', 'thạo', 'làm', 'việc', 'tham', 'gia', 'khả', 'năng',
        'th', 'ch', 'ph', 'nh', 'tr', 'kh', 'gi', 'qu', 'ng', 'chịu', 'trách', 'nhiệm',
        'and', 'the', 'is', 'in', 'at', 'of', 'a', 'an', 'to', 'for', 'with', 'on', 'by', 'as', 'from'
      ]);

      const VALID_2CHAR_TECH = new Set(['ai', 'ml', 'ci', 'cd', 'ui', 'ux', 'hr', 'qa', 'qc', 'ba', 'po', 'pm', 'c#', 'go', 'js', 'ts']);

      // 1. Gather all target keywords from Requisition
      const targetKeywords = new Set();

      // Add direct skills
      (requisition.skills || []).forEach(s => {
        if (s && s.trim().length > 1) targetKeywords.add(s.trim());
      });

      // Extract important technical & domain words from requirements & description
      const reqText = `${requisition.title || ''} ${requisition.requirements || ''} ${requisition.description || ''}`;
      const rawTokens = reqText.match(/[a-zA-Z0-9+#.\-/]+/g) || [];
      rawTokens.forEach(token => {
        const clean = token.replace(/^[.,;:!?()\-]+|[.,;:!?()\-]+$/g, '').trim();
        const lower = clean.toLowerCase();
        if (clean.length < 2 || STOP_WORDS.has(lower)) return;
        if (clean.length === 2 && !VALID_2CHAR_TECH.has(lower)) return;

        // Check if it's a known skill or technical acronym
        if (VALID_2CHAR_TECH.has(lower) || ['react', 'node', 'vue', 'angular', 'sql', 'aws', 'docker', 'figma', 'b2b', 'crm', 'git', 'ci/cd', 'typescript', 'javascript', 'python', 'java', 'spring', 'mongodb', 'redux', 'devops', 'kubernetes', 'terraform'].includes(lower)) {
          targetKeywords.add(clean);
        } else if (clean.length >= 3 && /^[A-Z][a-zA-Z0-9+#.\-]*$/.test(clean) && !STOP_WORDS.has(lower)) {
          // Capitalized English words or terms
          if (!['chịu', 'trách', 'nhiệm', 'tham', 'gia', 'phát', 'triển', 'xây', 'dựng', 'quản', 'lý', 'tối', 'thiểu'].includes(lower)) {
            targetKeywords.add(clean);
          }
        }
      });

      const keywordList = Array.from(targetKeywords);
      const matched = [];
      const missing = [];

      keywordList.forEach(kw => {
        const kwLower = kw.toLowerCase();
        // Regex word boundary or punctuation boundary match
        const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|[\\s,;.:/(-])${escaped}(?:$|[\\s,;.:/)-])`, 'i');
        const occurrences = (text.match(new RegExp(escaped, 'gi')) || []).length;

        if (regex.test(text) || occurrences > 0) {
          matched.push({ keyword: kw, count: Math.max(1, occurrences) });
        } else {
          missing.push(kw);
        }
      });

      const totalKws = keywordList.length || 1;
      const matchPercentage = Math.round((matched.length / totalKws) * 100);

      // Generate structured reasons based on NLP matching
      const reasons = [];
      if (matched.length > 0) {
        const topMatched = matched.slice(0, 6).map(m => `${m.keyword}${m.count > 1 ? ` (${m.count} lần)` : ''}`).join(', ');
        reasons.push(`Trùng khớp từ khóa chuyên môn: ${topMatched}`);
      }
      if (missing.length > 0) {
        const missingSample = missing.slice(0, 5).join(', ');
        reasons.push(`Từ khóa yêu cầu chưa tìm thấy trong CV: ${missingSample}`);
      } else {
        reasons.push('Đáp ứng đầy đủ 100% các từ khóa chuyên môn cốt lõi của vị trí');
      }

      return {
        matchPercentage,
        matchedKeywords: matched,
        missingKeywords: missing,
        totalKeywords: totalKws,
        reasons
      };
    },

    /**
     * Compare candidate data with requisition criteria and calculate match score
     */
    evaluateCandidate(candidateData, requisition) {
      if (!requisition) {
        return {
          score: 70,
          classification: 'manual_check',
          summary: 'Chưa có thông tin tiêu chí vị trí để đối chiếu.',
          metCriteria: [],
          unmetCriteria: [],
          missingInfo: ['Thiếu thông tin vị trí tuyển dụng'],
          nlpAnalysis: null
        };
      }

      const weights = (_data && _data.settings && _data.settings.screeningWeights) || {
        skills: 40,
        experience: 30,
        education: 15,
        certifications: 15
      };

      const thresholds = (_data && _data.settings && _data.settings.scoreThresholds) || {
        pass: 80,
        manual_check: 60
      };

      const metCriteria = [];
      const unmetCriteria = [];
      const missingInfo = [];

      // 1. Skill evaluation (Max 40 points)
      const reqSkills = requisition.skills || [];
      const candSkills = candidateData.skills || [];
      let skillScore = 0;
      if (reqSkills.length > 0) {
        let matchedCount = 0;
        reqSkills.forEach(reqSkill => {
          const isMatch = candSkills.some(cs => cs.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs.toLowerCase()));
          if (isMatch) {
            matchedCount++;
          }
        });
        const skillRatio = matchedCount / reqSkills.length;
        skillScore = skillRatio * weights.skills;

        if (matchedCount === reqSkills.length) {
          metCriteria.push(`Kỹ năng chuyên môn bắt buộc: Khớp ${matchedCount}/${reqSkills.length} kỹ năng (${reqSkills.join(', ')})`);
        } else if (matchedCount > 0) {
          metCriteria.push(`Kỹ năng cơ bản: Khớp ${matchedCount}/${reqSkills.length} kỹ năng yêu cầu`);
          const missingSkills = reqSkills.filter(rs => !candSkills.some(cs => cs.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs.toLowerCase())));
          unmetCriteria.push(`Chưa tìm thấy kỹ năng: ${missingSkills.join(', ')}`);
        } else {
          unmetCriteria.push(`Không tìm thấy kỹ năng chuyên môn nào trong danh sách: ${reqSkills.join(', ')}`);
        }
      } else {
        skillScore = weights.skills; // Neutral if no skills configured
      }

      // 2. Experience evaluation (Max 30 points)
      const reqExp = requisition.minExperience || 0;
      const candExp = candidateData.experienceYears || 0;
      let expScore = 0;
      if (reqExp > 0) {
        if (candExp >= reqExp) {
          expScore = weights.experience;
          metCriteria.push(`Số năm kinh nghiệm: ${candExp} năm (Vượt hoặc đạt mốc yêu cầu tối thiểu ${reqExp} năm)`);
        } else if (candExp >= reqExp * 0.7) {
          expScore = weights.experience * 0.7;
          unmetCriteria.push(`Số năm kinh nghiệm: ${candExp} năm (Dưới mốc yêu cầu ${reqExp} năm một chút)`);
        } else {
          expScore = (candExp / reqExp) * weights.experience;
          unmetCriteria.push(`Kinh nghiệm làm việc: ${candExp} năm (Thiếu so với yêu cầu ${reqExp} năm)`);
        }
      } else {
        expScore = weights.experience;
      }

      // 3. Education evaluation (Max 15 points)
      let eduScore = 0;
      const candEdu = (candidateData.education || '').toLowerCase();
      const reqEdu = (requisition.education || 'Đại học').toLowerCase();

      if (candEdu.includes('đại học') || candEdu.includes('bách khoa') || candEdu.includes('university') || candEdu.includes('học viện')) {
        eduScore = weights.education;
        metCriteria.push(`Học vấn: ${candidateData.education || 'Đại học'} (Đáp ứng yêu cầu bằng cấp)`);
      } else if (candEdu.includes('cao đẳng')) {
        if (reqEdu.includes('cao đẳng')) {
          eduScore = weights.education;
          metCriteria.push(`Học vấn: Cao đẳng (Đạt yêu cầu)`);
        } else {
          eduScore = weights.education * 0.5;
          unmetCriteria.push(`Bằng cấp: Cao đẳng (Yêu cầu tốt nghiệp Đại học)`);
        }
      } else {
        eduScore = weights.education * 0.6;
        missingInfo.push('Chưa xác định rõ thông tin trường đào tạo và bậc học từ CV');
      }

      // 4. Certifications & Extra (Max 15 points)
      let certScore = 0;
      const candCerts = candidateData.certifications || [];
      if (candCerts.length > 0) {
        certScore = weights.certifications;
        metCriteria.push(`Chứng chỉ chuyên môn & ngoại ngữ: ${candCerts.join(', ')}`);
      } else {
        certScore = weights.certifications * 0.5; // Neutral
      }

      // Missing info checks
      if (!candidateData.phone) missingInfo.push('Chưa tìm thấy số điện thoại liên hệ trong CV');
      if (!candidateData.email) missingInfo.push('Chưa tìm thấy địa chỉ email trong CV');

      const totalScore = Math.min(100, Math.round(skillScore + expScore + eduScore + certScore));

      let classification = 'pass';
      if (totalScore >= thresholds.pass && unmetCriteria.length === 0) {
        classification = 'pass';
      } else if (totalScore < thresholds.manual_check || (candExp < reqExp * 0.5)) {
        classification = 'fail';
      } else {
        classification = 'manual_check';
      }

      // 5. Run NLP Keyword Extraction
      const rawCV = candidateData.rawResumeText || (candidateData.skills || []).join(', ') + ' ' + (candidateData.education || '');
      const nlp = this.analyzeNLPKeywords(rawCV, requisition);

      // Detailed Reasons combined
      const reasons = [
        ...nlp.reasons,
        candExp >= reqExp ? `Kinh nghiệm làm việc (${candExp} năm) đáp ứng yêu cầu (${reqExp} năm)` : `Kinh nghiệm làm việc (${candExp} năm) chưa đạt yêu cầu (${reqExp} năm)`,
        candEdu.includes('đại học') || candEdu.includes('bách khoa') ? `Học vấn ${candidateData.education || 'Đại học'} đạt chuẩn chuyên môn` : `Trình độ học vấn: ${candidateData.education || 'Đang cập nhật'}`
      ];

      let summary = '';
      if (classification === 'pass') {
        summary = `Ứng viên đạt ${totalScore} điểm, đối chiếu NLP trùng khớp ${nlp.matchPercentage}% từ khóa và tiêu chí chuyên môn.`;
      } else if (classification === 'fail') {
        summary = `Ứng viên đạt ${totalScore} điểm, không đáp ứng một hoặc nhiều tiêu chí bắt buộc (kinh nghiệm hoặc kỹ năng).`;
      } else {
        summary = `Ứng viên đạt ${totalScore} điểm (khớp ${nlp.matchPercentage}% từ khóa), khuyến nghị Nhân sự kiểm tra thủ công thêm một số thông tin.`;
      }

      return {
        score: totalScore,
        classification,
        summary,
        metCriteria,
        unmetCriteria,
        missingInfo,
        reasons,
        nlpAnalysis: nlp,
        matchedKeywords: nlp.matchedKeywords,
        missingKeywords: nlp.missingKeywords,
        matchPercentage: nlp.matchPercentage,
        processedAt: new Date().toISOString()
      };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Candidate e-mail automation (outbox)
  // Hiring events write a ready-to-send message here by themselves —
  // HR never has to compose or send anything by hand.
  // ─────────────────────────────────────────────────────────────
  const EMAIL_TYPE_META = {
    interview_invite: { label: 'Mời phỏng vấn', icon: 'calendar-plus', tone: 'info' },
    interview_reschedule: { label: 'Đổi lịch phỏng vấn', icon: 'calendar-clock', tone: 'warning' },
    interview_cancel: { label: 'Hủy lịch phỏng vấn', icon: 'calendar-x', tone: 'danger' },
    evaluation_result: { label: 'Kết quả đánh giá', icon: 'clipboard-check', tone: 'info' },
    decision: { label: 'Quyết định tuyển dụng', icon: 'award', tone: 'success' },
    custom: { label: 'Thư tuỳ chỉnh', icon: 'mail', tone: 'info' }
  };

  const INTERVIEW_TYPE_LABEL = { online: 'Trực tuyến (Google Meet)', onsite: 'Trực tiếp tại văn phòng' };

  function candidateEmailOf(ctx) {
    const candidate = ctx.candidate || {};
    return candidate.email || ctx.email || '';
  }

  function composeCandidateEmail(type, ctx) {
    const candidate = ctx.candidate || {};
    const application = ctx.application || {};
    const interview = ctx.interview || null;
    const evaluation = ctx.evaluation || null;
    const name = candidate.fullName || application.candidateName || 'bạn';
    const position = (interview && interview.positionTitle) || application.positionTitle || 'vị trí ứng tuyển';
    const company = (_data.settings && _data.settings.companyName) || 'SmartATS Solutions Việt Nam';
    const signature = `Phòng Nhân sự ${company}`;
    const signOff = `Trân trọng,\n${signature}`;
    const interviewFacts = interview ? [
      { label: 'Thời gian', value: `${interview.startTime} – ${interview.endTime}, ${Helpers.formatDate(interview.date)}` },
      { label: 'Vòng', value: interview.round || '' },
      { label: 'Hình thức', value: INTERVIEW_TYPE_LABEL[interview.type] || interview.type || '' },
      { label: 'Địa điểm / Liên kết', value: interview.location || '' },
      { label: 'Hội đồng', value: (interview.interviewers || []).join(', ') }
    ] : [];

    switch (type) {
      case 'interview_invite':
        return {
          subject: `[SmartATS] Thư mời phỏng vấn vị trí ${position}${interview && interview.round ? ` (${interview.round})` : ''}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: [
            `Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${position} tại ${company}.`,
            `Hồ sơ của bạn đã vượt qua vòng sàng lọc. Chúng tôi trân trọng kính mời bạn tham dự buổi phỏng vấn với các thông tin sau:`
          ],
          facts: interviewFacts,
          closing: `Bạn vui lòng phản hồi email này để xác nhận tham dự. Nếu cần điều chỉnh, hãy cho chúng tôi biết trước 24 giờ.\n\n${signOff}`
        };

      case 'interview_reschedule':
        return {
          subject: `[SmartATS] Thay đổi lịch phỏng vấn vị trí ${position}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: [
            `Buổi phỏng vấn cho vị trí ${position} vừa được điều chỉnh. Rất mong bạn thông cảm cho sự thay đổi này.`,
            `Lịch phỏng vấn mới của bạn như sau:`
          ],
          facts: interviewFacts,
          closing: `Nếu khung giờ mới không phù hợp, bạn vui lòng phản hồi email để chúng tôi sắp xếp lại.\n\n${signOff}`
        };

      case 'interview_cancel':
        return {
          subject: `[SmartATS] Hủy lịch phỏng vấn vị trí ${position}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: [
            `Buổi phỏng vấn vị trí ${position}${interview && interview.date ? ` dự kiến vào ${Helpers.formatDate(interview.date)}` : ''} đã bị hủy.`,
            ctx.note ? `Lý do: ${ctx.note}` : '',
            `Bộ phận Tuyển dụng sẽ liên hệ lại với bạn nếu có lịch mới hoặc bước tiếp theo.`
          ].filter(Boolean),
          facts: [],
          closing: signOff
        };

      case 'evaluation_result': {
        const score = evaluation && evaluation.overallScore != null ? `${evaluation.overallScore}/100` : '';
        const verdict = evaluation && evaluation.recommendation === 'reject'
          ? 'Chưa đạt ở vòng này'
          : 'Đạt yêu cầu, chuyển sang bước tiếp theo';
        return {
          subject: `[SmartATS] Kết quả đánh giá phỏng vấn vị trí ${position}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: [
            `Hội đồng phỏng vấn đã hoàn tất phần đánh giá của bạn cho vị trí ${position}.`,
            evaluation && evaluation.comment ? `Nhận xét từ hội đồng: “${evaluation.comment}”` : '',
            `Kết quả này sẽ được chuyển tới bộ phận Tuyển dụng để xem xét bước tiếp theo.`
          ].filter(Boolean),
          facts: [
            { label: 'Vòng đánh giá', value: (evaluation && evaluation.round) || '' },
            { label: 'Người đánh giá', value: (evaluation && evaluation.evaluatorName) || '' },
            { label: 'Điểm tổng', value: score },
            { label: 'Kết luận', value: verdict }
          ],
          closing: `Cảm ơn bạn đã dành thời gian cho buổi phỏng vấn.\n\n${signOff}`
        };
      }

      case 'decision': {
        const hired = ctx.status === 'hired';
        return {
          subject: hired
            ? `[SmartATS] Chúc mừng! Bạn đã trúng tuyển vị trí ${position}`
            : `[SmartATS] Kết quả ứng tuyển vị trí ${position}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: hired
            ? [
                `Chúc mừng bạn! Sau khi hoàn tất quy trình tuyển dụng, chúng tôi vui mừng thông báo bạn đã trúng tuyển vị trí ${position} tại ${company}.`,
                ctx.note ? `Ghi chú từ bộ phận Tuyển dụng: ${ctx.note}` : '',
                `Bộ phận Nhân sự sẽ liên hệ để trao đổi về thư mời làm việc và ngày bắt đầu trong thời gian sớm nhất.`
              ].filter(Boolean)
            : [
                `Cảm ơn bạn đã ứng tuyển và dành thời gian tham gia quy trình tuyển dụng cho vị trí ${position} tại ${company}.`,
                `Sau khi cân nhắc kỹ lưỡng, chúng tôi rất tiếc phải thông báo hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.`,
                ctx.note ? `Ghi chú từ bộ phận Tuyển dụng: ${ctx.note}` : '',
                `Hồ sơ của bạn sẽ được lưu lại và chúng tôi sẽ liên hệ khi có vị trí phù hợp hơn.`
              ].filter(Boolean),
          facts: [{ label: 'Vị trí', value: position }, { label: 'Kết quả', value: hired ? 'Trúng tuyển' : 'Không đạt' }],
          closing: signOff
        };
      }

      // Thư do HR tự soạn trong Hộp thư ứng viên.
      case 'custom': {
        const body = String(ctx.body || '').trim();
        return {
          subject: String(ctx.subject || '').trim() || `[SmartATS] Thông báo về hồ sơ ${position}`,
          greeting: `Kính gửi ${name},`,
          paragraphs: body ? body.split(/\n+/).map(line => line.trim()).filter(Boolean) : [],
          facts: ctx.showPosition && position ? [{ label: 'Vị trí', value: position }] : [],
          closing: signOff
        };
      }

      default:
        return null;
    }
  }

  function dispatchCandidateEmail(type, ctx = {}) {
    const candidate = ctx.candidate || {};
    const to = candidateEmailOf({ ...ctx, candidate });
    if (!to) return null;

    const message = composeCandidateEmail(type, ctx);
    if (!message) return null;

    const record = {
      id: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type,
      typeLabel: (EMAIL_TYPE_META[type] || {}).label || 'Thông báo',
      icon: (EMAIL_TYPE_META[type] || {}).icon || 'mail',
      status: 'sent',
      to,
      recipientName: candidate.fullName || (ctx.application && ctx.application.candidateName) || to,
      from: (_data.settings && _data.settings.companyEmail) || 'hr@smartats.vn',
      subject: message.subject,
      greeting: message.greeting,
      paragraphs: message.paragraphs,
      facts: message.facts,
      closing: message.closing,
      candidateId: candidate.id || (ctx.application && ctx.application.candidateId) || null,
      applicationId: (ctx.application && ctx.application.id) || null,
      relatedId: (ctx.interview && ctx.interview.id) || (ctx.evaluation && ctx.evaluation.id) || null,
      createdAt: new Date().toISOString()
    };

    _data.emailLog = _data.emailLog || [];
    _data.emailLog.unshift(record);
    saveState();
    return record;
  }

  function findCandidateFor(application) {
    if (!application) return {};
    return (_data.candidates || []).find(c => c.id === application.candidateId) || {
      fullName: application.candidateName,
      email: application.email
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Public Store API
  // ─────────────────────────────────────────────────────────────
  return {
    // ── User & Auth ────────────────────────────────────────────
    getCurrentUser() {
      return _currentUser;
    },

    setCurrentUser(user) {
      _currentUser = user;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    },

    getUsers() {
      return _data.users || [];
    },

    getUserById(id) {
      return (_data.users || []).find(u => u.id === id);
    },

    createUser(data = {}) {
      const username = String(data.username || '').trim().toLowerCase();
      const fullName = String(data.fullName || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      const password = String(data.password || '').trim();
      const role = String(data.role || 'hr').trim();

      if (!fullName || !username || !email || !password) {
        return { success: false, message: 'Vui lòng nhập đầy đủ họ tên, tài khoản, email và mật khẩu.' };
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return { success: false, message: 'Tài khoản phải dài 3–32 ký tự, chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, message: 'Email chưa đúng định dạng.' };
      }
      if (password.length < 6) {
        return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' };
      }
      if ((_data.users || []).some(u => u.username.toLowerCase() === username)) {
        return { success: false, message: `Tài khoản “${username}” đã tồn tại.` };
      }
      if ((_data.users || []).some(u => (u.email || '').toLowerCase() === email)) {
        return { success: false, message: `Email “${email}” đã được dùng cho tài khoản khác.` };
      }
      if (!['director', 'department_head', 'hr', 'candidate'].includes(role)) {
        return { success: false, message: 'Vai trò không hợp lệ.' };
      }

      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const avatar = nameParts.slice(-3).map(part => part.charAt(0).toUpperCase()).join('') || 'USR';
      const user = {
        id: 'usr_' + Date.now(),
        username,
        password,
        fullName,
        email,
        phone: String(data.phone || '').trim(),
        role,
        department: String(data.department || '').trim() || 'Phòng Nhân sự',
        title: String(data.title || '').trim() || Helpers.getRoleLabel(role),
        status: 'active',
        avatar
      };

      _data.users.push(user);
      saveState();
      return { success: true, user };
    },

    updateUser(id, updates = {}) {
      const user = (_data.users || []).find(u => u.id === id);
      if (!user) return { success: false, message: 'Không tìm thấy tài khoản.' };

      const email = String(updates.email ?? user.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, message: 'Email chưa đúng định dạng.' };
      }
      if ((_data.users || []).some(u => u.id !== id && (u.email || '').toLowerCase() === email)) {
        return { success: false, message: `Email “${email}” đã được dùng cho tài khoản khác.` };
      }

      const allowed = ['fullName', 'email', 'phone', 'title', 'department'];
      allowed.forEach(key => {
        if (updates[key] !== undefined) user[key] = String(updates[key]).trim();
      });
      user.email = email;

      if (_currentUser && _currentUser.id === id) {
        _currentUser = { ...user };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(_currentUser));
      }

      saveState();
      return { success: true, user };
    },

    login(username, password) {
      const user = (_data.users || []).find(u => u.username === username.trim() && u.password === password.trim());
      // Candidates never authenticate: they only use the public career portal.
      if (user && user.role !== 'candidate') {
        this.setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    },

    logout() {
      _currentUser = null;
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.hash = '#/login';
    },

    // ── Departments ────────────────────────────────────────────
    getDepartments() {
      return _data.departments || [];
    },

    // ── Dashboard Dynamic Stats ────────────────────────────────
    getDashboardStats() {
      const reqs = _data.requisitions || [];
      const apps = _data.applications || [];
      const ivs = _data.interviews || [];

      const activeRequisitions = reqs.filter(r => r.status === 'recruiting' || r.status === 'approved').length;
      const totalCandidates = apps.length;
      const pendingReview = apps.filter(a => a.status === 'pending_review').length;
      const passedScreening = apps.filter(a => a.status === 'passed_screening').length;
      const upcomingInterviews = ivs.filter(i => i.status === 'confirmed').length;
      const hired = apps.filter(a => a.status === 'hired').length;

      // Group by stage
      const candidatesByStage = {
        pending_review: apps.filter(a => a.status === 'pending_review').length,
        reviewing: apps.filter(a => a.status === 'reviewing').length,
        passed_screening: apps.filter(a => a.status === 'passed_screening').length,
        interview_scheduled: apps.filter(a => a.status === 'interview_scheduled').length,
        proposed: apps.filter(a => a.status === 'proposed').length,
        hired: apps.filter(a => a.status === 'hired').length,
        rejected: apps.filter(a => a.status === 'rejected').length
      };

      // Group by source
      const candidatesBySource = {};
      apps.forEach(a => {
        const src = a.source || 'other';
        candidatesBySource[src] = (candidatesBySource[src] || 0) + 1;
      });

      // Filter upcoming interviews
      const nowStr = new Date().toISOString().split('T')[0];
      const upcomingInterviewsList = ivs
        .filter(i => i.status === 'confirmed')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Pending applications list
      const pendingApplicationsList = apps
        .filter(a => a.status === 'pending_review' || a.status === 'reviewing')
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

      return {
        activeRequisitions,
        totalCandidates,
        pendingReview,
        passedScreening,
        upcomingInterviews,
        hired,
        candidatesByStage,
        candidatesBySource,
        upcomingInterviewsList,
        pendingApplicationsList
      };
    },

    // ── Requisitions ───────────────────────────────────────────
    getRequisitions(filters = {}) {
      let list = [...(_data.requisitions || [])];
      if (filters.status && filters.status !== 'all') {
        list = list.filter(r => r.status === filters.status);
      }
      if (filters.department && filters.department !== 'all') {
        list = list.filter(r => r.department === filters.department);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(r => (r.title && r.title.toLowerCase().includes(q)) || (r.code && r.code.toLowerCase().includes(q)));
      }
      return list;
    },

    getRequisitionById(id) {
      return (_data.requisitions || []).find(r => r.id === id);
    },

    createRequisition(data) {
      const code = Helpers.generateCode('YCTD');
      const newReq = {
        id: 'req_' + Date.now(),
        code,
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvalHistory: [
          {
            status: 'pending',
            by: _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Người dùng',
            date: new Date().toISOString(),
            note: 'Tạo mới yêu cầu tuyển dụng'
          }
        ],
        ...data
      };
      _data.requisitions.unshift(newReq);
      saveState();
      return newReq;
    },

    updateRequisition(id, updates) {
      const idx = (_data.requisitions || []).findIndex(r => r.id === id);
      if (idx !== -1) {
        _data.requisitions[idx] = { ..._data.requisitions[idx], ...updates };
        saveState();
        return _data.requisitions[idx];
      }
      return null;
    },

    deleteRequisition(id) {
      _data.requisitions = (_data.requisitions || []).filter(r => r.id !== id);
      saveState();
      return true;
    },

    approveRequisition(id, approved = true, note = '') {
      const req = this.getRequisitionById(id);
      if (!req) return null;
      const newStatus = approved ? 'approved' : 'rejected';
      req.status = newStatus;
      req.approvalHistory = req.approvalHistory || [];
      req.approvalHistory.push({
        status: newStatus,
        by: _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Giám đốc',
        date: new Date().toISOString(),
        note: note || (approved ? 'Đã phê duyệt yêu cầu' : 'Từ chối yêu cầu')
      });
      saveState();
      return req;
    },

    // ── Postings ───────────────────────────────────────────────
    getPostings(filters = {}) {
      let list = [...(_data.postings || [])];
      if (filters.status && filters.status !== 'all') {
        list = list.filter(p => p.status === filters.status);
      }
      if (filters.department && filters.department !== 'all') {
        list = list.filter(p => p.department === filters.department);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.code && p.code.toLowerCase().includes(q)));
      }
      return list;
    },

    getPostingById(id) {
      return (_data.postings || []).find(p => p.id === id);
    },

    createPostingFromRequisition(requisitionId, postingData = {}) {
      const req = this.getRequisitionById(requisitionId);
      if (!req) return null;

      const code = Helpers.generateCode('TND');
      const newPosting = {
        id: 'post_' + Date.now(),
        requisitionId,
        code,
        title: postingData.title || req.title,
        department: req.department,
        salary: postingData.salary || req.salary,
        location: postingData.location || req.location,
        workType: postingData.workType || req.workType,
        deadline: postingData.deadline || req.deadline,
        status: 'published',
        publishedAt: new Date().toISOString(),
        views: 0,
        applicantsCount: 0,
        channels: {
          website: { active: true, url: `#/portal/job/post_${Date.now()}`, syncStatus: 'Đã xuất bản', applicants: 0 },
          topcv: { active: false, url: '', syncStatus: 'Chưa cấu hình', applicants: 0 },
          linkedin: { active: false, url: '', syncStatus: 'Chưa cấu hình', applicants: 0 },
          vietnamworks: { active: false, url: '', syncStatus: 'Chưa cấu hình', applicants: 0 }
        },
        description: postingData.description || req.description,
        requirements: postingData.requirements || req.requirements,
        benefits: postingData.benefits || '- Lương thưởng cạnh tranh\n- Bảo hiểm sức khỏe PVI cao cấp\n- Đào tạo và phát triển',
        ...postingData
      };

      // Set requisition status to recruiting
      req.status = 'recruiting';
      req.approvalHistory = req.approvalHistory || [];
      req.approvalHistory.push({
        status: 'recruiting',
        by: _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Nhân sự',
        date: new Date().toISOString(),
        note: `Đã tạo và đăng tin tuyển dụng ${code}`
      });

      _data.postings.unshift(newPosting);
      saveState();
      return newPosting;
    },

    updatePosting(id, updates) {
      const idx = (_data.postings || []).findIndex(p => p.id === id);
      if (idx !== -1) {
        _data.postings[idx] = { ..._data.postings[idx], ...updates };
        saveState();
        return _data.postings[idx];
      }
      return null;
    },

    // ── Candidates & Applications ──────────────────────────────
    getCandidates() {
      return _data.candidates || [];
    },

    getCandidateById(id) {
      return (_data.candidates || []).find(c => c.id === id);
    },

    getApplications(filters = {}) {
      let list = [...(_data.applications || [])];

      if (filters.status && filters.status !== 'all') {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters.requisitionId && filters.requisitionId !== 'all') {
        list = list.filter(a => a.requisitionId === filters.requisitionId);
      }
      if (filters.source && filters.source !== 'all') {
        list = list.filter(a => a.source === filters.source);
      }
      if (filters.screeningResult && filters.screeningResult !== 'all') {
        list = list.filter(a => a.screeningResult === filters.screeningResult);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(a =>
          (a.candidateName && a.candidateName.toLowerCase().includes(q)) ||
          (a.positionTitle && a.positionTitle.toLowerCase().includes(q))
        );
      }
      if (filters.sortBy) {
        if (filters.sortBy === 'date_desc') {
          list.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
        } else if (filters.sortBy === 'date_asc') {
          list.sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate));
        } else if (filters.sortBy === 'score_desc') {
          list.sort((a, b) => (b.screeningScore || 0) - (a.screeningScore || 0));
        } else if (filters.sortBy === 'score_asc') {
          list.sort((a, b) => (a.screeningScore || 0) - (b.screeningScore || 0));
        }
      } else {
        list.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
      }

      return list;
    },

    getApplicationById(id) {
      return (_data.applications || []).find(a => a.id === id);
    },

    updateApplicationStatus(applicationId, newStatus, note = '', options = {}) {
      const app = this.getApplicationById(applicationId);
      if (!app) return null;

      const oldStatus = app.status;
      app.status = newStatus;

      app.statusHistory = app.statusHistory || [];
      app.statusHistory.push({
        status: newStatus,
        changedBy: _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Nhân sự',
        timestamp: new Date().toISOString(),
        note: note || `Chuyển trạng thái từ ${Helpers.getStatusLabel(oldStatus)} sang ${Helpers.getStatusLabel(newStatus)}`
      });

      saveState();

      // A hiring decision always reaches the candidate by e-mail, no manual step.
      if (
        options.notify !== false &&
        oldStatus !== newStatus &&
        (newStatus === 'hired' || newStatus === 'rejected')
      ) {
        const candidate = findCandidateFor(app);
        const mail = dispatchCandidateEmail('decision', {
          candidate,
          application: app,
          status: newStatus,
          note
        });
        if (mail) app.decisionEmailId = mail.id;
        saveState();
      }

      return app;
    },

    markForManualReview(applicationId, note = '') {
      const app = this.getApplicationById(applicationId);
      if (!app) return null;

      app.manualReview = true;
      app.manualReviewAt = new Date().toISOString();
      app.manualReviewBy = _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Nhân sự';

      this.updateApplicationStatus(applicationId, 'reviewing', note || 'Đánh dấu cần kiểm tra thủ công', { notify: false });
      return this.getApplicationById(applicationId);
    },

    addApplicationNote(applicationId, content) {
      const app = this.getApplicationById(applicationId);
      if (!app) return null;

      app.internalNotes = app.internalNotes || [];
      app.internalNotes.push({
        author: _currentUser ? (_currentUser.fullName || _currentUser.username) : 'Nhân sự',
        timestamp: new Date().toISOString(),
        content
      });

      saveState();
      return app;
    },

    /**
     * Submit application (from candidate portal or manual HR upload)
     */
    submitApplication({ candidateData, requisitionId, postingId = null, source = 'website' }) {
      const req = this.getRequisitionById(requisitionId);
      if (!req) return null;

      // Check if candidate exists by email or create new
      let cand = (_data.candidates || []).find(c => c.email.toLowerCase() === candidateData.email.toLowerCase());
      if (!cand) {
        cand = {
          id: 'cand_' + Date.now(),
          fullName: candidateData.fullName,
          email: candidateData.email,
          phone: candidateData.phone || '',
          gender: candidateData.gender || 'Khác',
          dob: candidateData.dob || '',
          address: candidateData.address || '',
          education: candidateData.education || '',
          experienceYears: candidateData.experienceYears || 0,
          skills: candidateData.skills || [],
          certifications: candidateData.certifications || [],
          rawResumeText: candidateData.rawResumeText || ''
        };
        _data.candidates.push(cand);
      }

      // Auto-evaluate candidate against the configured criteria.
      // Pass = score >= pass threshold AND no unmet mandatory criterion.
      const screening = CVEngine.evaluateCandidate(cand, req);
      const passThreshold = _data.settings?.scoreThresholds?.pass ?? 80;
      const autoApproveEnabled = _data.settings?.autoApproveEnabled !== false;
      const autoApproved = autoApproveEnabled
        && screening.classification === 'pass'
        && screening.score >= passThreshold;
      const receivedAt = new Date().toISOString();
      const statusHistory = [
        {
          status: 'pending_review',
          changedBy: source === 'website' ? 'Cổng ứng viên Website' : (source.toUpperCase() + ' Sync'),
          timestamp: receivedAt,
          note: 'Tiếp nhận hồ sơ ứng tuyển mới'
        }
      ];

      if (autoApproved) {
        statusHistory.push({
          status: 'passed_screening',
          changedBy: 'AI Screening',
          timestamp: receivedAt,
          note: `AI tự động duyệt hồ sơ: ${screening.score} điểm ≥ ngưỡng ${passThreshold}, đáp ứng đủ tiêu chí bắt buộc.`
        });
      }

      const newApp = {
        id: 'app_' + Date.now(),
        candidateId: cand.id,
        candidateName: cand.fullName,
        requisitionId: req.id,
        postingId: postingId || (req.postings && req.postings[0]) || null,
        positionTitle: req.title,
        source: source,
        appliedDate: receivedAt,
        status: autoApproved ? 'passed_screening' : 'pending_review',
        assignedTo: 'usr_hr1',
        assigneeName: 'Nguyễn Thu Hà',
        screeningScore: screening.score,
        screeningResult: screening.classification,
        screeningDetails: { ...screening, autoApproved, autoApproveThreshold: passThreshold },
        statusHistory,
        internalNotes: []
      };

      _data.applications.unshift(newApp);

      // Increment posting applicants count
      if (postingId) {
        const post = this.getPostingById(postingId);
        if (post) {
          post.applicantsCount = (post.applicantsCount || 0) + 1;
        }
      }

      // Add Notification
      _data.notifications.unshift({
        id: 'notif_' + Date.now(),
        title: autoApproved ? 'AI đã duyệt hồ sơ đạt tiêu chí' : 'Hồ sơ mới cần HR xem xét',
        message: autoApproved
          ? `${cand.fullName} đạt ${screening.score} điểm và được AI chuyển sang bước Đạt sàng lọc cho vị trí ${req.title}.`
          : `${cand.fullName} vừa nộp hồ sơ vị trí ${req.title} từ nguồn ${source} (${screening.score} điểm, cần HR xem xét).`,
        date: receivedAt,
        read: false,
        icon: autoApproved ? 'sparkles' : 'user-plus',
        link: `#/candidates/${newApp.id}`
      });

      saveState();
      return newApp;
    },

    // ── Interviews ─────────────────────────────────────────────
    getInterviews(filters = {}) {
      let list = [...(_data.interviews || [])];
      if (filters.status && filters.status !== 'all') {
        list = list.filter(i => i.status === filters.status);
      }
      if (filters.interviewer && filters.interviewer !== 'all') {
        list = list.filter(i => (i.interviewers || []).includes(filters.interviewer));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(i =>
          (i.candidateName && i.candidateName.toLowerCase().includes(q)) ||
          (i.positionTitle && i.positionTitle.toLowerCase().includes(q)) ||
          (i.code && i.code.toLowerCase().includes(q))
        );
      }
      return list;
    },

    getInterviewById(id) {
      return (_data.interviews || []).find(i => i.id === id);
    },

    /**
     * Detect a scheduling clash before an interview is written.
     * Two kinds are reported:
     *  – interviewerConflict: a panellist is already booked in that slot
     *  – candidateConflict:   the same candidate is already booked in that slot
     */
    checkInterviewConflict(date, startTime, endTime, interviewers = [], excludeId = null, candidateId = null) {
      const conflicts = [];
      const ivs = (_data.interviews || []).filter(i => i.date === date && i.id !== excludeId && i.status !== 'cancelled');

      ivs.forEach(iv => {
        // Time overlap condition: (StartA < EndB) and (EndA > StartB)
        if (startTime < iv.endTime && endTime > iv.startTime) {
          const sharedInterviewers = (iv.interviewers || []).filter(inv => interviewers.includes(inv));
          const sameCandidate = !!candidateId && iv.candidateId === candidateId;
          if (sharedInterviewers.length > 0 || sameCandidate) {
            conflicts.push({
              interview: iv,
              conflictingInterviewers: sharedInterviewers,
              interviewerConflict: sharedInterviewers.length > 0,
              candidateConflict: sameCandidate
            });
          }
        }
      });

      return conflicts;
    },

    createInterview(data) {
      // A candidate can never hold two interviews in the same slot.
      const candidateClash = this.checkInterviewConflict(
        data.date, data.startTime, data.endTime, data.interviewers || [], null, data.candidateId
      ).find(c => c.candidateConflict);

      if (candidateClash) {
        const clash = candidateClash.interview;
        return {
          success: false,
          conflict: candidateClash,
          message: `Không thể xếp lịch: ${data.candidateName || 'ứng viên'} đã có lịch phỏng vấn ${clash.startTime} – ${clash.endTime} ngày ${Helpers.formatDate(clash.date)} (${clash.round}). Vui lòng chọn khung giờ khác.`
        };
      }

      const code = Helpers.generateCode('LPV');
      const newIv = {
        id: 'iv_' + Date.now(),
        code,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        ...data
      };

      _data.interviews.unshift(newIv);

      // Auto update candidate application status to interview_scheduled
      let app = null;
      if (data.candidateId && data.requisitionId) {
        app = (_data.applications || []).find(a => a.candidateId === data.candidateId && a.requisitionId === data.requisitionId);
        if (app && app.status !== 'interview_scheduled') {
          this.updateApplicationStatus(app.id, 'interview_scheduled', `Đã tạo lịch phỏng vấn ${code} (${data.round})`);
        }
      }

      // Automatic invitation e-mail to the candidate.
      const candidate = (data.candidateId && (_data.candidates || []).find(c => c.id === data.candidateId))
        || { fullName: data.candidateName, email: data.email };
      const invite = dispatchCandidateEmail('interview_invite', { candidate, application: app, interview: newIv });
      if (invite) newIv.inviteEmailId = invite.id;

      saveState();
      return newIv;
    },

    updateInterview(id, updates) {
      const idx = (_data.interviews || []).findIndex(i => i.id === id);
      if (idx === -1) return null;

      const prev = _data.interviews[idx];
      const next = { ...prev, ...updates };
      const timingChanged = ['date', 'startTime', 'endTime'].some(key =>
        Object.prototype.hasOwnProperty.call(updates, key) && String(updates[key]) !== String(prev[key] ?? '')
      );

      if (timingChanged) {
        const candidateClash = this.checkInterviewConflict(
          next.date, next.startTime, next.endTime, next.interviewers || [], id, next.candidateId
        ).find(c => c.candidateConflict);

        if (candidateClash) {
          const clash = candidateClash.interview;
          return {
            success: false,
            conflict: candidateClash,
            message: `Không thể đổi lịch: ${next.candidateName || 'ứng viên'} đã có lịch phỏng vấn ${clash.startTime} – ${clash.endTime} ngày ${Helpers.formatDate(clash.date)} (${clash.round}).`
          };
        }
      }

      _data.interviews[idx] = next;
      saveState();

      // Lần đầu chuyển sang "Đã xác nhận": gửi thư mời tới email ứng viên đã đăng ký khi nộp CV.
      const confirmedNow = String(next.status) === 'confirmed' && String(prev.status) !== 'confirmed';
      if (confirmedNow && !next.inviteEmailId) {
        const candidate = (_data.candidates || []).find(c => c.id === next.candidateId)
          || { fullName: next.candidateName, email: next.email };
        const app = (_data.applications || []).find(a => a.candidateId === next.candidateId && a.requisitionId === next.requisitionId);
        const invite = dispatchCandidateEmail('interview_invite', { candidate, application: app, interview: next });
        if (invite) {
          _data.interviews[idx].inviteEmailId = invite.id;
          saveState();
        }
      }

      if (timingChanged) {
        const candidate = (_data.candidates || []).find(c => c.id === next.candidateId)
          || { fullName: next.candidateName };
        const app = (_data.applications || []).find(a => a.candidateId === next.candidateId && a.requisitionId === next.requisitionId);
        const mail = dispatchCandidateEmail('interview_reschedule', { candidate, application: app, interview: next });
        if (mail) {
          _data.interviews[idx].rescheduleEmailId = mail.id;
          saveState();
        }
      }

      return _data.interviews[idx];
    },

    cancelInterview(id, reason = '') {
      const iv = this.getInterviewById(id);
      if (!iv) return null;
      iv.status = 'cancelled';
      iv.cancelReason = reason;

      const candidate = (_data.candidates || []).find(c => c.id === iv.candidateId)
        || { fullName: iv.candidateName };
      const mail = dispatchCandidateEmail('interview_cancel', { candidate, interview: iv, note: reason });
      if (mail) iv.cancelEmailId = mail.id;

      saveState();
      return iv;
    },

    // ── Evaluations ────────────────────────────────────────────
    getEvaluations(candidateId = null) {
      let list = [...(_data.evaluations || [])];
      if (candidateId) {
        list = list.filter(e => e.candidateId === candidateId);
      }
      return list;
    },

    createEvaluation(data) {
      const newEval = {
        id: 'eval_' + Date.now(),
        createdAt: new Date().toISOString(),
        ...data
      };
      _data.evaluations.unshift(newEval);

      // If recommendation is proposed, update application status
      let app = null;
      if (data.candidateId && data.requisitionId) {
        app = (_data.applications || []).find(a => a.candidateId === data.candidateId && a.requisitionId === data.requisitionId);
        if (app) {
          if (data.finalDecision === 'Đề xuất tuyển dụng' || data.recommendation === 'continue') {
            // the evaluation e-mail below covers this step; skip a duplicate decision mail
            this.updateApplicationStatus(app.id, 'proposed', `Người phỏng vấn (${data.evaluatorName}) đề xuất tuyển dụng sau ${data.round}`, { notify: false });
          } else if (data.recommendation === 'reject') {
            this.updateApplicationStatus(app.id, 'rejected', `Người phỏng vấn (${data.evaluatorName}) đánh giá không đạt tiêu chí`, { notify: false });
          }
        }
      }

      // Automatic result e-mail to the candidate.
      const candidate = (data.candidateId && (_data.candidates || []).find(c => c.id === data.candidateId))
        || { fullName: data.candidateName };
      const mail = dispatchCandidateEmail('evaluation_result', {
        candidate,
        application: app,
        evaluation: newEval
      });
      if (mail) newEval.resultEmailId = mail.id;

      saveState();
      return newEval;
    },

    // ── Reports Analytics Dynamic Engine ───────────────────────
    getRecruitmentReport(filters = {}) {
      const allApps = _data.applications || [];
      const allReqs = _data.requisitions || [];
      const allPosts = _data.postings || [];
      const reqById = new Map(allReqs.map(r => [r.id, r]));
      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();

      const matchesTime = (value) => {
        if (!filters.timeRange || filters.timeRange === 'all') return true;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        if (filters.timeRange === 'this_month') {
          return d.getFullYear() === nowYear && d.getMonth() === nowMonth;
        }
        if (filters.timeRange === 'this_quarter') {
          return d.getFullYear() === nowYear
            && Math.floor(d.getMonth() / 3) === Math.floor(nowMonth / 3);
        }
        if (filters.timeRange === 'this_year') return d.getFullYear() === nowYear;
        return true;
      };

      const matchesDept = (dept) => !filters.department
        || filters.department === 'all'
        || dept === filters.department;

      const departmentOfApp = (app) => (reqById.get(app.requisitionId) || {}).department || '';
      const apps = allApps.filter(a => matchesTime(a.appliedDate) && matchesDept(departmentOfApp(a)));
      const reqs = allReqs.filter(r => matchesDept(r.department));
      const posts = allPosts.filter(p => matchesDept(p.department) && matchesTime(p.publishedAt));

      // 9.1 Summary Overview
      const totalApplications = apps.length;
      const reviewingCount = apps.filter(a => a.status === 'reviewing' || a.status === 'pending_review').length;
      const interviewedCount = apps.filter(a => a.status === 'interview_scheduled' || a.status === 'proposed' || a.status === 'hired').length;
      const proposedCount = apps.filter(a => a.status === 'proposed' || a.status === 'hired').length;
      const hiredCount = apps.filter(a => a.status === 'hired').length;
      const activePositions = reqs.filter(r => r.status === 'recruiting' || r.status === 'approved').length;
      const closedPositions = reqs.filter(r => r.status === 'closed').length;

      // 9.2 Funnel — count applications that reached each stage, not just current status
      const passedScreeningCount = apps.filter(a =>
        a.screeningResult === 'pass'
        || ['passed_screening', 'interview_scheduled', 'proposed', 'hired'].includes(a.status)
      ).length;

      const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;
      const drop = (previous, current) => previous > 0
        ? Math.max(0, Math.round(((previous - current) / previous) * 100))
        : 0;

      const funnelStages = [
        { stage: 'Hồ sơ tiếp nhận', count: totalApplications, rate: '100%', dropRate: '0%' },
        { stage: 'Đạt sàng lọc CV', count: passedScreeningCount, rate: pct(passedScreeningCount, totalApplications) + '%', dropRate: drop(totalApplications, passedScreeningCount) + '%' },
        { stage: 'Mời & Phỏng vấn', count: interviewedCount, rate: pct(interviewedCount, passedScreeningCount) + '%', dropRate: drop(passedScreeningCount, interviewedCount) + '%' },
        { stage: 'Đề xuất tuyển dụng', count: proposedCount, rate: pct(proposedCount, interviewedCount) + '%', dropRate: drop(interviewedCount, proposedCount) + '%' },
        { stage: 'Tuyển dụng thành công', count: hiredCount, rate: pct(hiredCount, proposedCount) + '%', dropRate: drop(proposedCount, hiredCount) + '%' }
      ];

      // 9.3 Time & Cost to hire
      const hiredApps = apps.filter(a => a.status === 'hired');
      const hireDurations = hiredApps.map(a => {
        const hiredEvent = (a.statusHistory || []).find(h => h.status === 'hired');
        if (!hiredEvent) return null;
        const days = Math.round((new Date(hiredEvent.timestamp) - new Date(a.appliedDate)) / (1000 * 60 * 60 * 24));
        return Number.isFinite(days) && days >= 0 ? Math.max(1, days) : null;
      }).filter(d => d !== null);

      const avgTimeToHireDays = hireDurations.length > 0
        ? Math.round(hireDurations.reduce((sum, d) => sum + d, 0) / hireDurations.length)
        : 0;
      const totalRecruitmentCost = 45000000;
      const avgCostPerHire = hiredCount > 0 ? Math.round(totalRecruitmentCost / hiredCount) : 0;

      const positionsTime = reqs.slice(0, 6).map(r => {
        const reqApps = apps.filter(a => a.requisitionId === r.id);
        const avgDays = reqApps.length > 0
          ? Math.round(reqApps.reduce((sum, a) => {
              const days = Math.round((now - new Date(a.appliedDate)) / (1000 * 60 * 60 * 24));
              return sum + (Number.isFinite(days) ? Math.max(1, days) : 1);
            }, 0) / reqApps.length)
          : 0;
        return {
          position: r.title,
          department: r.department,
          avgDays,
          cost: Math.round(totalRecruitmentCost / Math.max(1, reqs.length))
        };
      });

      const timeAndCost = {
        avgTimeToHireDays,
        totalRecruitmentCost,
        avgCostPerHire,
        positionsTime,
        isDemoEstimate: true
      };

      // 9.4 Sourcing Efficiency
      const sourcesMap = {
        website: { name: 'Website Tuyển dụng', apps: 0, passed: 0, interviewed: 0, hired: 0, cost: 5000000, costLabel: '5.000.000 VNĐ' },
        linkedin: { name: 'LinkedIn Jobs', apps: 0, passed: 0, interviewed: 0, hired: 0, cost: 20000000, costLabel: '20.000.000 VNĐ' },
        topcv: { name: 'TopCV', apps: 0, passed: 0, interviewed: 0, hired: 0, cost: 15000000, costLabel: '15.000.000 VNĐ' },
        vietnamworks: { name: 'VietnamWorks', apps: 0, passed: 0, interviewed: 0, hired: 0, cost: 0, costLabel: '0 VNĐ' },
        referral: { name: 'Giới thiệu nội bộ (Referral)', apps: 0, passed: 0, interviewed: 0, hired: 0, cost: 5000000, costLabel: '5.000.000 VNĐ' }
      };

      apps.forEach(a => {
        const src = sourcesMap[a.source] || sourcesMap['website'];
        src.apps++;
        if (a.screeningResult === 'pass' || ['passed_screening', 'interview_scheduled', 'proposed', 'hired'].includes(a.status)) src.passed++;
        if (a.status === 'interview_scheduled' || a.status === 'proposed' || a.status === 'hired') src.interviewed++;
        if (a.status === 'hired') src.hired++;
      });

      const sourcingList = Object.keys(sourcesMap).map(k => {
        const item = sourcesMap[k];
        return {
          sourceKey: k,
          sourceName: item.name,
          totalApps: item.apps,
          passed: item.passed,
          interviewed: item.interviewed,
          hired: item.hired,
          conversionRate: pct(item.hired, item.apps) + '%',
          passRate: pct(item.passed, item.apps) + '%',
          cost: item.costLabel,
          costValue: item.cost,
          costPerHire: item.hired > 0 ? Math.round(item.cost / item.hired) : null
        };
      });

      // 9.5 Job Postings Duration & Aging Alert
      const postingsReport = posts.map(p => {
        const pubDate = new Date(p.publishedAt || Date.now());
        const daysActive = Math.max(1, Math.round((now - pubDate.getTime()) / (1000 * 60 * 60 * 24)));
        const isExpiringSoon = daysActive >= 25 && daysActive <= 30;
        const isProlonged = daysActive > 30;
        const appCount = apps.filter(a => a.postingId === p.id).length;
        return {
          id: p.id,
          code: p.code,
          title: p.title,
          department: p.department,
          status: p.status,
          publishedAt: p.publishedAt,
          daysActive,
          applicantsCount: appCount || p.applicantsCount || 0,
          isExpiringSoon,
          isProlonged
        };
      });

      return {
        overview: {
          totalApplications,
          reviewingCount,
          interviewedCount,
          proposedCount,
          hiredCount,
          activePositions,
          closedPositions
        },
        funnel: funnelStages,
        timeAndCost,
        sourcing: sourcingList,
        postings: postingsReport,
        filters: { ...filters }
      };
    },

    // ── Notifications ──────────────────────────────────────────
    getNotifications() {
      return _data.notifications || [];
    },

    getUnreadCount() {
      return (_data.notifications || []).filter(n => !n.read).length;
    },

    markAllNotificationsRead() {
      (_data.notifications || []).forEach(n => { n.read = true; });
      saveState();
    },

    markNotificationRead(id) {
      const notif = (_data.notifications || []).find(n => n.id === id);
      if (notif) {
        notif.read = true;
        saveState();
      }
    },

    // ── Candidate e-mail outbox ────────────────────────────────
    getEmails(filters = {}) {
      let list = [...(_data.emailLog || [])];
      if (filters.type && filters.type !== 'all') {
        list = list.filter(m => m.type === filters.type);
      }
      if (filters.search) {
        const q = String(filters.search).trim().toLowerCase();
        list = list.filter(m =>
          (m.subject || '').toLowerCase().includes(q) ||
          (m.to || '').toLowerCase().includes(q) ||
          (m.recipientName || '').toLowerCase().includes(q)
        );
      }
      return list;
    },

    getEmailById(id) {
      return (_data.emailLog || []).find(m => m.id === id) || null;
    },

    getEmailsByApplication(applicationId) {
      return (_data.emailLog || []).filter(m => m.applicationId === applicationId);
    },

    getEmailCounts() {
      const list = _data.emailLog || [];
      const count = (type) => list.filter(m => m.type === type).length;
      return {
        all: list.length,
        interview_invite: count('interview_invite'),
        interview_reschedule: count('interview_reschedule'),
        interview_cancel: count('interview_cancel'),
        evaluation_result: count('evaluation_result'),
        decision: count('decision'),
        custom: count('custom')
      };
    },

    /**
     * HR chủ động soạn và gửi thư cho một ứng viên.
     * Thư đi vào cùng hộp thư với các thư tự động, máy chủ sẽ gửi ngay
     * sau khi bản ghi được đồng bộ lên PostgreSQL.
     */
    sendCandidateEmail({ candidateId, applicationId, subject, body } = {}) {
      const candidate = (_data.candidates || []).find(c => c.id === candidateId);
      if (!candidate) return { success: false, message: 'Không tìm thấy ứng viên cần gửi thư.' };
      if (!candidate.email) return { success: false, message: 'Ứng viên này chưa có địa chỉ email.' };

      const application = (_data.applications || []).find(a => a.id === applicationId)
        || (_data.applications || []).find(a => a.candidateId === candidate.id)
        || null;

      if (!String(subject || '').trim()) {
        return { success: false, message: 'Vui lòng nhập tiêu đề thư.' };
      }
      if (!String(body || '').trim()) {
        return { success: false, message: 'Vui lòng nhập nội dung thư.' };
      }

      const record = dispatchCandidateEmail('custom', {
        candidate,
        application,
        subject,
        body,
        showPosition: !!application
      });
      if (!record) return { success: false, message: 'Không soạn được thư. Vui lòng kiểm tra lại nội dung.' };

      return { success: true, email: record };
    },

    // ── Settings ───────────────────────────────────────────────
    getSettings() {
      return _data.settings || INITIAL_SETTINGS;
    },

    updateSettings(newSettings) {
      _data.settings = { ..._data.settings, ...newSettings };
      saveState();
      return _data.settings;
    },

    // ── Đồng bộ máy chủ (PostgreSQL) ───────────────────────────
    init,
    syncNow() { return flushSync(); },
    isServerBacked() { return _syncEnabled; },

    resetAllData() {
      resetToDefault();
      this.setCurrentUser(_data.users.find(u => u.username === 'hr1') || _data.users[0]);
    },

    // CV Parsing & NLP Screening Exposure
    parseCVText: CVEngine.parseText,
    evaluateCandidate: CVEngine.evaluateCandidate,
    analyzeNLPKeywords: CVEngine.analyzeNLPKeywords,
    analyzeCVWithNLP(cvText, reqOrId) {
      const req = typeof reqOrId === 'string' ? this.getRequisitionById(reqOrId) : reqOrId;
      const parsed = CVEngine.parseText(cvText);
      parsed.rawResumeText = cvText;
      return CVEngine.evaluateCandidate(parsed, req);
    }
  };
})();
