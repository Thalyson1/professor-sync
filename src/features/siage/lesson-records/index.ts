import type { LessonRecord } from "@/features/registros/types";

import type { SiageLessonPayloadBuildResult } from "./types";

// No SIAGE write request has been captured yet. Returning no external payload
// prevents accidental field invention and keeps this mapper safe for future use.
export function buildSiageLessonPayload(
  _record: LessonRecord
): SiageLessonPayloadBuildResult {
  return {
    supported: false,
    payload: null,
    pendingInternalFields: [
      "lessonDate",
      "knowledgeObjects",
      "methodology",
      "observations",
      "numberOfLessons"
    ],
    reason:
      "A POC confirmou apenas rotas de leitura e navegacao do registro de aula. Capture manualmente uma requisicao de criacao antes de mapear campos do SIAGE."
  };
}

export type { SiageLessonPayloadBuildResult } from "./types";
