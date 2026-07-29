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

alter table public.schools
  add column if not exists external_id text,
  add column if not exists source text not null default 'siage',
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schools_source_external_id_unique'
      and conrelid = 'public.schools'::regclass
  ) then
    alter table public.schools
      add constraint schools_source_external_id_unique unique (source, external_id);
  end if;
end
$$;

create index if not exists schools_external_id_idx
  on public.schools (external_id);

create index if not exists schools_source_external_id_idx
  on public.schools (source, external_id);

comment on table public.schools is
  'Schools synced from SIAGE or created locally. Development-only permissive RLS policies are enabled until authentication is implemented.';

comment on column public.schools.external_id is
  'External school identifier from the source system, such as SIAGE.';

comment on column public.schools.raw_metadata is
  'Sanitized source payload preserved for diagnostics and future reconciliation.';

create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  year integer check (year is null or year between 2020 and 2100),
  name text,
  is_active boolean not null default false,
  source text not null default 'siage',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint academic_periods_source_external_id_unique unique (source, external_id)
);

create index if not exists academic_periods_external_id_idx
  on public.academic_periods (external_id);

create index if not exists academic_periods_source_external_id_idx
  on public.academic_periods (source, external_id);

create index if not exists academic_periods_is_active_idx
  on public.academic_periods (is_active);

comment on table public.academic_periods is
  'Academic periods imported from SIAGE, such as yearly or semester-based cycles.';

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  name text not null,
  email text,
  role text,
  status text,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint professionals_source_external_id_unique unique (source, external_id)
);

create index if not exists professionals_external_id_idx
  on public.professionals (external_id);

create index if not exists professionals_source_external_id_idx
  on public.professionals (source, external_id);

comment on table public.professionals is
  'Teacher and staff records synchronized from SIAGE without storing unnecessary personal identifiers such as CPF.';

create table if not exists public.professional_enrollments (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  school_id uuid references public.schools(id) on delete restrict,
  status text,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint professional_enrollments_source_external_id_unique unique (source, external_id)
);

create index if not exists professional_enrollments_external_id_idx
  on public.professional_enrollments (external_id);

create index if not exists professional_enrollments_source_external_id_idx
  on public.professional_enrollments (source, external_id);

create index if not exists professional_enrollments_professional_id_idx
  on public.professional_enrollments (professional_id);

create index if not exists professional_enrollments_school_id_idx
  on public.professional_enrollments (school_id);

comment on table public.professional_enrollments is
  'Assignments of professionals to a school or institutional context in the source system.';

alter table public.classes
  add column if not exists external_id text,
  add column if not exists academic_period_id uuid references public.academic_periods(id) on delete restrict,
  add column if not exists letter text,
  add column if not exists room text,
  add column if not exists stage text,
  add column if not exists source text not null default 'siage',
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'classes_source_external_id_unique'
      and conrelid = 'public.classes'::regclass
  ) then
    alter table public.classes
      add constraint classes_source_external_id_unique unique (source, external_id);
  end if;
end
$$;

create index if not exists classes_external_id_idx
  on public.classes (external_id);

create index if not exists classes_source_external_id_idx
  on public.classes (source, external_id);

create index if not exists classes_academic_period_id_idx
  on public.classes (academic_period_id);

comment on table public.classes is
  'School classes. For SIAGE synchronization this table stores one record per real school class (formacaoTurmaId).';

comment on column public.classes.external_id is
  'External class identifier from the source system, such as formacaoTurmaId in SIAGE.';

alter table public.subjects
  alter column class_id drop not null;

alter table public.subjects
  add column if not exists external_id text,
  add column if not exists curriculum_subject_external_id text,
  add column if not exists component_type text,
  add column if not exists source text not null default 'siage',
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subjects'
      and column_name = 'workload'
  ) then
    alter table public.subjects
      add column workload integer;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subjects'
      and column_name = 'workload_hours'
  ) then
    update public.subjects
      set workload = coalesce(workload, workload_hours)
    where workload is distinct from coalesce(workload, workload_hours);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subjects_source_external_id_unique'
      and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects
      add constraint subjects_source_external_id_unique unique (source, external_id);
  end if;
end
$$;

create index if not exists subjects_external_id_idx
  on public.subjects (external_id);

create index if not exists subjects_source_external_id_idx
  on public.subjects (source, external_id);

create index if not exists subjects_curriculum_subject_external_id_idx
  on public.subjects (curriculum_subject_external_id);

comment on table public.subjects is
  'Curricular subjects synchronized from SIAGE. A subject may be reused across many teacher assignments.';

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  professional_enrollment_id uuid not null references public.professional_enrollments(id) on delete restrict,
  curriculum_subject_external_id text,
  semester text,
  multiple_allocation boolean,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint teacher_assignments_source_external_id_unique unique (source, external_id)
);

create index if not exists teacher_assignments_external_id_idx
  on public.teacher_assignments (external_id);

create index if not exists teacher_assignments_source_external_id_idx
  on public.teacher_assignments (source, external_id);

create index if not exists teacher_assignments_class_id_idx
  on public.teacher_assignments (class_id);

create index if not exists teacher_assignments_subject_id_idx
  on public.teacher_assignments (subject_id);

create index if not exists teacher_assignments_professional_enrollment_id_idx
  on public.teacher_assignments (professional_enrollment_id);

comment on table public.teacher_assignments is
  'Teacher-to-class-to-subject assignments synchronized from SIAGE.';

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  name text not null,
  enrollment_number text,
  status text,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint students_source_external_id_unique unique (source, external_id)
);

create index if not exists students_external_id_idx
  on public.students (external_id);

create index if not exists students_source_external_id_idx
  on public.students (source, external_id);

create index if not exists students_enrollment_number_idx
  on public.students (enrollment_number);

comment on table public.students is
  'Student records synchronized from SIAGE without storing unnecessary personal identifiers such as CPF.';

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  external_id text,
  status text,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint class_enrollments_class_id_student_id_unique unique (class_id, student_id)
);

create index if not exists class_enrollments_external_id_idx
  on public.class_enrollments (external_id);

create index if not exists class_enrollments_class_id_idx
  on public.class_enrollments (class_id);

create index if not exists class_enrollments_student_id_idx
  on public.class_enrollments (student_id);

comment on table public.class_enrollments is
  'Unique student-to-class memberships, independent of subject assignments.';

create table if not exists public.assignment_students (
  id uuid primary key default gen_random_uuid(),
  teacher_assignment_id uuid not null references public.teacher_assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  external_id text,
  source text not null default 'siage',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  constraint assignment_students_teacher_assignment_id_student_id_unique unique (teacher_assignment_id, student_id)
);

create index if not exists assignment_students_external_id_idx
  on public.assignment_students (external_id);

create index if not exists assignment_students_teacher_assignment_id_idx
  on public.assignment_students (teacher_assignment_id);

create index if not exists assignment_students_student_id_idx
  on public.assignment_students (student_id);

comment on table public.assignment_students is
  'Student memberships scoped to a specific teacher assignment (teacher + class + subject).';

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'siage',
  status text not null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  classes_count integer not null default 0,
  subjects_count integer not null default 0,
  students_count integer not null default 0,
  assignments_count integer not null default 0,
  class_enrollments_count integer not null default 0,
  assignment_students_count integer not null default 0,
  error_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sync_runs_source_idx
  on public.sync_runs (source);

create index if not exists sync_runs_status_idx
  on public.sync_runs (status);

create index if not exists sync_runs_started_at_idx
  on public.sync_runs (started_at desc);

comment on table public.sync_runs is
  'Audit log of synchronization attempts from SIAGE or future external sources.';

create table if not exists public.sync_errors (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.sync_runs(id) on delete cascade,
  entity_type text not null,
  external_id text,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sync_errors_sync_run_id_idx
  on public.sync_errors (sync_run_id);

create index if not exists sync_errors_entity_type_idx
  on public.sync_errors (entity_type);

create index if not exists sync_errors_external_id_idx
  on public.sync_errors (external_id);

comment on table public.sync_errors is
  'Entity-level synchronization failures attached to a sync run for diagnostics and retries.';

drop trigger if exists set_academic_periods_updated_at on public.academic_periods;
create trigger set_academic_periods_updated_at
before update on public.academic_periods
for each row
execute function public.set_updated_at();

drop trigger if exists set_professionals_updated_at on public.professionals;
create trigger set_professionals_updated_at
before update on public.professionals
for each row
execute function public.set_updated_at();

drop trigger if exists set_professional_enrollments_updated_at on public.professional_enrollments;
create trigger set_professional_enrollments_updated_at
before update on public.professional_enrollments
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

drop trigger if exists set_schools_updated_at on public.schools;
create trigger set_schools_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

drop trigger if exists set_teacher_assignments_updated_at on public.teacher_assignments;
create trigger set_teacher_assignments_updated_at
before update on public.teacher_assignments
for each row
execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

drop trigger if exists set_class_enrollments_updated_at on public.class_enrollments;
create trigger set_class_enrollments_updated_at
before update on public.class_enrollments
for each row
execute function public.set_updated_at();

drop trigger if exists set_assignment_students_updated_at on public.assignment_students;
create trigger set_assignment_students_updated_at
before update on public.assignment_students
for each row
execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.academic_periods to anon, authenticated;
grant select, insert, update on public.professionals to anon, authenticated;
grant select, insert, update on public.professional_enrollments to anon, authenticated;
grant select, insert, update on public.teacher_assignments to anon, authenticated;
grant select, insert, update on public.students to anon, authenticated;
grant select, insert, update on public.class_enrollments to anon, authenticated;
grant select, insert, update on public.assignment_students to anon, authenticated;
grant select, insert on public.sync_runs to anon, authenticated;
grant select, insert on public.sync_errors to anon, authenticated;

alter table public.academic_periods enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_enrollments enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.students enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.assignment_students enable row level security;
alter table public.sync_runs enable row level security;
alter table public.sync_errors enable row level security;

drop policy if exists "dev_academic_periods_select" on public.academic_periods;
create policy "dev_academic_periods_select"
on public.academic_periods
for select
to anon, authenticated
using (true);

drop policy if exists "dev_academic_periods_insert" on public.academic_periods;
create policy "dev_academic_periods_insert"
on public.academic_periods
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_academic_periods_update" on public.academic_periods;
create policy "dev_academic_periods_update"
on public.academic_periods
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_professionals_select" on public.professionals;
create policy "dev_professionals_select"
on public.professionals
for select
to anon, authenticated
using (true);

drop policy if exists "dev_professionals_insert" on public.professionals;
create policy "dev_professionals_insert"
on public.professionals
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_professionals_update" on public.professionals;
create policy "dev_professionals_update"
on public.professionals
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_professional_enrollments_select" on public.professional_enrollments;
create policy "dev_professional_enrollments_select"
on public.professional_enrollments
for select
to anon, authenticated
using (true);

drop policy if exists "dev_professional_enrollments_insert" on public.professional_enrollments;
create policy "dev_professional_enrollments_insert"
on public.professional_enrollments
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_professional_enrollments_update" on public.professional_enrollments;
create policy "dev_professional_enrollments_update"
on public.professional_enrollments
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_teacher_assignments_select" on public.teacher_assignments;
create policy "dev_teacher_assignments_select"
on public.teacher_assignments
for select
to anon, authenticated
using (true);

drop policy if exists "dev_teacher_assignments_insert" on public.teacher_assignments;
create policy "dev_teacher_assignments_insert"
on public.teacher_assignments
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_teacher_assignments_update" on public.teacher_assignments;
create policy "dev_teacher_assignments_update"
on public.teacher_assignments
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_students_select" on public.students;
create policy "dev_students_select"
on public.students
for select
to anon, authenticated
using (true);

drop policy if exists "dev_students_insert" on public.students;
create policy "dev_students_insert"
on public.students
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_students_update" on public.students;
create policy "dev_students_update"
on public.students
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_class_enrollments_select" on public.class_enrollments;
create policy "dev_class_enrollments_select"
on public.class_enrollments
for select
to anon, authenticated
using (true);

drop policy if exists "dev_class_enrollments_insert" on public.class_enrollments;
create policy "dev_class_enrollments_insert"
on public.class_enrollments
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_class_enrollments_update" on public.class_enrollments;
create policy "dev_class_enrollments_update"
on public.class_enrollments
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_assignment_students_select" on public.assignment_students;
create policy "dev_assignment_students_select"
on public.assignment_students
for select
to anon, authenticated
using (true);

drop policy if exists "dev_assignment_students_insert" on public.assignment_students;
create policy "dev_assignment_students_insert"
on public.assignment_students
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_assignment_students_update" on public.assignment_students;
create policy "dev_assignment_students_update"
on public.assignment_students
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_sync_runs_select" on public.sync_runs;
create policy "dev_sync_runs_select"
on public.sync_runs
for select
to anon, authenticated
using (true);

drop policy if exists "dev_sync_runs_insert" on public.sync_runs;
create policy "dev_sync_runs_insert"
on public.sync_runs
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_sync_errors_select" on public.sync_errors;
create policy "dev_sync_errors_select"
on public.sync_errors
for select
to anon, authenticated
using (true);

drop policy if exists "dev_sync_errors_insert" on public.sync_errors;
create policy "dev_sync_errors_insert"
on public.sync_errors
for insert
to anon, authenticated
with check (true);
