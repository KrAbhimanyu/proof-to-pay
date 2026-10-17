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
