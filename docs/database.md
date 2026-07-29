# Database Notes

## Current tables

### `schools`

- Stores schools from local setup and SIAGE syncs
- Also includes `external_id`, `source`, `raw_metadata`, and `last_synced_at`

### `academic_periods`

- Stores academic periods imported from SIAGE
- Used by SIAGE-backed classes without replacing the existing `semesters` table yet

### `semesters`

- Stores the academic period for classes
- Current fields: `id`, `year`, `semester`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`

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
- `class_enrollments.class_id -> classes.id`
- `class_enrollments.student_id -> students.id`
- `assignment_students.teacher_assignment_id -> teacher_assignments.id`
- `assignment_students.student_id -> students.id`
- `sync_errors.sync_run_id -> sync_runs.id`

## Development seed

The repository includes a `supabase/seed.sql` file with development-only data:

- one fictional state school from Paraiba
- the current semester (`2026.2`)
- three Informatica classes
- subjects aligned with the current PRD

## Temporary security model

Current policies are for development only.

- No authentication is implemented yet
- Tables are temporarily accessible with the public anon key
- Row Level Security should remain enabled with permissive development policies during this phase
- While the remote project policies are being aligned, the current server-only integration may temporarily use `SUPABASE_SECRET_KEY` in backend code only
- The secret key must never be exposed to browser code, client components, or public environment variables
- All new SIAGE sync tables keep permissive development RLS policies for now and must be tightened once authentication is added

This is intentionally temporary and must change before production.

## What should change when authentication is added

- Enable Row Level Security on all application tables
- Replace broad development policies with explicit `select`, `insert`, `update` policies scoped by authenticated users
- Remove the temporary server-only secret-key fallback once proper policies and authentication are in place
- Link classes and subjects to a real teacher or membership model
- Scope SIAGE sync rows to the authenticated professional or tenant model
- Restrict create and update operations by authenticated user context
- Review whether semester and school data should remain shared or become scoped by institution

## Current limitations

- There are no user, profile, or membership tables yet
- Pedagogical indicators in the Turmas detail page are still simulated
- No attendance, lesson register, assessment writeback, or SIAGE import job runner exists yet
- No delete workflows were implemented in this stage
