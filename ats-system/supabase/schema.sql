-- ============================================================================
-- SmartATS - Supabase Schema (PostgreSQL)
-- Chạy toàn bộ script này trong SQL Editor của Supabase Dashboard.
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS (người dùng hệ thống)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('director','department_head','hr','candidate')) not null default 'hr',
  department text,
  title text,
  status text check (status in ('active','inactive')) not null default 'active',
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. DEPARTMENTS (phòng ban)
create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

-- 3. REQUISITIONS (yêu cầu tuyển dụng)
create table if not exists public.requisitions (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  department_id uuid references public.departments(id),
  department text,
  quantity integer not null default 1,
  reason text,
  description text,
  requirements text,
  skills text[] default '{}',
  education text,
  min_experience numeric default 0,
  salary text,
  work_type text,
  location text,
  start_date date,
  deadline date,
  creator_id uuid references public.users(id),
  creator_name text,
  status text check (status in ('pending','approved','rejected','recruiting','closed')) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lịch sử phê duyệt requisition
create table if not exists public.requisition_approval_history (
  id uuid primary key default uuid_generate_v4(),
  requisition_id uuid references public.requisitions(id) on delete cascade,
  status text not null,
  by_user text,
  note text,
  created_at timestamptz not null default now()
);

-- 4. POSTINGS (tin tuyển dụng)
create table if not exists public.postings (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  requisition_id uuid references public.requisitions(id),
  title text not null,
  department text,
  salary text,
  location text,
  work_type text,
  deadline date,
  status text check (status in ('published','draft','expired','closed')) not null default 'published',
  published_at timestamptz,
  views integer default 0,
  applicants_count integer default 0,
  description text,
  requirements text,
  benefits text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. CANDIDATES (ứng viên)
create table if not exists public.candidates (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  gender text,
  dob date,
  address text,
  education text,
  experience_years numeric default 0,
  skills text[] default '{}',
  certifications text[] default '{}',
  current_company text,
  current_title text,
  raw_resume_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. APPLICATIONS (hồ sơ ứng tuyển)
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidates(id),
  candidate_name text,
  requisition_id uuid references public.requisitions(id),
  posting_id uuid references public.postings(id),
  position_title text,
  source text,
  applied_date timestamptz not null default now(),
  status text check (status in (
    'pending_review','reviewing','passed_screening','interview_scheduled',
    'proposed','hired','rejected','need_info'
  )) not null default 'pending_review',
  assigned_to uuid references public.users(id),
  assignee_name text,
  screening_score integer default 0,
  screening_result text,
  screening_details jsonb default '{}',
  status_history jsonb default '[]',
  internal_notes jsonb default '[]',
  decision_email_id text,
  invite_email_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. INTERVIEWS (lịch phỏng vấn)
create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  candidate_id uuid references public.candidates(id),
  candidate_name text,
  requisition_id uuid references public.requisitions(id),
  position_title text,
  round text,
  date date,
  start_time time,
  end_time time,
  type text check (type in ('online','onsite')) default 'online',
  location text,
  interviewers text[] default '{}',
  status text check (status in ('confirmed','pending','completed','cancelled')) default 'confirmed',
  notes text,
  invite_email_id text,
  reschedule_email_id text,
  cancel_email_id text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. EVALUATIONS (phiếu đánh giá phỏng vấn)
create table if not exists public.evaluations (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interviews(id),
  candidate_id uuid references public.candidates(id),
  candidate_name text,
  requisition_id uuid references public.requisitions(id),
  round text,
  evaluator_name text,
  evaluator_role text,
  scores jsonb default '{}',
  criteria_comments jsonb default '{}',
  overall_score integer default 0,
  recommendation text check (recommendation in ('continue','consider','reject')),
  final_decision text,
  comment text,
  result_email_id text,
  created_at timestamptz not null default now()
);

-- 9. NOTIFICATIONS (thông báo nội bộ)
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  title text,
  message text,
  date timestamptz not null default now(),
  read boolean default false,
  icon text,
  link text,
  created_at timestamptz not null default now()
);

-- 10. EMAIL_LOG (hộp thư tự động mô phỏng)
create table if not exists public.email_log (
  id text primary key,
  type text,
  type_label text,
  icon text,
  status text default 'sent',
  to_email text,
  recipient_name text,
  from_email text,
  subject text,
  greeting text,
  paragraphs jsonb default '[]',
  facts jsonb default '[]',
  closing text,
  candidate_id uuid references public.candidates(id),
  application_id uuid references public.applications(id),
  related_id text,
  created_at timestamptz not null default now()
);

-- 11. SETTINGS (cấu hình hệ thống)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  screening_weights jsonb default '{"skills":40,"experience":30,"education":15,"certifications":15}'::jsonb,
  score_thresholds jsonb default '{"pass":80,"manual_check":60}'::jsonb,
  auto_approve_enabled boolean default true,
  company_name text default 'SmartATS Solutions Việt Nam',
  company_email text default 'hr@smartats.vn',
  company_address text,
  hotline text,
  integrations jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes & RLS (Row Level Security)
-- ============================================================================

create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_candidate on public.applications(candidate_id);
create index if not exists idx_applications_requisition on public.applications(requisition_id);
create index if not exists idx_interviews_date on public.interviews(date);
create index if not exists idx_evaluations_candidate on public.evaluations(candidate_id);
create index if not exists idx_email_log_type on public.email_log(type);

-- Enable RLS
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.requisitions enable row level security;
alter table public.requisition_approval_history enable row level security;
alter table public.postings enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.evaluations enable row level security;
alter table public.notifications enable row level security;
alter table public.email_log enable row level security;
alter table public.settings enable row level security;

-- Policies: cho phép public read (prototype), auth write (tùy bạn chặt chẽ hơn sau)
create policy "Public read all" on public.users for select using (true);
create policy "Public read all" on public.departments for select using (true);
create policy "Public read all" on public.requisitions for select using (true);
create policy "Public read all" on public.requisition_approval_history for select using (true);
create policy "Public read all" on public.postings for select using (true);
create policy "Public read all" on public.candidates for select using (true);
create policy "Public read all" on public.applications for select using (true);
create policy "Public read all" on public.interviews for select using (true);
create policy "Public read all" on public.evaluations for select using (true);
create policy "Public read all" on public.notifications for select using (true);
create policy "Public read all" on public.email_log for select using (true);
create policy "Public read all" on public.settings for select using (true);

create policy "Authenticated insert all" on public.users for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.departments for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.requisitions for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.requisition_approval_history for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.postings for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.candidates for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.applications for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.interviews for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.evaluations for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.notifications for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.email_log for insert with check (auth.uid() is not null);
create policy "Authenticated insert all" on public.settings for insert with check (auth.uid() is not null);

create policy "Authenticated update all" on public.users for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.departments for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.requisitions for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.requisition_approval_history for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.postings for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.candidates for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.applications for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.interviews for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.evaluations for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.notifications for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.email_log for update using (auth.uid() is not null);
create policy "Authenticated update all" on public.settings for update using (auth.uid() is not null);

-- Triggers updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare tbl text;
begin
  for tbl in (
    select tablename from pg_tables where schemaname = 'public'
      and tablename in ('users','departments','requisitions','requisition_approval_history',
                        'postings','candidates','applications','interviews','evaluations',
                        'notifications','settings')
  ) loop
    execute format('create trigger if not exists update_%I_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', tbl, tbl);
  end loop;
end $$;

-- ============================================================================
-- Kết thúc schema.sql
-- ============================================================================
