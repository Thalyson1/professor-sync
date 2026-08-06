create table if not exists public.teaching_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_assignment_id uuid not null references public.teacher_assignments(id) on delete restrict,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  education_base text not null check (education_base in ('technical', 'bncc')),
  workload_hours integer not null check (workload_hours > 0),
  weekly_lessons integer not null check (weekly_lessons > 0),
  semester text not null check (char_length(trim(semester)) > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists teaching_plans_teacher_assignment_id_idx
  on public.teaching_plans (teacher_assignment_id);

create index if not exists teaching_plans_semester_idx
  on public.teaching_plans (semester);

create index if not exists teaching_plans_status_idx
  on public.teaching_plans (status);

create index if not exists teaching_plans_education_base_idx
  on public.teaching_plans (education_base);

create unique index if not exists teaching_plans_active_per_assignment_semester_idx
  on public.teaching_plans (teacher_assignment_id, semester)
  where status = 'active';

comment on table public.teaching_plans is
  'Semester teaching plans linked to a real teacher assignment imported from SIAGE.';

create table if not exists public.plan_units (
  id uuid primary key default gen_random_uuid(),
  teaching_plan_id uuid not null references public.teaching_plans(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists plan_units_teaching_plan_id_idx
  on public.plan_units (teaching_plan_id);

create index if not exists plan_units_teaching_plan_position_idx
  on public.plan_units (teaching_plan_id, position);

comment on table public.plan_units is
  'Ordered units inside a semester teaching plan.';

create table if not exists public.planned_lessons (
  id uuid primary key default gen_random_uuid(),
  teaching_plan_id uuid not null references public.teaching_plans(id) on delete cascade,
  plan_unit_id uuid references public.plan_units(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  knowledge_objects text,
  objectives text,
  methodology text check (
    methodology is null or methodology in (
      'Apresentação de trabalhos pelos estudantes',
      'Atividades de Práticas Integradoras',
      'Aula contextualizada',
      'Aula de campo',
      'Aula dialogada',
      'Aula em laboratório didático',
      'Aula em laboratório educacional de Ciências',
      'Aula em laboratório educacional de informática',
      'Aula em laboratório técnico',
      'Aula prática',
      'Avaliação',
      'Evento escolar',
      'Momento comemorativo da turma',
      'Outros',
      'Participação em eventos',
      'Visita técnica'
    )
  ),
  observations_template text,
  planned_date date,
  lesson_number integer not null check (lesson_number > 0),
  duration_lessons integer not null default 1 check (duration_lessons > 0),
  status text not null default 'planned' check (status in ('planned', 'completed', 'postponed', 'cancelled')),
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists planned_lessons_teaching_plan_id_idx
  on public.planned_lessons (teaching_plan_id);

create index if not exists planned_lessons_plan_unit_id_idx
  on public.planned_lessons (plan_unit_id);

create index if not exists planned_lessons_teaching_plan_position_idx
  on public.planned_lessons (teaching_plan_id, position);

create index if not exists planned_lessons_status_idx
  on public.planned_lessons (status);

comment on table public.planned_lessons is
  'Ordered planned lessons linked to a teaching plan and optionally grouped by plan unit.';

drop trigger if exists set_teaching_plans_updated_at on public.teaching_plans;
create trigger set_teaching_plans_updated_at
before update on public.teaching_plans
for each row
execute function public.set_updated_at();

drop trigger if exists set_plan_units_updated_at on public.plan_units;
create trigger set_plan_units_updated_at
before update on public.plan_units
for each row
execute function public.set_updated_at();

drop trigger if exists set_planned_lessons_updated_at on public.planned_lessons;
create trigger set_planned_lessons_updated_at
before update on public.planned_lessons
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.teaching_plans to anon, authenticated;
grant select, insert, update, delete on public.plan_units to anon, authenticated;
grant select, insert, update, delete on public.planned_lessons to anon, authenticated;

alter table public.teaching_plans enable row level security;
alter table public.plan_units enable row level security;
alter table public.planned_lessons enable row level security;

drop policy if exists "dev_teaching_plans_select" on public.teaching_plans;
create policy "dev_teaching_plans_select"
on public.teaching_plans
for select
to anon, authenticated
using (true);

drop policy if exists "dev_teaching_plans_insert" on public.teaching_plans;
create policy "dev_teaching_plans_insert"
on public.teaching_plans
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_teaching_plans_update" on public.teaching_plans;
create policy "dev_teaching_plans_update"
on public.teaching_plans
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_teaching_plans_delete" on public.teaching_plans;
create policy "dev_teaching_plans_delete"
on public.teaching_plans
for delete
to anon, authenticated
using (true);

drop policy if exists "dev_plan_units_select" on public.plan_units;
create policy "dev_plan_units_select"
on public.plan_units
for select
to anon, authenticated
using (true);

drop policy if exists "dev_plan_units_insert" on public.plan_units;
create policy "dev_plan_units_insert"
on public.plan_units
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_plan_units_update" on public.plan_units;
create policy "dev_plan_units_update"
on public.plan_units
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_plan_units_delete" on public.plan_units;
create policy "dev_plan_units_delete"
on public.plan_units
for delete
to anon, authenticated
using (true);

drop policy if exists "dev_planned_lessons_select" on public.planned_lessons;
create policy "dev_planned_lessons_select"
on public.planned_lessons
for select
to anon, authenticated
using (true);

drop policy if exists "dev_planned_lessons_insert" on public.planned_lessons;
create policy "dev_planned_lessons_insert"
on public.planned_lessons
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_planned_lessons_update" on public.planned_lessons;
create policy "dev_planned_lessons_update"
on public.planned_lessons
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_planned_lessons_delete" on public.planned_lessons;
create policy "dev_planned_lessons_delete"
on public.planned_lessons
for delete
to anon, authenticated
using (true);

comment on table public.teaching_plans is
  'Development-only permissive RLS policies are enabled. Replace with authenticated teacher-scoped policies before production.';
comment on table public.plan_units is
  'Development-only permissive RLS policies are enabled. Replace with authenticated teacher-scoped policies before production.';
comment on table public.planned_lessons is
  'Development-only permissive RLS policies are enabled. Replace with authenticated teacher-scoped policies before production.';
