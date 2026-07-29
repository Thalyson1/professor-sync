create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 3),
  city text not null check (char_length(trim(city)) >= 2),
  state text not null default 'PB' check (char_length(trim(state)) = 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year >= 2020 and year <= 2100),
  semester integer not null check (semester in (1, 2)),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint semesters_date_range_check check (end_date >= start_date),
  constraint semesters_year_semester_unique unique (year, semester)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  semester_id uuid not null references public.semesters(id),
  name text not null check (char_length(trim(name)) >= 3),
  grade text not null check (char_length(trim(grade)) >= 2),
  course text not null check (char_length(trim(course)) >= 3),
  shift text not null check (shift in ('integral', 'night')),
  modality text not null check (modality in ('integral', 'eja')),
  student_count integer not null default 0 check (student_count >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id),
  name text not null check (char_length(trim(name)) >= 3),
  workload_hours integer not null check (workload_hours > 0),
  weekly_lessons integer not null check (weekly_lessons > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists schools_state_city_idx
  on public.schools (state, city);

create index if not exists semesters_status_idx
  on public.semesters (status);

create index if not exists classes_school_id_idx
  on public.classes (school_id);

create index if not exists classes_semester_id_idx
  on public.classes (semester_id);

create index if not exists classes_status_idx
  on public.classes (status);

create index if not exists classes_shift_modality_idx
  on public.classes (shift, modality);

create index if not exists subjects_class_id_idx
  on public.subjects (class_id);

create index if not exists subjects_status_idx
  on public.subjects (status);

drop trigger if exists set_schools_updated_at on public.schools;
create trigger set_schools_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

drop trigger if exists set_semesters_updated_at on public.semesters;
create trigger set_semesters_updated_at
before update on public.semesters
for each row
execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at
before update on public.classes
for each row
execute function public.set_updated_at();

drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at
before update on public.subjects
for each row
execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.schools to anon, authenticated;
grant select, insert, update on public.semesters to anon, authenticated;
grant select, insert, update on public.classes to anon, authenticated;
grant select, insert, update on public.subjects to anon, authenticated;

alter table public.schools disable row level security;
alter table public.semesters disable row level security;
alter table public.classes disable row level security;
alter table public.subjects disable row level security;

comment on table public.schools is
  'Development-only access for now. RLS must be enabled when authentication is implemented.';
comment on table public.semesters is
  'Development-only access for now. RLS must be enabled when authentication is implemented.';
comment on table public.classes is
  'Development-only access for now. RLS must be enabled when authentication is implemented.';
comment on table public.subjects is
  'Development-only access for now. RLS must be enabled when authentication is implemented.';
