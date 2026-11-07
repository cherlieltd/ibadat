-- My Daily Ibadah — Supabase schema
-- Run in Supabase SQL Editor or via CLI migrations.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('wife', 'husband');
create type public.activity_status as enum ('yes', 'no', 'unanswered');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'wife',
  preferred_locale text not null default 'bn' check (preferred_locale in ('bn', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  reminder_enabled boolean not null default false,
  quran_reminder_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  record_date date not null,
  fajr_status public.activity_status not null default 'unanswered',
  dhuhr_status public.activity_status not null default 'unanswered',
  asr_status public.activity_status not null default 'unanswered',
  maghrib_status public.activity_status not null default 'unanswered',
  isha_status public.activity_status not null default 'unanswered',
  quran_status public.activity_status not null default 'unanswered',
  quran_minutes integer check (quran_minutes is null or quran_minutes >= 0),
  notes text,
  fajr_notes text,
  dhuhr_notes text,
  asr_notes text,
  maghrib_notes text,
  isha_notes text,
  quran_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, record_date)
);

create index if not exists daily_records_user_date_idx
  on public.daily_records (user_id, record_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_records_set_updated_at on public.daily_records;
create trigger daily_records_set_updated_at
before update on public.daily_records
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.user_role;
begin
  chosen_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'wife');
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    chosen_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.daily_records enable row level security;

-- Helper functions avoid RLS recursion when policies need role checks
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_wife_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'wife'
  )
$$;

-- Profiles: users can read/update their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Husband can read wife's profile
create policy "profiles_husband_read_wife"
  on public.profiles for select
  using (
    public.current_user_role() = 'husband'
    and role = 'wife'
  );

-- Daily records: wife CRUD own
create policy "records_select_own"
  on public.daily_records for select
  using (auth.uid() = user_id);

create policy "records_insert_own"
  on public.daily_records for insert
  with check (
    auth.uid() = user_id
    and public.current_user_role() = 'wife'
  );

create policy "records_update_own"
  on public.daily_records for update
  using (
    auth.uid() = user_id
    and public.current_user_role() = 'wife'
  )
  with check (auth.uid() = user_id);

create policy "records_delete_own"
  on public.daily_records for delete
  using (
    auth.uid() = user_id
    and public.current_user_role() = 'wife'
  );

-- Husband read-only access to wife's records
create policy "records_husband_read"
  on public.daily_records for select
  using (
    public.current_user_role() = 'husband'
    and public.is_wife_user(user_id)
  );

-- Realtime
alter publication supabase_realtime add table public.daily_records;

-- Optional helper: link a specific husband to a wife via app metadata.
-- For a private family app, husband can read any wife role profile/records
-- as defined above. Tighten further with a family_id if needed later.
