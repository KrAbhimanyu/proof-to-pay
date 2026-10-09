-- ==============================================================================
-- PROOF-TO-PAY: Supabase Database Schema & Row-Level Security (RLS)
-- Shared across Web Application and Native Android Jetpack Compose App
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('STUDENT', 'BUSINESS', 'ADMIN');
create type verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
create type project_status as enum (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED'
);
create type application_status as enum ('PENDING', 'SHORTLISTED', 'OFFER_EXTENDED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
create type offer_status as enum ('PENDING', 'ACCEPTED', 'DECLINED');
create type payment_status as enum ('NOT_INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type payment_method as enum ('UPI', 'NEFT_IMPS', 'BANK_TRANSFER');

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
  is_suspended boolean default false,
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
  total_earned_inr numeric default 0,
  completed_projects_count int default 0,
  average_rating numeric default 5.0,
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
  verification_status verification_status default 'UNVERIFIED',
  verification_legal_entity text,
  verification_doc_type text,
  verification_doc_number text,
  verification_submitted_at timestamp with time zone,
  verification_verified_at timestamp with time zone,
  verification_admin_notes text,
  total_spent_inr numeric default 0,
  projects_posted_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Projects Listing
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  business_city text not null,
  business_verified boolean default false,
  title text not null,
  summary text not null,
  description text not null,
  category text not null,
  required_skills text[] not null default '{}',
  budget_inr numeric not null check (budget_inr >= 1000),
  deadline_days int not null check (deadline_days >= 2),
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
  status application_status default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, student_id)
);

-- 7. Binding Offers
create table if not exists public.project_offers (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  agreed_budget_inr numeric not null,
  agreed_deadline date not null,
  agreed_revisions int not null default 2,
  scope_summary text not null,
  status offer_status default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone
);

-- 8. Submissions
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  version int not null default 1,
  notes text not null,
  live_link text,
  files jsonb default '[]'::jsonb,
  status text default 'PENDING_REVIEW',
  revision_feedback text,
  revision_requested_at timestamp with time zone,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Payment Records
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  project_title text not null,
  business_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  amount_inr numeric not null,
  status payment_status default 'NOT_INITIATED',
  payment_method payment_method default 'UPI',
  transaction_reference_utr text,
  payment_proof_url text,
  recorded_by_user_id uuid references public.profiles(id) on delete set null,
  recorded_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Verified Reviews
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

-- 11. In-App Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null, -- 'OFFER', 'APPLICATION', 'REVISION', 'PAYMENT', 'PROJECT'
  project_id uuid references public.projects(id) on delete set null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Administrative Audit Logs
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

-- 13. Beta Launch Feedback
create table if not exists public.beta_feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  user_role text,
  email text,
  category text not null default 'GENERAL',
  rating int not null check (rating between 1 and 5),
  message text not null,
  screen_or_feature text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Abuse & Moderation Reports
create table if not exists public.abuse_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_name text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_project_id uuid references public.projects(id) on delete set null,
  target_title text not null,
  reason text not null,
  description text not null,
  status text not null default 'PENDING',
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
alter table public.submissions enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.abuse_reports enable row level security;

-- Profiles: Public read, self update
create policy "Public profiles are viewable by all users" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Projects: Approved projects viewable by anyone; Business can manage own
create policy "Approved projects are viewable by anyone" on public.projects for select 
  using (status in ('APPROVED', 'IN_PROGRESS', 'COMPLETED') or business_id = auth.uid());
create policy "Businesses can insert own projects" on public.projects for insert 
  with check (business_id = auth.uid());
create policy "Businesses can update own projects if not accepted" on public.projects for update 
  using (business_id = auth.uid());

-- Applications: Student can view own; Business can view applications to their projects
create policy "Students can view own applications" on public.applications for select 
  using (student_id = auth.uid());
create policy "Businesses can view applications for their projects" on public.applications for select 
  using (exists (select 1 from public.projects where projects.id = applications.project_id and projects.business_id = auth.uid()));
create policy "Students can submit application" on public.applications for insert 
  with check (student_id = auth.uid());

-- Notifications: Only recipient can view
create policy "Users can view own notifications" on public.notifications for select 
  using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications for update 
  using (user_id = auth.uid());

-- Beta Feedback: Anyone authenticated or anonymous can insert feedback; only admin can select
create policy "Anyone can submit beta feedback" on public.beta_feedback for insert 
  with check (true);
create policy "Admins can view beta feedback" on public.beta_feedback for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN'));

-- Abuse Reports: Authenticated users can insert; only admin can view/update
create policy "Users can submit abuse reports" on public.abuse_reports for insert 
  with check (auth.uid() is not null);
create policy "Admins can view and manage abuse reports" on public.abuse_reports for all 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN'));
