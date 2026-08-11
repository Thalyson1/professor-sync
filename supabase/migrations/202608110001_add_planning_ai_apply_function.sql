begin;

create unique index if not exists planned_lessons_teaching_plan_id_position_key
  on public.planned_lessons (teaching_plan_id, position);

create or replace function public.apply_ai_teaching_plan_draft(
  p_target_plan_id uuid,
  p_teacher_assignment_id uuid,
  p_title text,
  p_description text,
  p_education_base text,
  p_workload_hours numeric,
  p_weekly_lessons integer,
  p_semester text,
  p_status text,
  p_units jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_plan_id uuid;
  v_unit jsonb;
  v_lesson jsonb;
  v_unit_id uuid;
begin
  if p_teacher_assignment_id is null then
    raise exception 'teacher_assignment_id é obrigatório para aplicar o rascunho de IA.';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'title é obrigatório para aplicar o rascunho de IA.';
  end if;

  if p_education_base not in ('technical', 'bncc') then
    raise exception 'education_base inválido ao aplicar rascunho de IA.';
  end if;

  if p_status not in ('draft', 'active', 'completed', 'archived') then
    raise exception 'status inválido ao aplicar rascunho de IA.';
  end if;

  if p_target_plan_id is null then
    insert into public.teaching_plans (
      teacher_assignment_id,
      title,
      description,
      education_base,
      workload_hours,
      weekly_lessons,
      semester,
      status
    )
    values (
      p_teacher_assignment_id,
      btrim(p_title),
      nullif(btrim(coalesce(p_description, '')), ''),
      p_education_base,
      p_workload_hours,
      p_weekly_lessons,
      nullif(btrim(coalesce(p_semester, '')), ''),
      p_status
    )
    returning id into v_plan_id;
  else
    update public.teaching_plans
    set
      teacher_assignment_id = p_teacher_assignment_id,
      title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      education_base = p_education_base,
      workload_hours = p_workload_hours,
      weekly_lessons = p_weekly_lessons,
      semester = nullif(btrim(coalesce(p_semester, '')), ''),
      status = p_status
    where id = p_target_plan_id
    returning id into v_plan_id;

    if v_plan_id is null then
      raise exception 'Planejamento não encontrado para aplicar o rascunho de IA.';
    end if;

    delete from public.planned_lessons
    where teaching_plan_id = v_plan_id;

    delete from public.plan_units
    where teaching_plan_id = v_plan_id;
  end if;

  for v_unit in
    select value
    from jsonb_array_elements(coalesce(p_units, '[]'::jsonb))
  loop
    insert into public.plan_units (
      teaching_plan_id,
      title,
      description,
      position
    )
    values (
      v_plan_id,
      coalesce(nullif(btrim(v_unit ->> 'title'), ''), 'Unidade sem título'),
      nullif(btrim(coalesce(v_unit ->> 'description', '')), ''),
      coalesce((v_unit ->> 'position')::integer, 0)
    )
    returning id into v_unit_id;

    for v_lesson in
      select value
      from jsonb_array_elements(coalesce(v_unit -> 'lessons', '[]'::jsonb))
    loop
      insert into public.planned_lessons (
        teaching_plan_id,
        plan_unit_id,
        title,
        knowledge_objects,
        objectives,
        methodology,
        observations_template,
        planned_date,
        lesson_number,
        duration_lessons,
        status,
        position
      )
      values (
        v_plan_id,
        v_unit_id,
        coalesce(nullif(btrim(v_lesson ->> 'title'), ''), 'Aula sem título'),
        nullif(btrim(coalesce(v_lesson ->> 'knowledgeObjects', '')), ''),
        nullif(btrim(coalesce(v_lesson ->> 'objectives', '')), ''),
        nullif(btrim(coalesce(v_lesson ->> 'methodology', '')), ''),
        nullif(btrim(coalesce(v_lesson ->> 'observationsTemplate', '')), ''),
        nullif(v_lesson ->> 'plannedDate', '')::date,
        coalesce((v_lesson ->> 'lessonNumber')::integer, 1),
        coalesce((v_lesson ->> 'durationLessons')::integer, 1),
        coalesce(nullif(v_lesson ->> 'status', ''), 'planned'),
        coalesce((v_lesson ->> 'position')::integer, 0)
      );
    end loop;
  end loop;

  return v_plan_id;
end;
$$;

comment on function public.apply_ai_teaching_plan_draft(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  integer,
  text,
  text,
  jsonb
) is 'Aplica um rascunho validado de IA a um teaching_plan de forma transacional, recriando unidades e aulas planejadas no mesmo commit.';

commit;
