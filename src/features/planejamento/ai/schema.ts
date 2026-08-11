import type { AiPlanningDraft } from "./types";

export const AI_PLAN_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "educationBase",
    "generalObjectives",
    "methodologies",
    "assessmentStrategies",
    "units"
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    educationBase: {
      type: "string",
      enum: ["technical", "bncc"]
    },
    generalObjectives: {
      type: "array",
      items: { type: "string" }
    },
    methodologies: {
      type: "array",
      items: { type: "string" }
    },
    assessmentStrategies: {
      type: "array",
      items: { type: "string" }
    },
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "position", "lessons"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          position: { type: "integer" },
          lessons: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "lessonNumber",
                "title",
                "knowledgeObjects",
                "objectives",
                "methodology",
                "observationsTemplate",
                "durationLessons",
                "position"
              ],
              properties: {
                lessonNumber: { type: "integer" },
                title: { type: "string" },
                knowledgeObjects: { type: "string" },
                objectives: { type: "string" },
                methodology: { type: "string" },
                observationsTemplate: { type: "string" },
                plannedDate: {
                  type: ["string", "null"]
                },
                durationLessons: { type: "integer" },
                position: { type: "integer" }
              }
            }
          }
        }
      }
    }
  }
} as const;

export type AiPlanResponseSchema = typeof AI_PLAN_RESPONSE_SCHEMA;

export type AiDraftValidationResult =
  | { success: true; data: AiPlanningDraft }
  | { success: false; errors: string[] };
