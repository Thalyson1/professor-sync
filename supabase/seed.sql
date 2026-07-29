insert into public.schools (id, name, city, state)
values
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778001',
    'Escola Estadual Professor Horizon',
    'João Pessoa',
    'PB'
  )
on conflict (id) do update
set
  name = excluded.name,
  city = excluded.city,
  state = excluded.state;

insert into public.semesters (id, year, semester, start_date, end_date, status)
values
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778101',
    2026,
    2,
    '2026-07-20',
    '2026-12-18',
    'active'
  )
on conflict (id) do update
set
  year = excluded.year,
  semester = excluded.semester,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status;

insert into public.classes (
  id,
  school_id,
  semester_id,
  name,
  grade,
  course,
  shift,
  modality,
  student_count,
  status
)
values
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778201',
    '1f4ce06d-c418-4c1b-9d4c-67098d778001',
    '1f4ce06d-c418-4c1b-9d4c-67098d778101',
    '1ª Série A',
    '1ª Série',
    'Informática',
    'integral',
    'integral',
    32,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778202',
    '1f4ce06d-c418-4c1b-9d4c-67098d778001',
    '1f4ce06d-c418-4c1b-9d4c-67098d778101',
    '2ª Série A',
    '2ª Série',
    'Informática',
    'integral',
    'integral',
    29,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778203',
    '1f4ce06d-c418-4c1b-9d4c-67098d778001',
    '1f4ce06d-c418-4c1b-9d4c-67098d778101',
    '3ª Série A',
    '3ª Série',
    'Informática',
    'integral',
    'integral',
    27,
    'active'
  )
on conflict (id) do update
set
  school_id = excluded.school_id,
  semester_id = excluded.semester_id,
  name = excluded.name,
  grade = excluded.grade,
  course = excluded.course,
  shift = excluded.shift,
  modality = excluded.modality,
  student_count = excluded.student_count,
  status = excluded.status;

insert into public.subjects (
  id,
  class_id,
  name,
  workload_hours,
  weekly_lessons,
  status
)
values
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778301',
    '1f4ce06d-c418-4c1b-9d4c-67098d778201',
    'Desenvolvimento Web',
    80,
    2,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778302',
    '1f4ce06d-c418-4c1b-9d4c-67098d778201',
    'Linguagem de Programação',
    60,
    2,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778303',
    '1f4ce06d-c418-4c1b-9d4c-67098d778202',
    'Sistemas Operacionais',
    60,
    2,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778304',
    '1f4ce06d-c418-4c1b-9d4c-67098d778202',
    'Arquitetura de Hardware',
    60,
    2,
    'active'
  ),
  (
    '1f4ce06d-c418-4c1b-9d4c-67098d778305',
    '1f4ce06d-c418-4c1b-9d4c-67098d778203',
    'Prática de Aplicações Orientadas a Objetos',
    80,
    2,
    'active'
  )
on conflict (id) do update
set
  class_id = excluded.class_id,
  name = excluded.name,
  workload_hours = excluded.workload_hours,
  weekly_lessons = excluded.weekly_lessons,
  status = excluded.status;
