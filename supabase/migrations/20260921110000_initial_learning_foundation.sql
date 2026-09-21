-- Sports Learning Platform: adult-owned learner foundation.
-- This migration intentionally excludes child accounts, schools, coaches, video, and payments.

create type public.experience_profile as enum (
  'elementary_playful',
  'middle_school_guided',
  'teen_performance',
  'adult_practical'
);

create type public.learner_access_role as enum ('owner', 'guardian', 'reviewer');

create table public.account_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  experience_profile public.experience_profile not null,
  created_by_account_id uuid not null references public.account_profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learner_access (
  learner_id uuid not null references public.learners (id) on delete cascade,
  account_id uuid not null references public.account_profiles (id) on delete cascade,
  role public.learner_access_role not null,
  created_at timestamptz not null default now(),
  primary key (learner_id, account_id)
);

create table public.learner_lesson_progress (
  learner_id uuid not null references public.learners (id) on delete cascade,
  lesson_id text not null,
  status text not null check (status in ('active', 'done')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id, lesson_id),
  check ((status = 'done') = (completed_at is not null))
);

create table public.learner_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null check (char_length(reason) between 1 and 120),
  source_lesson_id text,
  created_at timestamptz not null default now()
);

create index learner_access_account_id_idx on public.learner_access (account_id);
create index learner_lesson_progress_learner_id_idx on public.learner_lesson_progress (learner_id);
create index learner_reward_ledger_learner_id_idx on public.learner_reward_ledger (learner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger account_profiles_set_updated_at
before update on public.account_profiles
for each row execute function public.set_updated_at();

create trigger learners_set_updated_at
before update on public.learners
for each row execute function public.set_updated_at();

create trigger learner_lesson_progress_set_updated_at
before update on public.learner_lesson_progress
for each row execute function public.set_updated_at();

create or replace function public.create_account_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.account_profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''));
  return new;
end;
$$;

create trigger auth_user_created_account_profile
after insert on auth.users
for each row execute function public.create_account_profile();

create or replace function public.grant_creator_learner_access()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.learner_access (learner_id, account_id, role)
  values (new.id, new.created_by_account_id, 'owner');
  return new;
end;
$$;

create trigger learner_created_grant_owner_access
after insert on public.learners
for each row execute function public.grant_creator_learner_access();

create or replace function public.can_access_learner(target_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.learner_access
    where learner_id = target_learner_id and account_id = auth.uid()
  );
$$;

create or replace function public.can_manage_learner(target_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.learner_access
    where learner_id = target_learner_id
      and account_id = auth.uid()
      and role in ('owner', 'guardian')
  );
$$;

alter table public.account_profiles enable row level security;
alter table public.learners enable row level security;
alter table public.learner_access enable row level security;
alter table public.learner_lesson_progress enable row level security;
alter table public.learner_reward_ledger enable row level security;

create policy "accounts read their own profile"
on public.account_profiles for select to authenticated
using (id = auth.uid());

create policy "accounts update their own profile"
on public.account_profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "accounts read accessible learners"
on public.learners for select to authenticated
using (public.can_access_learner(id));

create policy "accounts create their own learners"
on public.learners for insert to authenticated
with check (created_by_account_id = auth.uid());

create policy "managers update accessible learners"
on public.learners for update to authenticated
using (public.can_manage_learner(id))
with check (public.can_manage_learner(id));

create policy "accounts read their learner access"
on public.learner_access for select to authenticated
using (account_id = auth.uid());

create policy "accounts read accessible lesson progress"
on public.learner_lesson_progress for select to authenticated
using (public.can_access_learner(learner_id));

create policy "managers write learner lesson progress"
on public.learner_lesson_progress for insert to authenticated
with check (public.can_manage_learner(learner_id));

create policy "managers update learner lesson progress"
on public.learner_lesson_progress for update to authenticated
using (public.can_manage_learner(learner_id))
with check (public.can_manage_learner(learner_id));

create policy "accounts read accessible rewards"
on public.learner_reward_ledger for select to authenticated
using (public.can_access_learner(learner_id));

-- Rewards will be written through a trusted server-side transaction in a later task.
revoke insert, update, delete on public.learner_reward_ledger from anon, authenticated;
