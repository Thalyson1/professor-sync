export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          city: string;
          state: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          state?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          state?: string;
          created_at?: string;
          updated_at?: string;
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
      classes: {
        Row: {
          id: string;
          school_id: string;
          semester_id: string;
          name: string;
          grade: string;
          course: string;
          shift: "integral" | "night";
          modality: "integral" | "eja";
          student_count: number;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          semester_id: string;
          name: string;
          grade: string;
          course: string;
          shift: "integral" | "night";
          modality: "integral" | "eja";
          student_count?: number;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          semester_id?: string;
          name?: string;
          grade?: string;
          course?: string;
          shift?: "integral" | "night";
          modality?: "integral" | "eja";
          student_count?: number;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey";
            columns: ["school_id"];
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_semester_id_fkey";
            columns: ["semester_id"];
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          }
        ];
      };
      subjects: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          workload_hours: number;
          weekly_lessons: number;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          name: string;
          workload_hours: number;
          weekly_lessons: number;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          name?: string;
          workload_hours?: number;
          weekly_lessons?: number;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
