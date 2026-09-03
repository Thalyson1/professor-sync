begin;

create table if not exists public.lesson_records (
  id uuid primary key default gen_random_uuid(),
  planned_lesson_id uuid not null,
  teacher_assignment_id uuid not null,
  lesson_date date not null,
  knowledge_objects text null,
  methodology text null,
  observations text null,
  number_of_lessons integer not null default 1,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lesson_records_planned_lesson_id_fkey
    foreign key (planned_lesson_id)
    references public.planned_lessons(id)
    on delete restrict,
  constraint lesson_records_teacher_assignment_id_fkey
    foreign key (teacher_assignment_id)
    references public.teacher_assignments(id)
    on delete restrict,
  constraint lesson_records_planned_lesson_id_unique unique (planned_lesson_id),
  constraint lesson_records_number_of_lessons_check check (number_of_lessons > 0),
  constraint lesson_records_status_check check (status in ('draft', 'ready', 'synced', 'sync_error'))
);

create index if not exists lesson_records_teacher_assignment_id_idx
  on public.lesson_records (teacher_assignment_id);

create index if not exists lesson_records_lesson_date_idx
  on public.lesson_records (lesson_date desc);

create index if not exists lesson_records_status_idx
  on public.lesson_records (status);

drop trigger if exists set_lesson_records_updated_at on public.lesson_records;
create trigger set_lesson_records_updated_at
before update on public.lesson_records
for each row
execute function public.set_updated_at();

alter table public.lesson_records enable row level security;

drop policy if exists development_lesson_records_access on public.lesson_records;
create policy development_lesson_records_access
  on public.lesson_records
  for all
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.lesson_records is
  'Registro interno revisavel de uma aula realizada. Prepara dados para futura sincronizacao com o SIAGE sem realizar escrita externa.';
comment on column public.lesson_records.planned_lesson_id is
  'Aula planejada que originou o registro. Um registro interno por aula planejada.';
comment on column public.lesson_records.teacher_assignment_id is
  'Atribuicao real de professor, turma e disciplina usada para contextualizar o registro.';
comment on column public.lesson_records.status is
  'Estado interno: draft, ready, synced ou sync_error. Nenhuma escrita no SIAGE e feita por esta tabela.';

commit;
