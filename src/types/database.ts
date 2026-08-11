export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          external_id: string | null;
          name: string;
          city: string | null;
          state: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          name: string;
          city?: string | null;
          state?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          name?: string;
          city?: string | null;
          state?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: [];
      };
      semesters: {
        Row: {
          id: string;
          year: number;
          semester: 1 | 2;
          start_date: string;
          end_date: string;
          status: "planned" | "active" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          semester: 1 | 2;
          start_date: string;
          end_date: string;
          status?: "planned" | "active" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          semester?: 1 | 2;
          start_date?: string;
          end_date?: string;
          status?: "planned" | "active" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academic_periods: {
        Row: {
          id: string;
          external_id: string | null;
          year: number | null;
          name: string | null;
          is_active: boolean;
          source: string;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          year?: number | null;
          name?: string | null;
          is_active?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          year?: number | null;
          name?: string | null;
          is_active?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          external_id: string | null;
          name: string;
          email: string | null;
          role: string | null;
          status: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          name: string;
          email?: string | null;
          role?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          name?: string;
          email?: string | null;
          role?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: [];
      };
      professional_enrollments: {
        Row: {
          id: string;
          external_id: string | null;
          professional_id: string;
          school_id: string | null;
          status: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          professional_id: string;
          school_id?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          professional_id?: string;
          school_id?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      classes: {
        Row: {
          id: string;
          external_id: string | null;
          school_id: string;
          semester_id: string | null;
          academic_period_id: string | null;
          name: string;
          grade: string;
          letter: string | null;
          course: string;
          shift: string;
          modality: "integral" | "eja" | null;
          room: string | null;
          stage: string | null;
          student_count: number;
          status: string;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          school_id: string;
          semester_id?: string | null;
          academic_period_id?: string | null;
          name: string;
          grade: string;
          letter?: string | null;
          course: string;
          shift: string;
          modality?: "integral" | "eja" | null;
          room?: string | null;
          stage?: string | null;
          student_count?: number;
          status?: string;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          school_id?: string;
          semester_id?: string | null;
          academic_period_id?: string | null;
          name?: string;
          grade?: string;
          letter?: string | null;
          course?: string;
          shift?: string;
          modality?: "integral" | "eja" | null;
          room?: string | null;
          stage?: string | null;
          student_count?: number;
          status?: string;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      subjects: {
        Row: {
          id: string;
          class_id: string | null;
          external_id: string | null;
          curriculum_subject_external_id: string | null;
          name: string;
          workload_hours: number | null;
          weekly_lessons: number | null;
          workload: number | null;
          component_type: string | null;
          status: string;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          class_id?: string | null;
          external_id?: string | null;
          curriculum_subject_external_id?: string | null;
          name: string;
          workload_hours?: number | null;
          weekly_lessons?: number | null;
          workload?: number | null;
          component_type?: string | null;
          status?: string;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string | null;
          external_id?: string | null;
          curriculum_subject_external_id?: string | null;
          name?: string;
          workload_hours?: number | null;
          weekly_lessons?: number | null;
          workload?: number | null;
          component_type?: string | null;
          status?: string;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      teacher_assignments: {
        Row: {
          id: string;
          external_id: string | null;
          class_id: string;
          subject_id: string;
          professional_enrollment_id: string;
          curriculum_subject_external_id: string | null;
          semester: string | null;
          multiple_allocation: boolean | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          class_id: string;
          subject_id: string;
          professional_enrollment_id: string;
          curriculum_subject_external_id?: string | null;
          semester?: string | null;
          multiple_allocation?: boolean | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          class_id?: string;
          subject_id?: string;
          professional_enrollment_id?: string;
          curriculum_subject_external_id?: string | null;
          semester?: string | null;
          multiple_allocation?: boolean | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      teaching_plans: {
        Row: {
          id: string;
          teacher_assignment_id: string;
          title: string;
          description: string | null;
          education_base: "technical" | "bncc";
          workload_hours: number | null;
          weekly_lessons: number | null;
          semester: string | null;
          status: "draft" | "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_assignment_id: string;
          title: string;
          description?: string | null;
          education_base: "technical" | "bncc";
          workload_hours?: number | null;
          weekly_lessons?: number | null;
          semester?: string | null;
          status?: "draft" | "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_assignment_id?: string;
          title?: string;
          description?: string | null;
          education_base?: "technical" | "bncc";
          workload_hours?: number | null;
          weekly_lessons?: number | null;
          semester?: string | null;
          status?: "draft" | "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      plan_units: {
        Row: {
          id: string;
          teaching_plan_id: string;
          title: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teaching_plan_id: string;
          title: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teaching_plan_id?: string;
          title?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      planned_lessons: {
        Row: {
          id: string;
          teaching_plan_id: string;
          plan_unit_id: string | null;
          title: string;
          knowledge_objects: string | null;
          objectives: string | null;
          methodology: string | null;
          observations_template: string | null;
          planned_date: string | null;
          lesson_number: number;
          duration_lessons: number;
          status: "planned" | "completed" | "postponed" | "cancelled";
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teaching_plan_id: string;
          plan_unit_id?: string | null;
          title: string;
          knowledge_objects?: string | null;
          objectives?: string | null;
          methodology?: string | null;
          observations_template?: string | null;
          planned_date?: string | null;
          lesson_number: number;
          duration_lessons?: number;
          status?: "planned" | "completed" | "postponed" | "cancelled";
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teaching_plan_id?: string;
          plan_unit_id?: string | null;
          title?: string;
          knowledge_objects?: string | null;
          objectives?: string | null;
          methodology?: string | null;
          observations_template?: string | null;
          planned_date?: string | null;
          lesson_number?: number;
          duration_lessons?: number;
          status?: "planned" | "completed" | "postponed" | "cancelled";
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      students: {
        Row: {
          id: string;
          external_id: string | null;
          name: string;
          enrollment_number: string | null;
          status: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          name: string;
          enrollment_number?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          name?: string;
          enrollment_number?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: [];
      };
      class_enrollments: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          external_id: string | null;
          status: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          external_id?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          external_id?: string | null;
          status?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      assignment_students: {
        Row: {
          id: string;
          teacher_assignment_id: string;
          student_id: string;
          external_id: string | null;
          source: string;
          raw_metadata: Json;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_assignment_id: string;
          student_id: string;
          external_id?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          teacher_assignment_id?: string;
          student_id?: string;
          external_id?: string | null;
          source?: string;
          raw_metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: Relationship[];
      };
      sync_runs: {
        Row: {
          id: string;
          source: string;
          status: string;
          started_at: string;
          finished_at: string | null;
          classes_count: number;
          subjects_count: number;
          students_count: number;
          assignments_count: number;
          class_enrollments_count: number;
          assignment_students_count: number;
          error_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source?: string;
          status: string;
          started_at?: string;
          finished_at?: string | null;
          classes_count?: number;
          subjects_count?: number;
          students_count?: number;
          assignments_count?: number;
          class_enrollments_count?: number;
          assignment_students_count?: number;
          error_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          classes_count?: number;
          subjects_count?: number;
          students_count?: number;
          assignments_count?: number;
          class_enrollments_count?: number;
          assignment_students_count?: number;
          error_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_errors: {
        Row: {
          id: string;
          sync_run_id: string;
          entity_type: string;
          external_id: string | null;
          message: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sync_run_id: string;
          entity_type: string;
          external_id?: string | null;
          message: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          sync_run_id?: string;
          entity_type?: string;
          external_id?: string | null;
          message?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
