# Database Notes

## Current tables

### `schools`

- Stores the school linked to each class
- Current fields: `id`, `name`, `city`, `state`, `created_at`, `updated_at`

### `semesters`

- Stores the academic period for classes
- Current fields: `id`, `year`, `semester`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`

### `classes`

- Stores the class record shown in the Turmas module
- Current fields: `id`, `school_id`, `semester_id`, `name`, `grade`, `course`, `shift`, `modality`, `student_count`, `status`, `created_at`, `updated_at`

### `subjects`

- Stores the subjects linked to a class
- Current fields: `id`, `class_id`, `name`, `workload_hours`, `weekly_lessons`, `status`, `created_at`, `updated_at`

## Relationships

- `classes.school_id -> schools.id`
- `classes.semester_id -> semesters.id`
- `subjects.class_id -> classes.id`

## Development seed

The repository includes a `supabase/seed.sql` file with development-only data:

- one fictional state school from Paraiba
- the current semester (`2026.2`)
- three Informatica classes
- subjects aligned with the current PRD

## Temporary security model

Current policies are for development only.

- No authentication is implemented yet
- No service role key is used by the app
- Tables are temporarily accessible with the public anon key
- Row Level Security is disabled for the current tables to allow development flows without login

This is intentionally temporary and must change before production.

## What should change when authentication is added

- Enable Row Level Security on all application tables
- Replace broad anon access with explicit `select`, `insert`, `update` policies
- Link classes and subjects to a real teacher or membership model
- Restrict create and update operations by authenticated user context
- Review whether semester and school data should remain shared or become scoped by institution

## Current limitations

- There are no user, profile, or membership tables yet
- Pedagogical indicators in the Turmas detail page are still simulated
- No attendance, lesson register, assessment, or SIAGE integration tables exist yet
- No delete workflows were implemented in this stage
