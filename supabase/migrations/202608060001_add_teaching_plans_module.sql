begin;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
  ) then
    execute $fn$
      create function public.set_updated_at()
      returns trigger
      language plpgsql
      as $body$
      begin
        new.updated_at = timezone('utc', now());
        return new;
      end;
      $body$;
    $fn$;
  end if;
end
$$;

create table if not exists public.teaching_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_assignment_id uuid not null,
  title text not null,
  description text null,
  education_base text not null,
  workload_hours numeric null,
  weekly_lessons integer null,
  semester text null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_plans_teacher_assignment_id_fkey
    foreign key (teacher_assignment_id)
    references public.teacher_assignments(id)
    on delete restrict,
  constraint teaching_plans_education_base_check
    check (education_base in ('technical', 'bncc')),
  constraint teaching_plans_status_check
    check (status in ('draft', 'active', 'completed', 'archived')),
  constraint teaching_plans_workload_hours_check
    check (workload_hours is null or workload_hours > 0),
  constraint teaching_plans_weekly_lessons_check
    check (weekly_lessons is null or weekly_lessons > 0)
);

comment on table public.teaching_plans is
  'Planejamentos semestrais vinculados a uma atribuicao real do professor em teacher_assignments.';
comment on column public.teaching_plans.teacher_assignment_id is
  'Referencia para a atribuicao real professor + turma + disciplina importada do SIAGE.';
comment on column public.teaching_plans.education_base is
  'Base educacional do planejamento: technical ou bncc.';
comment on column public.teaching_plans.semester is
  'Identificador textual do semestre letivo do planejamento.';
comment on column public.teaching_plans.status is
  'Estado do planejamento: draft, active, completed ou archived.';

create table if not exists public.plan_units (
  id uuid primary key default gen_random_uuid(),
  teaching_plan_id uuid not null,
  title text not null,
  description text null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_units_teaching_plan_id_fkey
    foreign key (teaching_plan_id)
    references public.teaching_plans(id)
    on delete cascade,
  constraint plan_units_position_check
    check (position >= 0),
  constraint plan_units_teaching_plan_id_position_key
    unique (teaching_plan_id, position),
  constraint plan_units_id_teaching_plan_id_key
    unique (id, teaching_plan_id)
);

comment on table public.plan_units is
  'Unidades ordenadas pertencentes a um planejamento semestral.';
comment on column public.plan_units.teaching_plan_id is
  'Planejamento ao qual a unidade pertence.';
comment on column public.plan_units.position is
  'Posicao ordenavel da unidade dentro do planejamento.';

create table if not exists public.planned_lessons (
  id uuid primary key default gen_random_uuid(),
  teaching_plan_id uuid not null,
  plan_unit_id uuid null,
  title text not null,
  knowledge_objects text null,
  objectives text null,
  methodology text null,
  observations_template text null,
  planned_date date null,
  lesson_number integer not null,
  duration_lessons integer not null default 1,
  status text not null default 'planned',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planned_lessons_teaching_plan_id_fkey
    foreign key (teaching_plan_id)
    references public.teaching_plans(id)
    on delete cascade,
  constraint planned_lessons_plan_unit_id_fkey
    foreign key (plan_unit_id)
    references public.plan_units(id)
    on delete set null,
  constraint planned_lessons_teaching_plan_plan_unit_match_fkey
    foreign key (plan_unit_id, teaching_plan_id)
    references public.plan_units(id, teaching_plan_id)
    on delete set null,
  constraint planned_lessons_status_check
    check (status in ('planned', 'completed', 'postponed', 'cancelled')),
  constraint planned_lessons_lesson_number_check
    check (lesson_number > 0),
  constraint planned_lessons_duration_lessons_check
    check (duration_lessons > 0),
  constraint planned_lessons_position_check
    check (position >= 0),
  constraint planned_lessons_teaching_plan_id_lesson_number_key
    unique (teaching_plan_id, lesson_number)
);

comment on table public.planned_lessons is
  'Aulas planejadas de um planejamento semestral, com vinculacao opcional a unidades.';
comment on column public.planned_lessons.plan_unit_id is
  'Unidade opcional do planejamento, sempre pertencente ao mesmo teaching_plan_id.';
comment on column public.planned_lessons.lesson_number is
  'Numero sequencial da aula dentro do planejamento.';
comment on column public.planned_lessons.status is
  'Estado da aula planejada: planned, completed, postponed ou cancelled.';
comment on column public.planned_lessons.position is
  'Posicao ordenavel da aula dentro do planejamento.';

create unique index if not exists teaching_plans_active_per_assignment_semester_uidx
  on public.teaching_plans (
    teacher_assignment_id,
    coalesce(semester, '__null_semester__')
  )
  where status = 'active';

create index if not exists teaching_plans_teacher_assignment_id_idx
  on public.teaching_plans (teacher_assignment_id);

create index if not exists teaching_plans_status_idx
  on public.teaching_plans (status);

create index if not exists plan_units_teaching_plan_id_idx
  on public.plan_units (teaching_plan_id);

create index if not exists planned_lessons_teaching_plan_id_idx
  on public.planned_lessons (teaching_plan_id);

create index if not exists planned_lessons_plan_unit_id_idx
  on public.planned_lessons (plan_unit_id);

create index if not exists planned_lessons_planned_date_idx
  on public.planned_lessons (planned_date);

create index if not exists planned_lessons_status_idx
  on public.planned_lessons (status);

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

alter table public.teaching_plans enable row level security;
alter table public.plan_units enable row level security;
alter table public.planned_lessons enable row level security;

comment on table public.teaching_plans is
  'Planejamentos semestrais vinculados a uma atribuicao real do professor em teacher_assignments. RLS ativado; politicas serao criadas em migration posterior quando houver vinculo seguro com autenticacao.';
comment on table public.plan_units is
  'Unidades ordenadas pertencentes a um planejamento semestral. RLS ativado; politicas serao criadas em migration posterior.';
comment on table public.planned_lessons is
  'Aulas planejadas de um planejamento semestral, com vinculacao opcional a unidades. RLS ativado; politicas serao criadas em migration posterior.';

commit;
