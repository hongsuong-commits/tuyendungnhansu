-- ─────────────────────────────────────────────────────────────────────────────
-- SmartATS · Lược đồ PostgreSQL trên Supabase
-- Chạy tự động khi server khởi động (xem src/server/db.js → ensureSchema)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists users (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists users_username_idx on users ((doc->>'username'));

create table if not exists departments (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);

create table if not exists requisitions (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists requisitions_status_idx on requisitions ((doc->>'status'));

create table if not exists postings (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists postings_status_idx on postings ((doc->>'status'));

create table if not exists candidates (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists candidates_email_idx on candidates (lower(doc->>'email'));

create table if not exists applications (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists applications_candidate_idx on applications ((doc->>'candidateId'));
create index if not exists applications_status_idx on applications ((doc->>'status'));

create table if not exists interviews (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists interviews_candidate_idx on interviews ((doc->>'candidateId'));
create index if not exists interviews_date_idx on interviews ((doc->>'date'));

create table if not exists evaluations (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);
create index if not exists evaluations_candidate_idx on evaluations ((doc->>'candidateId'));

create table if not exists notifications (
  id         text primary key,
  doc        jsonb not null,
  seq        bigserial,
  updated_at timestamptz not null default now()
);

-- Hộp thư gửi ứng viên: mỗi bản ghi là một thư đã soạn xong.
-- status: pending → sending → sent | preview | failed
create table if not exists email_log (
  id                  text primary key,
  doc                 jsonb not null,
  seq                 bigserial,
  type                text,
  to_email            text,
  subject             text,
  status              text not null default 'pending',
  provider            text,
  provider_message_id text,
  preview_url         text,
  error               text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
create index if not exists email_log_queue_idx on email_log (created_at) where sent_at is null;
create index if not exists email_log_to_idx on email_log (to_email);

-- Cấu hình hệ thống (một dòng duy nhất, id = 1)
create table if not exists app_settings (
  id         integer primary key,
  doc        jsonb not null,
  updated_at timestamptz not null default now()
);

-- Bổ sung cột thứ tự cho bảng đã tạo trước đó (chạy lại an toàn)
alter table email_log add column if not exists seq bigserial;
-- Nơi xem lại thư đã gửi (Ethereal) — có thể chạy lại nhiều lần.
alter table email_log add column if not exists preview_url text;
