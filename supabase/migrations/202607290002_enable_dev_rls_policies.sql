grant usage on schema public to anon, authenticated;
grant select, insert, update on public.schools to anon, authenticated;
grant select, insert, update on public.semesters to anon, authenticated;
grant select, insert, update on public.classes to anon, authenticated;
grant select, insert, update on public.subjects to anon, authenticated;

alter table public.schools enable row level security;
alter table public.semesters enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;

drop policy if exists "dev_schools_select" on public.schools;
create policy "dev_schools_select"
on public.schools
for select
to anon, authenticated
using (true);

drop policy if exists "dev_schools_insert" on public.schools;
create policy "dev_schools_insert"
on public.schools
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_schools_update" on public.schools;
create policy "dev_schools_update"
on public.schools
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_semesters_select" on public.semesters;
create policy "dev_semesters_select"
on public.semesters
for select
to anon, authenticated
using (true);

drop policy if exists "dev_semesters_insert" on public.semesters;
create policy "dev_semesters_insert"
on public.semesters
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_semesters_update" on public.semesters;
create policy "dev_semesters_update"
on public.semesters
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_classes_select" on public.classes;
create policy "dev_classes_select"
on public.classes
for select
to anon, authenticated
using (true);

drop policy if exists "dev_classes_insert" on public.classes;
create policy "dev_classes_insert"
on public.classes
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_classes_update" on public.classes;
create policy "dev_classes_update"
on public.classes
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_subjects_select" on public.subjects;
create policy "dev_subjects_select"
on public.subjects
for select
to anon, authenticated
using (true);

drop policy if exists "dev_subjects_insert" on public.subjects;
create policy "dev_subjects_insert"
on public.subjects
for insert
to anon, authenticated
with check (true);

drop policy if exists "dev_subjects_update" on public.subjects;
create policy "dev_subjects_update"
on public.subjects
for update
to anon, authenticated
using (true)
with check (true);

comment on table public.schools is
  'Development-only permissive RLS policies are enabled. Replace with scoped policies when authentication is implemented.';
comment on table public.semesters is
  'Development-only permissive RLS policies are enabled. Replace with scoped policies when authentication is implemented.';
comment on table public.classes is
  'Development-only permissive RLS policies are enabled. Replace with scoped policies when authentication is implemented.';
comment on table public.subjects is
  'Development-only permissive RLS policies are enabled. Replace with scoped policies when authentication is implemented.';
