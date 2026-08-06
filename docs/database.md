# Database Notes

## Current tables

### `schools`

- Stores schools from local setup and SIAGE syncs
- Also includes `external_id`, `source`, `raw_metadata`, and `last_synced_at`

### `academic_periods`

- Stores academic periods imported from SIAGE
- Used by SIAGE-backed classes without replacing the existing `semesters` table yet

### `semesters`

- Legacy local semester table kept for compatibility

### `classes`

- Stores class records shown in the Turmas module
- For SIAGE sync, one `classes` row maps to one real school class (`formacaoTurmaId`)
- Also includes `external_id`, `academic_period_id`, `letter`, `room`, `stage`, `source`, `raw_metadata`, and `last_synced_at`

### `subjects`

- Stores subjects linked to local classes and SIAGE subjects
- Also includes `external_id`, `curriculum_subject_external_id`, `workload`, `component_type`, `source`, `raw_metadata`, and `last_synced_at`

### `professionals`

- Stores SIAGE professional records without unnecessary personal identifiers such as CPF

### `professional_enrollments`

- Stores the professional enrollment or placement context used by SIAGE

### `teacher_assignments`

- Stores the teacher + class + subject assignment combinations from SIAGE
- This is now the anchor table for the planning module

### `teaching_plans`

- Stores semester teaching plans linked to a real `teacher_assignment`
- Supports `education_base` as `technical` or `bncc`
- Supports `status` as `draft`, `active`, `completed`, or `archived`
- Enforces only one active plan per assignment and semester

### `plan_units`

- Stores ordered teaching units inside a `teaching_plan`

### `planned_lessons`

- Stores ordered planned lessons inside a `teaching_plan`
- A lesson may optionally belong to a `plan_unit`
- Supports SIAGE-compatible methodologies
- Supports `status` as `planned`, `completed`, `postponed`, or `cancelled`

### `students`

- Stores unique students synchronized from SIAGE

### `class_enrollments`

- Stores unique student + class memberships

### `assignment_students`

- Stores student + teacher assignment memberships

### `sync_runs`

- Stores sync execution summaries for diagnostics and audit

### `sync_errors`

- Stores per-entity sync errors attached to a sync run

## Relationships

- `classes.school_id -> schools.id`
- `classes.semester_id -> semesters.id`
- `classes.academic_period_id -> academic_periods.id`
- `subjects.class_id -> classes.id` for legacy local records
- `professional_enrollments.professional_id -> professionals.id`
- `professional_enrollments.school_id -> schools.id`
- `teacher_assignments.class_id -> classes.id`
- `teacher_assignments.subject_id -> subjects.id`
- `teacher_assignments.professional_enrollment_id -> professional_enrollments.id`
- `teaching_plans.teacher_assignment_id -> teacher_assignments.id`
- `plan_units.teaching_plan_id -> teaching_plans.id`
- `planned_lessons.teaching_plan_id -> teaching_plans.id`
- `planned_lessons.plan_unit_id -> plan_units.id`
- `class_enrollments.class_id -> classes.id`
- `class_enrollments.student_id -> students.id`
- `assignment_students.teacher_assignment_id -> teacher_assignments.id`
- `assignment_students.student_id -> students.id`
- `sync_errors.sync_run_id -> sync_runs.id`

## Planning module notes

- Planning is now centered on real teacher assignments imported from SIAGE
- The listing page `/planejamento` works over the 13 real assignment rows
- The creation flow `/planejamento/novo?atribuicao={id}` creates draft plans only
- The editor `/planejamento/[planoId]` supports general data, units, and planned lessons
- There is still no AI generation, no PDF import, and no SIAGE writeback in this phase

## Temporary security model

Current policies are still for development only.

- No authentication is implemented yet
- Tables are temporarily accessible with the public anon key through RLS-backed clients
- New planning tables use permissive development policies for `select`, `insert`, `update`, and `delete`
- The app must continue using the anon/SSR client for frontend and Server Component reads
- `SUPABASE_SECRET_KEY` must never be exposed to browser code, client components, or public environment variables

This is intentionally temporary and must change before production.

## What should change when authentication is added

- Replace broad development policies with authenticated teacher-scoped policies
- Link `teaching_plans`, `plan_units`, and `planned_lessons` to the authenticated professional context
- Prevent one teacher from viewing or mutating another teacher's plans
- Remove any remaining backend secret-key fallback once explicit policies are enough
- Add audit fields such as `created_by` and `updated_by` where useful

## Current limitations

- There are no user, profile, or membership tables yet
- Planning is fully local to Supabase and does not write back to SIAGE yet
- There is no AI-assisted generation in the planning editor yet
- There are still no attendance, lesson register, or assessment tables connected to this planning flow
- Ordering is currently done with explicit `position` swaps, not drag and drop
