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
- Also stores `actual_date`, `completed_at`, `postponed_from`, and `execution_notes` for cronograma and future lesson register derivation

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
- The cronograma `/planejamento/[planoId]/cronograma` now turns planned lessons into a temporal execution flow
- The quick view `/planejamento/hoje` now lists lessons scheduled for the current date

## Planning data access layer

The planning module now has a dedicated server-side data layer in `src/features/planejamento/`.

### Folders

- `actions/`: write operations implemented as Server Action helpers over Supabase with server-side validation
- `queries/`: read operations for listing plans, loading a plan by id, and listing real teacher assignments
- `types/`: strict TypeScript contracts for plans, units, lessons, filters, action results, and validation results
- `schemas/`: validation schemas for create and update payloads before any write
- `utils/`: payload builders, status rules, reorder helpers, and database error translation

### Reads

- `listTeachingPlans(filters)` loads existing plans and their assignment context
- `getTeachingPlanById(id)` loads one plan with units and planned lessons in a single relational query
- `listTeachingPlanAssignments()` loads the real SIAGE-backed `teacher_assignments` used by the planning module

### Writes

- `createTeachingPlan(input)`
- `updateTeachingPlan(input)`
- `archiveTeachingPlan(input)`
- `createPlanUnit(input)`
- `updatePlanUnit(input)`
- `deletePlanUnit(input)`
- `createPlannedLesson(input)`
- `updatePlannedLesson(input)`
- `deletePlannedLesson(input)`
- `reorderPlanUnits(input)`
- `reorderPlannedLessons(input)`
- `updatePlannedLessonDate(input)`
- `autoDistributePlannedLessons(input)`
- `completePlannedLesson(input)`
- `postponePlannedLesson(input)`
- `cancelPlannedLesson(input)`
- `generateTeachingPlanWithAiAction(previousState, formData)`
- `applyGeneratedTeachingPlanAction(formData)`

These functions:

- use the RLS-safe Supabase server client instead of any service-role key in the frontend
- validate payloads before writing
- return friendly messages in Portuguese
- translate common database errors into UI-safe messages
- revalidate the planning routes after successful mutations

### Constraint handling in the app layer

- only one active plan per `teacher_assignment` and semester is checked before activation
- lesson numbers are validated as unique inside each planning record
- lesson and unit ownership is validated before updates and deletions
- unit reordering uses a two-step position swap to respect the unique constraint on `(teaching_plan_id, position)`
- lesson reordering also uses a two-step position swap to respect the unique constraint on `(teaching_plan_id, position)`
- completed lessons are never redistributed automatically
- automatic distribution only overwrites existing dates when the teacher confirms this explicitly
- real execution data is stored separately from the planned lesson fields, preserving the original planning

### Compatibility layer

- `src/features/planejamento/actions.ts`
- `src/features/planejamento/data/queries.ts`
- `src/features/planejamento/constants.ts`
- `src/features/planejamento/types.ts`

These files preserve the previous import paths used by the current pages while delegating all real logic to the new data layer.

## AI-assisted planning

The planning module now also has an isolated AI generation layer in `src/features/planejamento/ai/`.

### AI folders

- `provider.ts`: provider abstraction and the current server-only OpenAI implementation
- `prompt.ts`: prompt builders with pedagogical and privacy constraints
- `schema.ts`: JSON Schema expected from the model response
- `parser.ts`: normalization and parsing of the raw model payload
- `validation.ts`: business validation for the generated draft
- `types.ts`: shared contracts for request, response, and review state

### Current provider

- Current implementation: OpenAI
- Required server environment variable: `OPENAI_API_KEY`
- Optional model override: `OPENAI_MODEL`
- Gemini remains planned in the abstraction but is not implemented yet

### Privacy rules

- AI calls happen only on the server
- The browser never receives the API key
- The prompt only sends pedagogical data needed for generation
- No student names, CPF, enrollment numbers, or other unnecessary personal data are sent to the model

### AI flow

- `/planejamento/novo/ia` generates a draft from a real `teacher_assignment`
- `/planejamento/[planoId]/ia` generates a draft to replace or revise an existing plan
- The model returns structured JSON only
- The generated draft is shown in a review step before any persistence
- The teacher may regenerate, edit, confirm, or cancel
- Persistence only happens after confirmation

### Transactional apply

- Migration `202608110001_add_planning_ai_apply_function.sql` adds `public.apply_ai_teaching_plan_draft(...)`
- The function recreates units and lessons in one transaction when the teacher confirms the reviewed draft
- This avoids partial writes between the parent plan, units, and planned lessons

### Current limitation

- `generalObjectives`, `methodologies`, and `assessmentStrategies` from the AI draft are currently persisted by composing them into `teaching_plans.description`
- Dedicated database columns for those fields may be added in a future migration if the product requires first-class filtering or reporting over them

## Scheduling and execution layer

The cronograma uses `planned_lessons` as the base entity for temporal organization and execution.

### Planned versus executed lesson

- Planned fields remain the source of truth for the original lesson proposal
- `status` acts as the current execution state for cronograma: `planned`, `completed`, `postponed`, or `cancelled`
- `actual_date` stores when the lesson really happened
- `postponed_from` stores the date before the last postponement
- `completed_at` stores the UTC timestamp when the lesson was marked as completed
- `execution_notes` stores the execution snapshot used to preserve differences between planned and executed content

### Execution snapshot

The app layer serializes execution details in `execution_notes` to preserve:

- whether the teacher followed the original planning
- execution note
- actual knowledge objects
- actual objectives
- actual methodology
- actual execution observations

This keeps the original planning intact while preparing the future lesson register and SIAGE write flow.

### Automatic distribution rules

- lessons are distributed in planning order
- the algorithm uses selected weekdays and `lessonsPerMeeting` as date capacity
- `duration_lessons` consumes the capacity of each meeting
- multiple lessons may share the same date when the meeting still has remaining capacity
- completed lessons are skipped
- lessons with existing dates are only overwritten when explicitly confirmed
- if a lesson requires more class periods than the meeting capacity, the action fails with a friendly message

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
- AI-assisted planning currently generates drafts only and never writes to SIAGE
- There are still no attendance, lesson register, or assessment tables connected to this planning flow
- Ordering is currently done with explicit `position` swaps, not drag and drop
- `execution_notes` currently stores a structured text payload instead of dedicated execution columns for each realized field
- Migration `202609030001_fix_planning_rls_and_plan_unit_delete.sql` creates the temporary development policies for planning and keeps lessons when their optional unit is deleted

## Lesson records

`lesson_records` keeps the reviewed internal record of an executed lesson without overwriting `planned_lessons`.

- `planned_lesson_id` is unique, so one planned lesson produces one internal record.
- `teacher_assignment_id` identifies the real class and subject context imported from SIAGE.
- `lesson_date`, `knowledge_objects`, `methodology`, `observations`, and `number_of_lessons` hold the reviewed execution values.
- Statuses are internal: `draft`, `ready`, `synced`, and `sync_error`.
- Migration `202609030002_create_lesson_records.sql` creates the table, indexes, update trigger, and temporary development RLS policy.

The data flow is: `teaching_plan -> planned_lesson -> execution snapshot -> lesson_record -> [future] SIAGE`.

The SIAGE POC has confirmed read endpoints and the record-aula navigation route, but no creation request body. `src/features/siage/lesson-records/buildSiageLessonPayload` intentionally returns no external payload until a manual capture confirms the SIAGE write contract.
