begin;

-- Keep the plan ownership invariant while allowing a unit to be removed
-- without deleting the lessons that belong to the same teaching plan.
alter table public.planned_lessons
  drop constraint if exists planned_lessons_plan_unit_id_fkey,
  drop constraint if exists planned_lessons_teaching_plan_plan_unit_match_fkey;

alter table public.planned_lessons
  add constraint planned_lessons_plan_unit_teaching_plan_match_fkey
  foreign key (plan_unit_id, teaching_plan_id)
  references public.plan_units (id, teaching_plan_id)
  on delete set null (plan_unit_id);

-- Authentication is not available yet. These policies keep the RLS client
-- operational in development and must be replaced by teacher-scoped rules.
drop policy if exists development_teaching_plans_access on public.teaching_plans;
create policy development_teaching_plans_access
  on public.teaching_plans
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists development_plan_units_access on public.plan_units;
create policy development_plan_units_access
  on public.plan_units
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists development_planned_lessons_access on public.planned_lessons;
create policy development_planned_lessons_access
  on public.planned_lessons
  for all
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.teaching_plans is
  'Planejamentos semestrais vinculados a uma atribuicao real do professor. RLS ativo com politica permissiva apenas para desenvolvimento, ate existir autenticacao com escopo docente.';
comment on table public.plan_units is
  'Unidades ordenadas de um planejamento. RLS ativo com politica permissiva apenas para desenvolvimento.';
comment on table public.planned_lessons is
  'Aulas planejadas vinculadas opcionalmente a uma unidade do mesmo plano. RLS ativo com politica permissiva apenas para desenvolvimento.';

commit;
