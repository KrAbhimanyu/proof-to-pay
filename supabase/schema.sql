-- ==============================================================================
-- PROOF-TO-PAY: Production-Grade Database Schema & Row-Level Security (RLS)
-- Shared across Web Application and Native Android Jetpack Compose App
-- Hardened against Privilege Escalation, Information Disclosure, & Tampering
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
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

-- 1. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  role user_role not null default 'STUDENT',
  avatar_url text,
  city text,
  state text,
  phone text,
  is_suspended boolean not null default false,
  suspension_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Student Profiles
create table if not exists public.student_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  headline text,
  bio text,
  age int not null check (age >= 18),
  college text,
  degree text,
  graduation_year int,
  skills text[] default '{}',
  experience_level text default 'INTERMEDIATE',
  portfolio_links jsonb default '[]'::jsonb,
  upi_id text,
  total_earned_paise bigint not null default 0 check (total_earned_paise >= 0),
  completed_projects_count int not null default 0 check (completed_projects_count >= 0),
  average_rating numeric(3,2) default null, -- Null until first verified review (anti-fake 5-star rule)
  verified_portfolio_slug text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Business Profiles
create table if not exists public.business_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  company_name text not null,
  tagline text,
  website text,
  industry text not null,
  city text not null,
  verification_status verification_status not null default 'UNVERIFIED',
  verification_legal_entity text,
  verification_doc_type text,
  verification_doc_number text, -- PRIVATE: restricted access
  verification_submitted_at timestamp with time zone,
  verification_verified_at timestamp with time zone,
  verification_admin_notes text, -- PRIVATE: admin only
  total_spent_paise bigint not null default 0 check (total_spent_paise >= 0),
  projects_posted_count int not null default 0 check (projects_posted_count >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Projects Listing
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  business_city text not null,
  business_verified boolean not null default false,
  title text not null,
  summary text not null,
  description text not null,
  category text not null,
  required_skills text[] not null default '{}',
  budget_paise bigint not null check (budget_paise >= 100000), -- Min ₹1,000 INR (100000 paise)
  deadline_days int not null check (deadline_days between 2 and 90),
  expected_delivery_date date not null,
  permitted_revisions int not null default 2 check (permitted_revisions between 1 and 5),
  application_closing_date date not null,
  payment_terms text not null,
  status project_status not null default 'DRAFT',
  cover_image text,
  moderation_notes text,
  selected_student_id uuid references public.profiles(id) on delete set null,
  selected_student_name text,
  active_offer_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Project Deliverables
create table if not exists public.deliverables (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text not null,
  format text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Applications
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

-- 7. Binding Offers & Scope Lock
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
  -- Authoritative Immutable Commission Terms Snapshot
  commission_rate_bps int not null default 500 check (commission_rate_bps between 0 and 2000), -- 500 = 5.00%
  platform_fee_paise bigint not null check (platform_fee_paise >= 0),
  creator_receives_paise bigint not null check (creator_receives_paise = agreed_budget_paise),
  fee_payer text not null default 'BUSINESS',
  commission_terms_snapshot text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone
);

-- 8. Scope Change Requests
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

-- 9. Submissions (Private between student, business, and admin)
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  version int not null default 1,
  notes text not null,
  live_link text,
  files jsonb default '[]'::jsonb,
  status text not null default 'PENDING_REVIEW',
  revision_feedback text,
  revision_requested_at timestamp with time zone,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Financial Record A: Business-to-Creator Project Payment
create table if not exists public.project_payments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  amount_paise bigint not null check (amount_paise >= 100000),
  status payment_status not null default 'NOT_REPORTED',
  payment_method payment_method not null default 'UPI',
  transaction_reference_utr text,
  payment_proof_url text, -- PRIVATE evidence
  recorded_by_user_id uuid references public.profiles(id) on delete set null,
  recorded_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  confirmed_by_user_id uuid references public.profiles(id) on delete set null,
  dispute_reason text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Financial Record B: Business-to-Proof-to-Pay Platform Commission
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

-- 12. Proof Passport: Public Verified Completed Outcomes (Distinguished from self-uploaded portfolio)
create table if not exists public.proof_passport_items (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  category text not null,
  sanitized_summary text not null, -- Sanitized public outcome summary (NO private files/PII)
  completion_source text not null default 'BUSINESS_APPROVAL' check (completion_source in ('BUSINESS_APPROVAL', 'DISPUTE_RESOLUTION')),
  business_name text not null,
  business_city text,
  rating int check (rating between 1 and 5),
  review_snippet text,
  is_public boolean not null default true, -- Creator has full control to show or hide
  display_order int not null default 0,
  badge_title text not null default 'Verified Work Delivery',
  completed_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, project_id)
);

-- 13. Verified Reviews
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

-- 14. Administrative Audit Logs (Append-Only)
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

-- 15. Disputes
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

-- 16. Abuse & Moderation Reports
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

-- 17. In-App Notifications
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

-- ==============================================================================
-- SECURE SERVER-SIDE FUNCTIONS & PRIVILEGE ESCALATION GUARDS
-- ==============================================================================

-- Helper: Check if current auth.uid() has active ADMIN role
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

-- Trigger: Prevent Users from Changing Role, Suspension, or Admin Notes
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
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

-- Trigger: Prevent Student Fake Rating / Stats Overrides
create or replace function public.prevent_student_stats_tampering()
returns trigger
language plpgsql
security definer
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

-- Trigger: Prevent Business Self-Verification or Document Tampering
create or replace function public.prevent_business_verification_tampering()
returns trigger
language plpgsql
security definer
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

-- Trigger: Prevent Non-Admins from marking Platform Fee as Verified Collected
create or replace function public.prevent_commission_verification_tampering()
returns trigger
language plpgsql
security definer
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

-- Documented Safe Function: Bootstrap Initial Administrator
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

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

-- 1. Profiles RLS: Private contact info (email/phone) is protected; Public directory viewable
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Public directory info viewable" on public.profiles
  for select using (not is_suspended);

create policy "Users can update own basic profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Student Profiles RLS: UPI ID is confidential, portfolio is public
create policy "Public student profile view" on public.student_profiles
  for select using (true);

create policy "Students can update own profile" on public.student_profiles
  for update using (auth.uid() = user_id);

create policy "Students can insert own profile" on public.student_profiles
  for insert with check (auth.uid() = user_id);

-- 3. Business Profiles RLS: Verification doc numbers and notes are private
create policy "Public business profile view" on public.business_profiles
  for select using (true);

create policy "Businesses can update own profile" on public.business_profiles
  for update using (auth.uid() = user_id);

create policy "Businesses can insert own profile" on public.business_profiles
  for insert with check (auth.uid() = user_id);

-- 4. Projects RLS
create policy "Approved projects are viewable by all" on public.projects
  for select using (status in ('APPROVED', 'IN_PROGRESS', 'COMPLETED') or business_id = auth.uid() or public.is_admin());

create policy "Businesses can insert own projects" on public.projects
  for insert with check (business_id = auth.uid());

create policy "Businesses can update own projects when draft or active" on public.projects
  for update using (business_id = auth.uid() or public.is_admin());

-- 5. Deliverables RLS
create policy "Deliverables viewable if project viewable" on public.deliverables
  for select using (exists (
    select 1 from public.projects
    where projects.id = deliverables.project_id
      and (projects.status in ('APPROVED', 'IN_PROGRESS', 'COMPLETED') or projects.business_id = auth.uid() or public.is_admin())
  ));

create policy "Businesses can manage project deliverables" on public.deliverables
  for all using (exists (
    select 1 from public.projects
    where projects.id = deliverables.project_id and projects.business_id = auth.uid()
  ));

-- 6. Applications RLS: Confidential between applicant, business, and admin
create policy "Students view own applications" on public.applications
  for select using (student_id = auth.uid() or public.is_admin());

create policy "Businesses view applications for their projects" on public.applications
  for select using (exists (
    select 1 from public.projects
    where projects.id = applications.project_id and projects.business_id = auth.uid()
  ));

create policy "Students can submit application" on public.applications
  for insert with check (student_id = auth.uid());

-- 7. Binding Offers RLS: Only involved parties and admin
create policy "Offer participants view offer" on public.project_offers
  for select using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

create policy "Business can create offer" on public.project_offers
  for insert with check (business_id = auth.uid());

create policy "Participants can update offer status" on public.project_offers
  for update using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- 8. Scope Change Requests RLS
create policy "Scope change participants view" on public.scope_change_requests
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid() or public.is_admin())
    )
  );

create policy "Scope change participants create" on public.scope_change_requests
  for insert with check (
    requested_by_user_id = auth.uid() and
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid())
    )
  );

create policy "Scope change counterparty respond" on public.scope_change_requests
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = scope_change_requests.project_id
        and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid() or public.is_admin())
    )
  );

-- 9. Submissions RLS: Strictly private between student, client, and admin
create policy "Submissions viewable only by project participants" on public.submissions
  for select using (
    student_id = auth.uid() or
    exists (
      select 1 from public.projects
      where projects.id = submissions.project_id and projects.business_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Assigned student can create submission" on public.submissions
  for insert with check (
    student_id = auth.uid() and
    exists (
      select 1 from public.projects
      where projects.id = submissions.project_id and projects.selected_student_id = auth.uid()
    )
  );

-- 10. Project Payments RLS (Record A): Private between parties
create policy "Payment records viewable by parties and admin" on public.project_payments
  for select using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

create policy "Business can report payment" on public.project_payments
  for update using (business_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- 11. Platform Commissions RLS (Record B): Only business and admin
create policy "Commission records viewable by business and admin" on public.platform_commissions
  for select using (business_id = auth.uid() or public.is_admin());

create policy "Business can report commission payment" on public.platform_commissions
  for update using (business_id = auth.uid() or public.is_admin());

-- 12. Proof Passport Items RLS: Public only if creator opted in (is_public = true)
create policy "Public Proof Passport viewable when published" on public.proof_passport_items
  for select using (is_public = true or student_id = auth.uid() or public.is_admin());

create policy "Creator can toggle public visibility of own passport items" on public.proof_passport_items
  for update using (student_id = auth.uid() or public.is_admin());

-- 13. Verified Reviews RLS: Public read, only client can submit
create policy "Reviews are publicly readable" on public.reviews
  for select using (true);

create policy "Participants can submit review" on public.reviews
  for insert with check (reviewer_id = auth.uid());

-- 14. Audit Logs RLS: Admin only read; system append
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.is_admin());

create policy "Authenticated users can append audit log" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- 15. Disputes RLS
create policy "Disputes viewable by parties and admin" on public.disputes
  for select using (raised_by_user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.projects where projects.id = disputes.project_id and (projects.business_id = auth.uid() or projects.selected_student_id = auth.uid())
  ));

create policy "Participants can raise dispute" on public.disputes
  for insert with check (raised_by_user_id = auth.uid());

create policy "Admin can resolve dispute" on public.disputes
  for update using (public.is_admin());

-- 16. Abuse Reports RLS
create policy "Users submit abuse reports" on public.abuse_reports
  for insert with check (auth.uid() is not null);

create policy "Admins manage abuse reports" on public.abuse_reports
  for all using (public.is_admin());

-- 17. Notifications RLS
create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid());
