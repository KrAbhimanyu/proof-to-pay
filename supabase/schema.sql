-- ==============================================================================
-- PROOF-TO-PAY: Consolidated Canonical Schema for Fresh Staging / Production
-- Target: PostgreSQL 15+ / Supabase
-- Comprises: Migration 1 (Core Schema), Migration 2 (Recruiters & Referrals),
--            Migration 3 (Chat System & Transactional Messaging RPC)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: CORE ESCROW, PROFILES, PROJECTS & LIFECYCLE SCHEMA (Migration 1)
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- Migration: 20240101000000_init_schema.sql
-- PROOF-TO-PAY: Initial Database Schema, Core Tables, Indexes, & RLS Policies
-- Target: Clean Supabase Project Initialization & Idempotent Execution
-- Core Tables Covered: profiles, projects, reviews (and supporting relational tables)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS (Idempotent Definition)
-- ------------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('STUDENT', 'BUSINESS', 'ADMIN');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type project_status as enum (
      'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'IN_PROGRESS',
      'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'DISPUTED', 'CANCELLED'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum ('PENDING', 'SHORTLISTED', 'OFFER_EXTENDED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
  end if;
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type offer_status as enum ('PENDING', 'ACCEPTED', 'DECLINED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('NOT_REPORTED', 'REPORTED_BY_BUSINESS', 'RECEIPT_CONFIRMED_BY_CREATOR', 'DISPUTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'commission_fee_status') then
    create type commission_fee_status as enum ('NOT_DUE', 'DUE', 'REPORTED_PAID', 'VERIFIED_COLLECTED', 'OVERDUE', 'WAIVED', 'REFUNDED_OR_ADJUSTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('UPI', 'NEFT_IMPS', 'BANK_TRANSFER');
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 2. CORE & RELATIONAL TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Profiles (Primary User Identity linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  role user_role not null default 'STUDENT',
  avatar_url text,
  city text,
  state text,
  phone text,
  github_url text,
  linkedin_url text,
  behance_url text,
  is_suspended boolean not null default false,
  suspension_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 Student Profiles (Extended student metadata & authoritative statistics)
create table if not exists public.student_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  headline text,
  bio text,
  age int not null default 18 check (age >= 18),
  college text,
  degree text,
  graduation_year int,
  skills text[] default '{}',
  experience_level text default 'INTERMEDIATE',
  portfolio_links jsonb default '[]'::jsonb,
  github_url text,
  linkedin_url text,
  behance_url text,
  social_links jsonb default '[]'::jsonb,
  upi_id text,
  total_earned_paise bigint not null default 0 check (total_earned_paise >= 0),
  completed_projects_count int not null default 0 check (completed_projects_count >= 0),
  average_rating numeric(3,2) default null, -- Stays null until first verified review
  verified_portfolio_slug text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 Business Profiles (Company profile & verification tier)
create table if not exists public.business_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  company_name text not null,
  tagline text,
  website text,
  industry text not null default 'Technology',
  city text not null default '',
  verification_status verification_status not null default 'UNVERIFIED',
  verification_legal_entity text,
  verification_doc_type text,
  verification_doc_number text,
  verification_submitted_at timestamp with time zone,
  verification_verified_at timestamp with time zone,
  verification_admin_notes text,
  total_spent_paise bigint not null default 0 check (total_spent_paise >= 0),
  projects_posted_count int not null default 0 check (projects_posted_count >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.4 Projects (Core listings table with strict financial and timing constraints)
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  business_city text not null default '',
  business_verified boolean not null default false,
  title text not null,
  summary text not null default '',
  description text not null,
  category text not null,
  required_skills text[] not null default '{}',
  budget_paise bigint not null check (budget_paise >= 100000), -- Minimum ₹1,000 INR
  deadline_days int not null check (deadline_days between 2 and 90),
  expected_delivery_date date not null,
  permitted_revisions int not null default 2 check (permitted_revisions between 1 and 5),
  application_closing_date date not null,
  payment_terms text not null default 'Direct UPI/NEFT upon deliverable approval.',
  status project_status not null default 'DRAFT',
  cover_image text,
  moderation_notes text,
  selected_student_id uuid references public.profiles(id) on delete set null,
  selected_student_name text,
  active_offer_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.5 Deliverables
create table if not exists public.deliverables (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text not null,
  format text not null default 'Digital File',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.6 Applications
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  student_skills text[] default '{}',
  pitch_message text not null,
  portfolio_samples jsonb default '[]'::jsonb,
  proposed_delivery_days int not null default 7,
  status application_status not null default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, student_id)
);

-- 2.7 Project Offers (Binding Scope Lock & Fee Snapshot)
create table if not exists public.project_offers (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  agreed_budget_paise bigint not null check (agreed_budget_paise >= 100000),
  agreed_deadline date not null,
  agreed_revisions int not null default 2 check (agreed_revisions between 1 and 5),
  scope_summary text not null,
  cancellation_terms text not null default 'Mutual cancellation permits pro-rata payment based on approved milestone deliverables. Unilateral cancellation without cause forfeits platform protections.',
  deliverables_snapshot jsonb not null default '[]'::jsonb,
  scope_locked boolean not null default false,
  locked_at timestamp with time zone,
  explicit_accepted_at timestamp with time zone,
  status offer_status not null default 'PENDING',
  commission_rate_bps int not null default 500 check (commission_rate_bps between 0 and 2000),
  platform_fee_paise bigint not null check (platform_fee_paise >= 0),
  creator_receives_paise bigint not null check (creator_receives_paise = agreed_budget_paise),
  fee_payer text not null default 'BUSINESS',
  commission_terms_snapshot text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone
);

-- 2.8 Scope Change Requests
create table if not exists public.scope_change_requests (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  offer_id uuid references public.project_offers(id) on delete cascade not null,
  requested_by_user_id uuid references public.profiles(id) on delete cascade not null,
  requested_by_name text not null,
  requested_by_role user_role not null,
  reason text not null,
  proposed_budget_paise bigint not null check (proposed_budget_paise >= 100000),
  proposed_deadline date not null,
  proposed_revisions int not null check (proposed_revisions between 1 and 5),
  proposed_scope_summary text not null,
  proposed_deliverables jsonb not null default '[]'::jsonb,
  previous_terms_snapshot jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  responded_by_user_id uuid references public.profiles(id) on delete set null
);

-- 2.9 Submissions
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  file_urls text[] default '{}',
  notes text,
  revision_number int not null default 1,
  client_feedback text,
  is_approved boolean,
  approved_at timestamp with time zone,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.10 Project Payments (Direct Client-to-Creator Settlement)
create table if not exists public.project_payments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  amount_paise bigint not null check (amount_paise >= 100000),
  payment_method payment_method not null default 'UPI',
  utr text,
  business_notes text,
  status payment_status not null default 'NOT_REPORTED',
  reported_at timestamp with time zone,
  confirmed_by_creator_at timestamp with time zone,
  creator_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.11 Platform Commissions (5% Business-Paid Platform Fee)
create table if not exists public.platform_commissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  project_budget_paise bigint not null check (project_budget_paise >= 100000),
  commission_rate_bps int not null default 500 check (commission_rate_bps between 0 and 2000),
  platform_fee_paise bigint not null check (platform_fee_paise >= 0),
  status commission_fee_status not null default 'NOT_DUE',
  due_date date not null,
  payment_method payment_method default 'UPI',
  reported_utr text,
  reported_at timestamp with time zone,
  reported_notes text,
  verified_by_user_id uuid references public.profiles(id) on delete set null,
  verified_by_name text,
  verified_at timestamp with time zone,
  evidence_reviewed_notes text,
  waiver_reason text,
  waived_by_user_id uuid references public.profiles(id) on delete set null,
  waived_at timestamp with time zone,
  adjustment_amount_paise bigint default 0,
  adjustment_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.12 Proof Passport Items (Sanitized Public Work Records)
create table if not exists public.proof_passport_items (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  category text not null,
  sanitized_summary text not null,
  completion_source text not null default 'BUSINESS_APPROVAL' check (completion_source in ('BUSINESS_APPROVAL', 'DISPUTE_RESOLUTION')),
  business_name text not null,
  business_city text,
  rating int check (rating between 1 and 5),
  review_snippet text,
  is_public boolean not null default true,
  display_order int not null default 0,
  badge_title text not null default 'Verified Work Delivery',
  completed_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, project_id)
);

-- 2.13 Reviews (Core Verified Two-Way Reviews & Ratings Table)
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewer_name text not null,
  reviewer_role user_role not null,
  target_user_id uuid references public.profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  verified_deliverable_summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.14 Audit Logs (Append-Only Administrative Auditing)
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  actor_role user_role not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.15 Disputes
create table if not exists public.disputes (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  raised_by_user_id uuid references public.profiles(id) on delete cascade not null,
  raised_by_name text not null,
  raised_by_role user_role not null,
  reason text not null,
  evidence_notes text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'INVESTIGATING', 'RESOLVED_STUDENT_PAID', 'RESOLVED_REFUNDED', 'DISMISSED')),
  admin_decision text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.16 Abuse Reports
create table if not exists public.abuse_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_name text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_project_id uuid references public.projects(id) on delete set null,
  target_title text not null,
  reason text not null,
  description text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'RESOLVED_WARNED', 'RESOLVED_SUSPENDED', 'DISMISSED')),
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.17 In-App Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null,
  project_id uuid references public.projects(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES (Idempotent Performance & Relational Lookups)
-- ------------------------------------------------------------------------------

-- Indexes for public.profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- Indexes for public.student_profiles & business_profiles
create index if not exists idx_student_profiles_rating on public.student_profiles(average_rating);
create index if not exists idx_business_profiles_status on public.business_profiles(verification_status);

-- Indexes for public.projects
create index if not exists idx_projects_business_id on public.projects(business_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_selected_student_id on public.projects(selected_student_id);
create index if not exists idx_projects_created_at on public.projects(created_at desc);

-- Indexes for relational workflow tables
create index if not exists idx_deliverables_project_id on public.deliverables(project_id);
create index if not exists idx_applications_project_id on public.applications(project_id);
create index if not exists idx_applications_student_id on public.applications(student_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_project_offers_project_id on public.project_offers(project_id);
create index if not exists idx_project_offers_parties on public.project_offers(business_id, student_id);
create index if not exists idx_submissions_project_id on public.submissions(project_id);
create index if not exists idx_submissions_student_id on public.submissions(student_id);
create index if not exists idx_project_payments_project_id on public.project_payments(project_id);
create index if not exists idx_platform_commissions_project_id on public.platform_commissions(project_id);
create index if not exists idx_platform_commissions_status on public.platform_commissions(status);
create index if not exists idx_proof_passport_student_id on public.proof_passport_items(student_id);

-- Indexes for public.reviews
create index if not exists idx_reviews_project_id on public.reviews(project_id);
create index if not exists idx_reviews_reviewer_id on public.reviews(reviewer_id);
create index if not exists idx_reviews_target_user_id on public.reviews(target_user_id);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- Indexes for audit, dispute, and notifications
create index if not exists idx_audit_logs_actor_created on public.audit_logs(actor_role, created_at desc);
create index if not exists idx_disputes_project_id on public.disputes(project_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);

-- ------------------------------------------------------------------------------
-- 4. FUNCTIONS & SECURITY DEFINER TRIGGERS
-- ------------------------------------------------------------------------------

-- Helper: Check if current caller is an active administrator
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and is_suspended = false
  );
$$;

-- Trigger Function: Prevent Non-Admins from altering Role, Suspension, or Admin Notes
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if NEW.role <> OLD.role then
      raise exception 'Security Error: Privilege escalation rejected. Non-admins cannot alter their user role.';
    end if;
    if NEW.is_suspended <> OLD.is_suspended then
      raise exception 'Security Error: Privilege escalation rejected. Users cannot alter suspension status.';
    end if;
    if NEW.suspension_reason is distinct from OLD.suspension_reason then
      raise exception 'Security Error: Privilege escalation rejected. Users cannot alter suspension reason.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_profile_escalation on public.profiles;
create trigger trg_prevent_profile_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_escalation();

-- Trigger Function: Prevent Student Fake Rating / Stats Overrides
create or replace function public.prevent_student_stats_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if NEW.average_rating is distinct from OLD.average_rating then
      raise exception 'Security Error: Rating is calculated authoritatively from verified completed reviews.';
    end if;
    if NEW.completed_projects_count <> OLD.completed_projects_count then
      raise exception 'Security Error: Completed project count is computed from verified deliveries.';
    end if;
    if NEW.total_earned_paise <> OLD.total_earned_paise then
      raise exception 'Security Error: Total earnings cannot be manually adjusted.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_student_tampering on public.student_profiles;
create trigger trg_prevent_student_tampering
before update on public.student_profiles
for each row
execute function public.prevent_student_stats_tampering();

-- Trigger Function: Prevent Business Self-Verification or Document Tampering
create or replace function public.prevent_business_verification_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if NEW.verification_status <> OLD.verification_status and NEW.verification_status = 'VERIFIED' then
      raise exception 'Security Error: Businesses cannot mark themselves as verified.';
    end if;
    if NEW.verification_admin_notes is distinct from OLD.verification_admin_notes then
      raise exception 'Security Error: Businesses cannot modify administrative review notes.';
    end if;
    if NEW.verification_verified_at is distinct from OLD.verification_verified_at then
      raise exception 'Security Error: Verification timestamp is set by authorized administrators.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_business_tampering on public.business_profiles;
create trigger trg_prevent_business_tampering
before update on public.business_profiles
for each row
execute function public.prevent_business_verification_tampering();

-- Trigger Function: Prevent Non-Admins from tampering with platform fee verification
create or replace function public.prevent_commission_verification_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if NEW.status = 'VERIFIED_COLLECTED' and OLD.status <> 'VERIFIED_COLLECTED' then
      raise exception 'Security Error: Only authorized platform administrators may verify platform commission collection.';
    end if;
    if NEW.status = 'WAIVED' and OLD.status <> 'WAIVED' then
      raise exception 'Security Error: Only authorized administrators may waive platform fees.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_commission_tampering on public.platform_commissions;
create trigger trg_prevent_commission_tampering
before update on public.platform_commissions
for each row
execute function public.prevent_commission_verification_tampering();

-- Auth Hook: Automatically provision profiles on user signup (Safe against role escalation)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_role text;
  assigned_role public.user_role;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'STUDENT');
  if raw_role = 'ADMIN' then
    assigned_role := 'STUDENT'::public.user_role;
  elsif raw_role in ('STUDENT', 'BUSINESS') then
    assigned_role := raw_role::public.user_role;
  else
    assigned_role := 'STUDENT'::public.user_role;
  end if;

  insert into public.profiles (id, email, name, role, is_suspended)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'User'), '@', 1)),
    assigned_role,
    false
  )
  on conflict (id) do nothing;

  if assigned_role = 'STUDENT' then
    insert into public.student_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS' then
    insert into public.business_profiles (user_id, company_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Organization'))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Secure One-Time Initial Administrator Provisioning Procedure
create or replace function public.bootstrap_initial_admin(admin_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  admin_count int;
begin
  select count(*) into admin_count from public.profiles where role = 'ADMIN';
  if admin_count > 0 then
    raise exception 'Security Error: An administrator is already provisioned. Subsequent administrators must be promoted by existing admins.';
  end if;

  select id into target_id from public.profiles where lower(email) = lower(admin_email);
  if target_id is null then
    raise exception 'User with email % not found.', admin_email;
  end if;

  update public.profiles
  set role = 'ADMIN', is_suspended = false
  where id = target_id;

  insert into public.audit_logs (actor_name, actor_role, action, target_type, target_id, details)
  values ('SYSTEM', 'ADMIN', 'BOOTSTRAP_INITIAL_ADMIN', 'USER', target_id::text, 'Initial administrator account provisioned for ' || admin_email);

  return true;
end;
$$;

revoke execute on function public.bootstrap_initial_admin(text) from public;
revoke execute on function public.bootstrap_initial_admin(text) from anon;
revoke execute on function public.bootstrap_initial_admin(text) from authenticated;
grant execute on function public.bootstrap_initial_admin(text) to postgres, service_role;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & IDEMPOTENT POLICIES
-- ------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.deliverables enable row level security;
alter table public.applications enable row level security;
alter table public.project_offers enable row level security;
alter table public.scope_change_requests enable row level security;
alter table public.submissions enable row level security;
alter table public.project_payments enable row level security;
alter table public.platform_commissions enable row level security;
alter table public.proof_passport_items enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_logs enable row level security;
alter table public.disputes enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.notifications enable row level security;

-- 5.1 Profiles Policies
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Public directory info viewable" on public.profiles;
create policy "Public directory info viewable" on public.profiles
  for select using (not is_suspended);

drop policy if exists "Users can update own basic profile" on public.profiles;
create policy "Users can update own basic profile" on public.profiles
  for update using (auth.uid() = id);

-- 5.2 Student Profiles Policies
drop policy if exists "Public student profile view" on public.student_profiles;
create policy "Public student profile view" on public.student_profiles
  for select using (true);

drop policy if exists "Students can update own profile" on public.student_profiles;
create policy "Students can update own profile" on public.student_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Students can insert own profile" on public.student_profiles;
create policy "Students can insert own profile" on public.student_profiles
  for insert with check (auth.uid() = user_id);

-- 5.3 Business Profiles Policies
drop policy if exists "Public business profile view" on public.business_profiles;
create policy "Public business profile view" on public.business_profiles
  for select using (true);

drop policy if exists "Businesses can update own profile" on public.business_profiles;
create policy "Businesses can update own profile" on public.business_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Businesses can insert own profile" on public.business_profiles;
create policy "Businesses can insert own profile" on public.business_profiles
  for insert with check (auth.uid() = user_id);

-- 5.4 Projects Policies
drop policy if exists "Approved projects are viewable by all" on public.projects;
create policy "Approved projects are viewable by all" on public.projects
  for select using (status in ('APPROVED', 'IN_PROGRESS', 'COMPLETED') or business_id = auth.uid() or public.is_admin());

drop policy if exists "Businesses can insert own projects" on public.projects;
create policy "Businesses can insert own projects" on public.projects
  for insert with check (business_id = auth.uid());

drop policy if exists "Businesses can update own projects when draft or active" on public.projects;
create policy "Businesses can update own projects when draft or active" on public.projects
  for update using (business_id = auth.uid() or public.is_admin());

-- 5.5 Deliverables Policies
drop policy if exists "Deliverables viewable if project viewable" on public.deliverables;
create policy "Deliverables viewable if project viewable" on public.deliverables
  for select using (exists (
    select 1 from public.projects
    where projects.id = deliverables.project_id
      and (projects.status in ('APPROVED', 'IN_PROGRESS', 'COMPLETED') or projects.business_id = auth.uid() or public.is_admin())
  ));

drop policy if exists "Businesses can manage project deliverables" on public.deliverables;
create policy "Businesses can manage project deliverables" on public.deliverables
  for all using (exists (
    select 1 from public.projects
    where projects.id = deliverables.project_id and projects.business_id = auth.uid()
  ));

-- 5.6 Applications Policies
drop policy if exists "Students view own applications" on public.applications;
create policy "Students view own applications" on public.applications
  for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "Businesses view applications for their projects" on public.applications;
create policy "Businesses view applications for their projects" on public.applications
  for select using (exists (
    select 1 from public.projects
    where projects.id = applications.project_id and projects.business_id = auth.uid()
  ));

drop policy if exists "Students can submit application" on public.applications;
create policy "Students can submit application" on public.applications
  for insert with check (student_id = auth.uid());

-- 5.7 Project Offers Policies
drop policy if exists "Offer participants view offer" on public.project_offers;
create policy "Offer participants view offer" on public.project_offers
  for select using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

drop policy if exists "Business can create offer" on public.project_offers;
create policy "Business can create offer" on public.project_offers
  for insert with check (business_id = auth.uid());

drop policy if exists "Participants can update offer status" on public.project_offers;
create policy "Participants can update offer status" on public.project_offers
  for update using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- 5.8 Scope Change Requests Policies
drop policy if exists "Scope change participants view" on public.scope_change_requests;
create policy "Scope change participants view" on public.scope_change_requests
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Scope change participants create" on public.scope_change_requests;
create policy "Scope change participants create" on public.scope_change_requests
  for insert with check (
    requested_by_user_id = auth.uid() and
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid())
    )
  );

drop policy if exists "Scope change counterparty respond" on public.scope_change_requests;
create policy "Scope change counterparty respond" on public.scope_change_requests
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid() or public.is_admin())
    )
  );

-- 5.9 Submissions Policies
drop policy if exists "Submissions viewable only by project participants" on public.submissions;
create policy "Submissions viewable only by project participants" on public.submissions
  for select using (
    student_id = auth.uid() or
    exists (
      select 1 from public.projects
      where projects.id = submissions.project_id and projects.business_id = auth.uid()
    ) or public.is_admin()
  );

drop policy if exists "Assigned student can create submission" on public.submissions;
create policy "Assigned student can create submission" on public.submissions
  for insert with check (
    student_id = auth.uid() and
    exists (
      select 1 from public.projects
      where projects.id = submissions.project_id and projects.selected_student_id = auth.uid()
    )
  );

-- 5.10 Project Payments Policies
drop policy if exists "Payment records viewable by parties and admin" on public.project_payments;
create policy "Payment records viewable by parties and admin" on public.project_payments
  for select using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

drop policy if exists "Business can create payment record" on public.project_payments;
create policy "Business can create payment record" on public.project_payments
  for insert with check (business_id = auth.uid());

drop policy if exists "Parties can report and confirm payment" on public.project_payments;
create policy "Parties can report and confirm payment" on public.project_payments
  for update using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- 5.11 Platform Commissions Policies
drop policy if exists "Commission records viewable by business and admin" on public.platform_commissions;
create policy "Commission records viewable by business and admin" on public.platform_commissions
  for select using (business_id = auth.uid() or public.is_admin());

drop policy if exists "Business can report commission payment" on public.platform_commissions;
create policy "Business can report commission payment" on public.platform_commissions
  for update using (business_id = auth.uid() or public.is_admin());

-- 5.12 Proof Passport Items Policies
drop policy if exists "Public Proof Passport viewable when published" on public.proof_passport_items;
create policy "Public Proof Passport viewable when published" on public.proof_passport_items
  for select using (is_public = true or student_id = auth.uid() or public.is_admin());

drop policy if exists "Creator can toggle public visibility of own passport items" on public.proof_passport_items;
create policy "Creator can toggle public visibility of own passport items" on public.proof_passport_items
  for update using (student_id = auth.uid() or public.is_admin());

-- 5.13 Reviews Policies (Core Two-Way Verified Reviews)
drop policy if exists "Reviews are publicly readable" on public.reviews;
create policy "Reviews are publicly readable" on public.reviews
  for select using (true);

drop policy if exists "Participants can submit review" on public.reviews;
create policy "Participants can submit review" on public.reviews
  for insert with check (reviewer_id = auth.uid());

-- 5.14 Administrative Audit Logs Policies (Append-Only)
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.is_admin());

drop policy if exists "Authenticated users can append audit log" on public.audit_logs;
create policy "Authenticated users can append audit log" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- 5.15 Disputes Policies
drop policy if exists "Disputes viewable by parties and admin" on public.disputes;
create policy "Disputes viewable by parties and admin" on public.disputes
  for select using (raised_by_user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.projects where projects.id = disputes.project_id and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid())
  ));

drop policy if exists "Participants can raise dispute" on public.disputes;
create policy "Participants can raise dispute" on public.disputes
  for insert with check (raised_by_user_id = auth.uid());

drop policy if exists "Admin can resolve dispute" on public.disputes;
create policy "Admin can resolve dispute" on public.disputes
  for update using (public.is_admin());

-- 5.16 Abuse Reports Policies
drop policy if exists "Users submit abuse reports" on public.abuse_reports;
create policy "Users submit abuse reports" on public.abuse_reports
  for insert with check (auth.uid() is not null);

drop policy if exists "Admins manage abuse reports" on public.abuse_reports;
create policy "Admins manage abuse reports" on public.abuse_reports
  for all using (public.is_admin());

-- 5.17 Notifications Policies
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6. VERIFICATION STEP
-- ------------------------------------------------------------------------------
-- Automated verification block: executes immediately when running this migration script.
-- Validates that the core tables (profiles, projects, reviews) exist, have RLS enabled,
-- and have primary keys and required constraints established.
do $$
declare
  missing_tables text[];
  unprotected_tables text[];
  missing_indexes text[];
begin
  -- 1. Check table presence for core tables
  select array_agg(tbl) into missing_tables
  from (
    select unnest(array['profiles', 'projects', 'reviews']) as tbl
  ) required
  where not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = required.tbl
  );

  if missing_tables is not null and array_length(missing_tables, 1) > 0 then
    raise exception 'Migration Verification Failed: Missing required core tables: %', array_to_string(missing_tables, ', ');
  end if;

  -- 2. Check Row Level Security is active
  select array_agg(tbl) into unprotected_tables
  from (
    select unnest(array['profiles', 'projects', 'reviews']) as tbl
  ) required
  where not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = required.tbl and rowsecurity = true
  );

  if unprotected_tables is not null and array_length(unprotected_tables, 1) > 0 then
    raise exception 'Migration Verification Failed: Core tables without Row Level Security enabled: %', array_to_string(unprotected_tables, ', ');
  end if;

  -- 3. Check core indexes
  select array_agg(idx) into missing_indexes
  from (
    select unnest(array[
      'idx_profiles_role',
      'idx_projects_business_id',
      'idx_projects_status',
      'idx_reviews_project_id',
      'idx_reviews_target_user_id'
    ]) as idx
  ) required_indexes
  where not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = required_indexes.idx
  );

  if missing_indexes is not null and array_length(missing_indexes, 1) > 0 then
    raise exception 'Migration Verification Failed: Missing core indexes: %', array_to_string(missing_indexes, ', ');
  end if;

  raise notice 'Verification Succeeded: Core tables (profiles, projects, reviews) created with RLS enabled and indexes verified.';
end $$;


-- ------------------------------------------------------------------------------
-- PART 2: RECRUITER PORTAL, TALENT COLLECTIONS & REFERRALS (Migration 2)
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- Migration: 20240201000000_recruiter_collections_referrals.sql
-- PROOF-TO-PAY: Recruiter Portal, Talent Collections, and Referral Network
-- Target: Idempotent Schema Extension with Strict Least-Privilege RLS Policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUM EXTENSION (Safe Idempotent Alteration)
-- ------------------------------------------------------------------------------
do $$ begin
  alter type public.user_role add value if not exists 'RECRUITER';
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------------------
-- 2. RECRUITER PROFILES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.recruiter_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  company_name text not null,
  designation text not null default 'Technical Talent Partner',
  industry text not null default 'Technology & Product Staffing',
  verification_status verification_status not null default 'UNVERIFIED',
  website text,
  hiring_domains text[] not null default array['Frontend / React', 'Mobile (Android/iOS)', 'Fullstack', 'UI/UX Design']::text[],
  total_hires_count integer not null default 0,
  active_collections_count integer not null default 0,
  referral_code text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- ------------------------------------------------------------------------------
-- 3. TALENT COLLECTIONS TABLE (Folders / Lists for shortlisting creators & Curated Cohorts)
-- ------------------------------------------------------------------------------
create table if not exists public.talent_collections (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  color text not null default 'indigo',
  category text,
  badge text,
  curator_name text,
  is_curated boolean not null default false,
  is_featured boolean not null default false,
  views_count integer not null default 0,
  clones_count integer not null default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- ------------------------------------------------------------------------------
-- 4. TALENT COLLECTION ITEMS TABLE (Candidates within collections)
-- ------------------------------------------------------------------------------
create table if not exists public.talent_collection_items (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references public.talent_collections(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  private_notes text,
  endorsement text,
  tags text[] not null default array[]::text[],
  added_at timestamp with time zone default now() not null,
  constraint talent_collection_items_unique_candidate unique (collection_id, creator_id)
);

-- ------------------------------------------------------------------------------
-- 5. REFERRAL CODES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.referral_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  code text not null unique,
  created_at timestamp with time zone default now() not null
);

-- ------------------------------------------------------------------------------
-- 6. REFERRALS TABLE (Activity tracking & milestone rewards)
-- ------------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referrer_role user_role not null,
  referee_id uuid references public.profiles(id) on delete set null,
  referee_name text not null,
  referee_email text not null,
  referee_role user_role not null,
  status text not null default 'SIGNED_UP' check (status in ('PENDING', 'SIGNED_UP', 'ACTIVE_MILESTONE', 'REWARDED')),
  reward_amount_inr numeric(10, 2) not null default 500.00 check (reward_amount_inr >= 0),
  reward_type text not null default 'CASH_INR' check (reward_type in ('CASH_INR', 'COMMISSION_DISCOUNT', 'CREDIT')),
  referral_code text not null,
  created_at timestamp with time zone default now() not null,
  activated_at timestamp with time zone,
  milestone_title text
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
create index if not exists idx_recruiter_profiles_user on public.recruiter_profiles(id);
create index if not exists idx_talent_collections_owner on public.talent_collections(owner_id);
create index if not exists idx_talent_collection_items_col on public.talent_collection_items(collection_id);
create index if not exists idx_talent_collection_items_creator on public.talent_collection_items(creator_id);
create index if not exists idx_referral_codes_code on public.referral_codes(code);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_referrals_referee on public.referrals(referee_id);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all new tables
alter table public.recruiter_profiles enable row level security;
alter table public.talent_collections enable row level security;
alter table public.talent_collection_items enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

-- 8.1 Recruiter Profiles RLS
drop policy if exists "Recruiter profiles publicly visible" on public.recruiter_profiles;
create policy "Recruiter profiles publicly visible"
  on public.recruiter_profiles for select
  using (true);

drop policy if exists "Recruiters can update own profile" on public.recruiter_profiles;
create policy "Recruiters can update own profile"
  on public.recruiter_profiles for update
  to authenticated
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'ADMIN')
  with check (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'ADMIN');

drop policy if exists "Recruiters can insert own profile" on public.recruiter_profiles;
create policy "Recruiters can insert own profile"
  on public.recruiter_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 8.2 Talent Collections RLS
drop policy if exists "Owners and admins can view collections" on public.talent_collections;
drop policy if exists "Curated collections publicly viewable or owners can view" on public.talent_collections;
create policy "Curated collections publicly viewable or owners can view"
  on public.talent_collections for select
  using (
    is_curated = true or
    auth.uid() = owner_id or
    (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  );

drop policy if exists "Users can create their own collections" on public.talent_collections;
create policy "Users can create their own collections"
  on public.talent_collections for insert
  to authenticated
  with check (
    auth.uid() = owner_id and
    (is_curated = false or (select role from public.profiles where id = auth.uid()) = 'ADMIN')
  );

drop policy if exists "Owners and admins can update collections" on public.talent_collections;
create policy "Owners and admins can update collections"
  on public.talent_collections for update
  to authenticated
  using (
    (auth.uid() = owner_id and is_curated = false) or
    (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  )
  with check (
    (auth.uid() = owner_id and is_curated = false) or
    (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  );

drop policy if exists "Owners and admins can delete collections" on public.talent_collections;
create policy "Owners and admins can delete collections"
  on public.talent_collections for delete
  to authenticated
  using (
    (auth.uid() = owner_id and is_curated = false) or
    (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  );

-- 8.3 Talent Collection Items RLS (Private Notes Protected)
-- Candidates/creators MUST NOT have access to private recruiter screening notes,
-- but public/recruiters can view official curator endorsements for curated cohorts.
drop policy if exists "Collection owners can view collection items" on public.talent_collection_items;
create policy "Collection owners can view collection items"
  on public.talent_collection_items for select
  using (
    exists (
      select 1 from public.talent_collections c
      where c.id = collection_id and (
        c.is_curated = true or
        c.owner_id = auth.uid() or
        (select role from public.profiles where id = auth.uid()) = 'ADMIN'
      )
    )
  );

drop policy if exists "Collection owners can insert collection items" on public.talent_collection_items;
create policy "Collection owners can insert collection items"
  on public.talent_collection_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.talent_collections c
      where c.id = collection_id and (
        (c.owner_id = auth.uid() and c.is_curated = false) or
        (select role from public.profiles where id = auth.uid()) = 'ADMIN'
      )
    )
  );

drop policy if exists "Collection owners can update collection items" on public.talent_collection_items;
create policy "Collection owners can update collection items"
  on public.talent_collection_items for update
  to authenticated
  using (
    exists (
      select 1 from public.talent_collections c
      where c.id = collection_id and (
        (c.owner_id = auth.uid() and c.is_curated = false) or
        (select role from public.profiles where id = auth.uid()) = 'ADMIN'
      )
    )
  );

drop policy if exists "Collection owners can delete collection items" on public.talent_collection_items;
create policy "Collection owners can delete collection items"
  on public.talent_collection_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.talent_collections c
      where c.id = collection_id and (
        (c.owner_id = auth.uid() and c.is_curated = false) or
        (select role from public.profiles where id = auth.uid()) = 'ADMIN'
      )
    )
  );

-- 8.4 Referral Codes RLS
drop policy if exists "Referral codes viewable by authenticated users" on public.referral_codes;
create policy "Referral codes viewable by authenticated users"
  on public.referral_codes for select
  to authenticated
  using (true);

drop policy if exists "Users can generate own referral code" on public.referral_codes;
create policy "Users can generate own referral code"
  on public.referral_codes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 8.5 Referrals RLS
drop policy if exists "Referrals viewable by referrer referee and admin" on public.referrals;
create policy "Referrals viewable by referrer referee and admin"
  on public.referrals for select
  to authenticated
  using (
    auth.uid() = referrer_id or
    auth.uid() = referee_id or
    (select role from public.profiles where id = auth.uid()) = 'ADMIN'
  );

drop policy if exists "Authenticated users can record referral signup" on public.referrals;
create policy "Authenticated users can record referral signup"
  on public.referrals for insert
  to authenticated
  with check (auth.uid() = referee_id);

drop policy if exists "Admins can update referral status and rewards" on public.referrals;
create policy "Admins can update referral status and rewards"
  on public.referrals for update
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN')
  with check ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- ------------------------------------------------------------------------------
-- 9. EXTENDED HANDLE_NEW_USER TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role text;
  assigned_role public.user_role;
  user_name text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'STUDENT');
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- Protected role escalation barrier
  if raw_role = 'ADMIN' then
    assigned_role := 'STUDENT'::public.user_role;
  elsif raw_role = 'BUSINESS' then
    assigned_role := 'BUSINESS'::public.user_role;
  elsif raw_role = 'RECRUITER' then
    assigned_role := 'RECRUITER'::public.user_role;
  else
    assigned_role := 'STUDENT'::public.user_role;
  end if;

  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, user_name, assigned_role)
  on conflict (id) do nothing;

  -- Create corresponding profile record based on role
  if assigned_role = 'STUDENT' then
    insert into public.student_profiles (user_id, headline, age, verified_portfolio_slug)
    values (
      new.id,
      'Emerging Creator',
      18,
      lower(regexp_replace(user_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6)
    )
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS' then
    insert into public.business_profiles (user_id, company_name, industry)
    values (new.id, user_name, 'Technology')
    on conflict (user_id) do nothing;
  elsif assigned_role = 'RECRUITER' then
    insert into public.recruiter_profiles (id, company_name, designation, industry)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', 'Talent Partner'), 'Technical Talent Partner', 'Staffing & Recruitment')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;


-- ------------------------------------------------------------------------------
-- PART 3: SECURE CHAT SUBSYSTEM & TRANSACTIONAL MESSAGING RPC (Migration 3)
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- PROOF-TO-PAY: Secure Chat & Messaging Subsystem Migration
-- File: supabase/migrations/20240301000000_chat_system.sql
-- Description: Adds tables, indexes, constraints, and Row Level Security (RLS)
--              for Pre-Project and Project-Linked secure conversations, messages,
--              attachments, and voice notes.
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_type text NOT NULL CHECK (conversation_type IN ('PRE_PROJECT', 'PROJECT')),
  business_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_offer_id uuid REFERENCES public.project_offers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'BLOCKED')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_different_participants CHECK (business_id <> creator_id),
  CONSTRAINT uq_project_offer_conversation UNIQUE (project_offer_id)
);

-- Partial unique indexes to prevent duplicate pre-project chats
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_pre_project_chat_per_project 
ON public.conversations (business_id, creator_id, project_id) 
WHERE (conversation_type = 'PRE_PROJECT' AND project_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_pre_project_chat_direct 
ON public.conversations (business_id, creator_id) 
WHERE (conversation_type = 'PRE_PROJECT' AND project_id IS NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON public.conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_muted boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON public.conversation_participants(conversation_id);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM')),
  body text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_valid_message_body CHECK (
    (message_type IN ('TEXT', 'SYSTEM') AND body IS NOT NULL AND length(trim(body)) > 0) OR
    (message_type IN ('IMAGE', 'FILE', 'VOICE'))
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 4. MESSAGE ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520), -- 20 MB max
  mime_type text NOT NULL,
  voice_duration_seconds integer CHECK (voice_duration_seconds IS NULL OR (voice_duration_seconds > 0 AND voice_duration_seconds <= 180)),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_safe_attachment_filename CHECK (
    file_name ~* '\.(png|jpe?g|webp|gif|pdf|txt|zip|doc|docx|webm|mp4|mp3|ogg|wav|m4a)$'
  )
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON public.message_attachments(conversation_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all chat tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- 5.1 Conversations RLS
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = business_id OR 
    auth.uid() = creator_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Eligible users can create conversations" ON public.conversations;
CREATE POLICY "Eligible users can create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = business_id OR auth.uid() = creator_id) AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    ) AND
    (
      -- Pre-project conversations require valid un-suspended counterpart
      (conversation_type = 'PRE_PROJECT' AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (CASE WHEN auth.uid() = business_id THEN creator_id ELSE business_id END)
        AND is_suspended = false
      ))
      OR
      -- Project conversations require an ACCEPTED project offer
      (conversation_type = 'PROJECT' AND project_offer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.project_offers 
        WHERE id = project_offer_id 
          AND status = 'ACCEPTED' 
          AND business_id = public.conversations.business_id 
          AND student_id = public.conversations.creator_id
      ))
    )
  );

-- 5.2 Conversation Participants RLS
-- Explicitly revoke direct INSERT and DELETE to prevent participants from adding themselves or others.
-- Participants are securely populated only via the handle_new_conversation() trigger.
REVOKE INSERT, DELETE ON public.conversation_participants FROM anon, authenticated;
GRANT SELECT ON public.conversation_participants TO authenticated;
GRANT UPDATE (last_read_at, is_muted) ON public.conversation_participants TO authenticated;

DROP POLICY IF EXISTS "Participants can view conversation participant list" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation participant list" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can update own read receipt" ON public.conversation_participants;
CREATE POLICY "Participants can update own read receipt" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5.3 Messages RLS
DROP POLICY IF EXISTS "Participants can read messages in their conversations" ON public.messages;
CREATE POLICY "Participants can read messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can send messages to active conversations" ON public.messages;
CREATE POLICY "Participants can send messages to active conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id 
        AND c.status = 'ACTIVE'
        AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

-- 5.4 Message Attachments RLS
DROP POLICY IF EXISTS "Participants can view message attachments" ON public.message_attachments;
CREATE POLICY "Participants can view message attachments" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can insert attachments into their messages" ON public.message_attachments;
CREATE POLICY "Participants can insert attachments into their messages" ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id 
        AND m.sender_id = auth.uid() 
        AND c.id = conversation_id
        AND c.status = 'ACTIVE'
    )
  );

-- 6. AUTOMATIC TRIGGER FOR LAST MESSAGE TIMESTAMP & CONVERSATION PARTICIPANTS
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Ensure sender's last_read_at is updated
  UPDATE public.conversation_participants
  SET last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id AND user_id = NEW.sender_id;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_chat_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_chat_message() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_after_message_insert ON public.messages;
CREATE TRIGGER trg_after_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_chat_message();

-- 7. AUTOMATIC TRIGGER FOR POPULATING CONVERSATION PARTICIPANTS
CREATE OR REPLACE FUNCTION public.handle_new_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert business participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
  VALUES (NEW.id, NEW.business_id, NEW.created_at, NEW.created_at)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Insert creator participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
  VALUES (NEW.id, NEW.creator_id, NEW.created_at, NEW.created_at)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_conversation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_conversation() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_after_conversation_insert ON public.conversations;
CREATE TRIGGER trg_after_conversation_insert
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_conversation();

-- 8. SECURE ATTACHMENT STORAGE (Private Bucket: chat_attachments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments',
  'chat_attachments',
  false,
  20971520, -- 20 MB max
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'application/zip',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Participants can view conversation attachments" ON storage.objects;
CREATE POLICY "Participants can view conversation attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat_attachments' AND (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
          AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
      ) OR
      public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Participants can upload attachments to own messages" ON storage.objects;
CREATE POLICY "Participants can upload attachments to own messages" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat_attachments' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
        AND c.status = 'ACTIVE'
        AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

DROP POLICY IF EXISTS "Participants can delete own uploaded attachments" ON storage.objects;
CREATE POLICY "Participants can delete own uploaded attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat_attachments' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
        AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

-- 9. TRANSACTIONAL RPC: send_chat_message
-- Atomically inserts message and attachment metadata within a single PostgreSQL transaction.
-- Rolls back completely if any attachment validation, constraint, or permission fails.
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id uuid,
  p_message_type text,
  p_body text DEFAULT NULL,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_conv_status text;
  v_is_suspended boolean;
  v_message_id uuid;
  v_created_at timestamp with time zone := timezone('utc'::text, now());
  v_att jsonb;
  v_storage_path text;
  v_file_name text;
  v_file_size_bytes bigint;
  v_mime_type text;
  v_voice_duration_seconds integer;
  v_inserted_attachments jsonb := '[]'::jsonb;
  v_att_id uuid;
BEGIN
  -- 1. Authentication check
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to send messages' USING ERRCODE = '42501';
  END IF;

  -- 2. Account suspension check
  SELECT is_suspended INTO v_is_suspended 
  FROM public.profiles 
  WHERE id = v_sender_id;

  IF v_is_suspended IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = '42501';
  ELSIF v_is_suspended = true THEN
    RAISE EXCEPTION 'Account is suspended. Messaging is disabled' USING ERRCODE = '42501';
  END IF;

  -- 3. Active conversation membership check
  SELECT status INTO v_conv_status 
  FROM public.conversations 
  WHERE id = p_conversation_id 
    AND (business_id = v_sender_id OR creator_id = v_sender_id);

  IF v_conv_status IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not an active participant in conversation %', p_conversation_id USING ERRCODE = '42501';
  ELSIF v_conv_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Conversation % is not active (status: %)', p_conversation_id, v_conv_status USING ERRCODE = '23514';
  END IF;

  -- 4. Message type and body validation (chk_valid_message_body)
  IF p_message_type NOT IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM') THEN
    RAISE EXCEPTION 'Invalid message type: %', p_message_type USING ERRCODE = '23514';
  END IF;

  IF p_message_type IN ('TEXT', 'SYSTEM') THEN
    IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
      RAISE EXCEPTION 'Message body cannot be empty for % messages', p_message_type USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Attachment presence validation for media types
  IF p_message_type IN ('IMAGE', 'FILE', 'VOICE') THEN
    IF p_attachments IS NULL OR jsonb_array_length(p_attachments) = 0 THEN
      RAISE EXCEPTION 'At least one attachment metadata is required for % message', p_message_type USING ERRCODE = '23514';
    END IF;
  END IF;

  -- 5. Insert Message Row
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    body,
    is_deleted,
    created_at,
    updated_at
  ) VALUES (
    p_conversation_id,
    v_sender_id,
    p_message_type,
    p_body,
    false,
    v_created_at,
    v_created_at
  )
  RETURNING id INTO v_message_id;

  -- 6. Insert and validate Attachment Metadata atomically
  IF p_attachments IS NOT NULL AND jsonb_array_length(p_attachments) > 0 THEN
    FOR v_att IN SELECT * FROM jsonb_array_elements(p_attachments) LOOP
      v_storage_path := coalesce(v_att->>'storagePath', v_att->>'storage_path');
      v_file_name := coalesce(v_att->>'fileName', v_att->>'file_name');
      v_file_size_bytes := (coalesce(v_att->>'fileSizeBytes', v_att->>'file_size_bytes'))::bigint;
      v_mime_type := coalesce(v_att->>'mimeType', v_att->>'mime_type');
      v_voice_duration_seconds := (coalesce(v_att->>'voiceDurationSeconds', v_att->>'voice_duration_seconds'))::integer;

      -- Validate storage path: MUST reside strictly in conversations/<p_conversation_id>/...
      IF v_storage_path IS NULL OR v_storage_path NOT LIKE ('conversations/' || p_conversation_id::text || '/%') THEN
        RAISE EXCEPTION 'Security violation: Storage path % does not match authorized conversation folder', v_storage_path USING ERRCODE = '42501';
      END IF;

      -- Validate file name safe characters and extension
      IF v_file_name IS NULL OR v_file_name !~* '\.(png|jpe?g|webp|gif|pdf|txt|zip|doc|docx|webm|mp4|mp3|ogg|wav|m4a)$' THEN
        RAISE EXCEPTION 'Invalid or unsafe attachment filename: %', v_file_name USING ERRCODE = '23514';
      END IF;

      -- Validate allowed MIME types
      IF v_mime_type IS NULL OR v_mime_type NOT IN (
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain', 'application/zip',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'
      ) THEN
        RAISE EXCEPTION 'Disallowed or invalid attachment MIME type: %', v_mime_type USING ERRCODE = '23514';
      END IF;

      -- Validate file size (max 20 MB)
      IF v_file_size_bytes IS NULL OR v_file_size_bytes <= 0 OR v_file_size_bytes > 20971520 THEN
        RAISE EXCEPTION 'Attachment file size % bytes violates limit (1 to 20MB)', v_file_size_bytes USING ERRCODE = '23514';
      END IF;

      -- Validate voice duration (max 180s)
      IF p_message_type = 'VOICE' THEN
        IF v_voice_duration_seconds IS NULL OR v_voice_duration_seconds <= 0 OR v_voice_duration_seconds > 180 THEN
          RAISE EXCEPTION 'Voice duration % seconds violates limit (1 to 180s)', v_voice_duration_seconds USING ERRCODE = '23514';
        END IF;
      ELSIF v_voice_duration_seconds IS NOT NULL THEN
        IF v_voice_duration_seconds <= 0 OR v_voice_duration_seconds > 180 THEN
          RAISE EXCEPTION 'Voice duration % seconds violates limit (1 to 180s)', v_voice_duration_seconds USING ERRCODE = '23514';
        END IF;
      END IF;

      -- Insert into message_attachments table
      INSERT INTO public.message_attachments (
        message_id,
        conversation_id,
        storage_path,
        file_name,
        file_size_bytes,
        mime_type,
        voice_duration_seconds,
        created_at
      ) VALUES (
        v_message_id,
        p_conversation_id,
        v_storage_path,
        v_file_name,
        v_file_size_bytes,
        v_mime_type,
        v_voice_duration_seconds,
        v_created_at
      )
      RETURNING id INTO v_att_id;

      v_inserted_attachments := v_inserted_attachments || json_build_object(
        'id', v_att_id,
        'message_id', v_message_id,
        'conversation_id', p_conversation_id,
        'storage_path', v_storage_path,
        'file_name', v_file_name,
        'file_size_bytes', v_file_size_bytes,
        'mime_type', v_mime_type,
        'voice_duration_seconds', v_voice_duration_seconds,
        'created_at', v_created_at
      )::jsonb;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'id', v_message_id,
    'conversation_id', p_conversation_id,
    'sender_id', v_sender_id,
    'message_type', p_message_type,
    'body', p_body,
    'created_at', v_created_at,
    'updated_at', v_created_at,
    'attachments', v_inserted_attachments
  )::jsonb;
END;
$$;

-- Grant execution to authenticated role only; revoke from anon and public
REVOKE EXECUTE ON FUNCTION public.send_chat_message(uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_chat_message(uuid, text, text, jsonb) TO authenticated;



