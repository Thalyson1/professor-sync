import "server-only";

import { AI_PLAN_RESPONSE_SCHEMA } from "./schema";
import { parseAiPlanningDraft } from "./parser";
import { buildAiPlanningSystemPrompt, buildAiPlanningUserPrompt } from "./prompt";
import { validateAiPlanningRequest } from "./validation";

import type { AiGenerationResult, AiPlanningRequest, AiProviderName } from "./types";

type AiProvider = {
  name: AiProviderName;
  generateDraft(input: AiPlanningRequest): Promise<AiGenerationResult>;
};

export async function generateTeachingPlanDraft(
  input: AiPlanningRequest
): Promise<AiGenerationResult> {
  const validationErrors = validateAiPlanningRequest(input);

  if (validationErrors.length > 0) {
    throw new Error(validationErrors[0]);
  }

  const provider = getAiProvider();
  return provider.generateDraft(input);
}

function getAiProvider(): AiProvider {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAiProvider();
  }

  if (process.env.GEMINI_API_KEY) {
    throw new Error(
      "A chave do Gemini foi encontrada, mas este provider ainda não foi implementado nesta etapa."
    );
  }

  throw new Error(
    "Nenhum provider de IA está configurado. Defina OPENAI_API_KEY no ambiente do servidor."
  );
}

function createOpenAiProvider(): AiProvider {
  return {
    name: "openai",
    async generateDraft(input) {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || "gpt-5";

      if (!apiKey) {
        throw new Error("OPENAI_API_KEY não está configurada no servidor.");
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          store: false,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: buildAiPlanningSystemPrompt()
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: buildAiPlanningUserPrompt(input)
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "teaching_plan_draft",
              schema: AI_PLAN_RESPONSE_SCHEMA,
              strict: true
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(
          "Não foi possível gerar o rascunho com IA no momento. Verifique a configuração do provider."
        );
      }

      const payload = (await response.json()) as {
        output_text?: string;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }

      if (!payload.output_text) {
        throw new Error("A IA não retornou um conteúdo estruturado para o planejamento.");
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(payload.output_text);
      } catch {
        throw new Error("A IA retornou um JSON inválido para o planejamento.");
      }

      const parsedDraft = parseAiPlanningDraft(parsedJson);

      if (!parsedDraft.success) {
        throw new Error(parsedDraft.errors[0]);
      }

      return {
        provider: "openai",
        draft: parsedDraft.data,
        rawText: payload.output_text
      };
    }
  };
}
