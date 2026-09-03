begin;

alter table public.planned_lessons
  add column if not exists actual_date date null,
  add column if not exists completed_at timestamptz null,
  add column if not exists postponed_from date null,
  add column if not exists execution_notes text null;

comment on column public.planned_lessons.actual_date is
  'Data real em que a aula foi executada, sem alterar a data planejada original.';
comment on column public.planned_lessons.completed_at is
  'Timestamp em UTC do momento em que a aula foi marcada como realizada.';
comment on column public.planned_lessons.postponed_from is
  'Data anteriormente planejada antes do último adiamento da aula.';
comment on column public.planned_lessons.execution_notes is
  'Observações e snapshot textual/estruturado da execução real da aula, preservando diferenças em relação ao planejamento.';

create index if not exists planned_lessons_actual_date_idx
  on public.planned_lessons (actual_date);

create index if not exists planned_lessons_completed_at_idx
  on public.planned_lessons (completed_at);

commit;
