alter table public.classes
  alter column semester_id drop not null;

alter table public.classes
  alter column modality drop not null;

alter table public.subjects
  alter column workload_hours drop not null;

alter table public.subjects
  alter column weekly_lessons drop not null;

comment on table public.classes is
  'School classes. Legacy local columns remain for compatibility, but SIAGE imports no longer require semester_id or modality.';

comment on table public.subjects is
  'Curricular subjects synchronized from SIAGE. Legacy local columns remain for compatibility, but SIAGE imports no longer require workload_hours or weekly_lessons.';
