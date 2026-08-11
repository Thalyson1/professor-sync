import { SIAGE_METHODOLOGIES } from "../utils/constants";
import {
  isEducationBase,
  isPlannedLessonStatus,
  isTeachingPlanStatus
} from "../utils/status-rules";
import { failure, success } from "../utils/validators";

import type {
  CreatePlannedLessonInput,
  CreatePlanUnitInput,
  CreateTeachingPlanInput,
  UpdateTeachingPlanInput,
  ValidationResult
} from "../types";

type Schema<T> = {
  safeParse(input: unknown): ValidationResult<T>;
};

export const createTeachingPlanSchema: Schema<CreateTeachingPlanInput> = {
  safeParse(input) {
    if (!isRecord(input)) {
      return failure("Dados inválidos para criação do planejamento.");
    }

    const teacherAssignmentId = getString(input.teacherAssignmentId);
    const title = getString(input.title);
    const description = getNullableString(input.description);
    const educationBase = getString(input.educationBase);
    const workloadHours = getNullablePositiveNumber(input.workloadHours);
    const weeklyLessons = getNullablePositiveInteger(input.weeklyLessons);
    const semester = getNullableString(input.semester);
    const status = input.status === undefined ? undefined : getString(input.status);
    const errors: string[] = [];

    if (!teacherAssignmentId) {
      errors.push("Informe a atribuição do professor.");
    }

    if (!title) {
      errors.push("Informe o título do planejamento.");
    }

    if (!isEducationBase(educationBase)) {
      errors.push("Selecione uma base educacional válida.");
    }

    if (input.workloadHours !== undefined && workloadHours === null) {
      errors.push("A carga horária deve ser maior que zero.");
    }

    if (input.weeklyLessons !== undefined && weeklyLessons === null) {
      errors.push("As aulas semanais devem ser maiores que zero.");
    }

    if (status !== undefined && !isTeachingPlanStatus(status)) {
      errors.push("Selecione um status de planejamento válido.");
    }

    if (errors.length > 0) {
      return failure(...errors);
    }

    if (!isEducationBase(educationBase)) {
      return failure("Selecione uma base educacional válida.");
    }

    const normalizedStatus =
      status !== undefined && isTeachingPlanStatus(status) ? status : undefined;

    return success({
      teacherAssignmentId,
      title,
      description,
      educationBase,
      workloadHours,
      weeklyLessons,
      semester,
      status: normalizedStatus
    });
  }
};

export const updateTeachingPlanSchema: Schema<UpdateTeachingPlanInput> = {
  safeParse(input) {
    const parsed = createTeachingPlanSchema.safeParse(input);

    if (!parsed.success) {
      return parsed as ValidationResult<UpdateTeachingPlanInput>;
    }

    if (!isRecord(input)) {
      return failure("Dados inválidos para atualização do planejamento.");
    }

    const id = getString(input.id);
    const status = getString(input.status);

    if (!id) {
      return failure("Informe o id do planejamento.");
    }

    if (!isTeachingPlanStatus(status)) {
      return failure("Selecione um status de planejamento válido.");
    }

    return success({
      id,
      title: parsed.data.title,
      description: parsed.data.description,
      educationBase: parsed.data.educationBase,
      workloadHours: parsed.data.workloadHours,
      weeklyLessons: parsed.data.weeklyLessons,
      semester: parsed.data.semester,
      status
    });
  }
};

export const createPlanUnitSchema: Schema<CreatePlanUnitInput> = {
  safeParse(input) {
    if (!isRecord(input)) {
      return failure("Dados inválidos para criação da unidade.");
    }

    const teachingPlanId = getString(input.teachingPlanId);
    const title = getString(input.title);
    const description = getNullableString(input.description);
    const errors: string[] = [];

    if (!teachingPlanId) {
      errors.push("Informe o planejamento da unidade.");
    }

    if (!title) {
      errors.push("Informe o título da unidade.");
    }

    if (errors.length > 0) {
      return failure(...errors);
    }

    return success({ teachingPlanId, title, description });
  }
};

export const createPlannedLessonSchema: Schema<CreatePlannedLessonInput> = {
  safeParse(input) {
    if (!isRecord(input)) {
      return failure("Dados inválidos para criação da aula planejada.");
    }

    const teachingPlanId = getString(input.teachingPlanId);
    const planUnitId = getNullableString(input.planUnitId);
    const title = getString(input.title);
    const knowledgeObjects = getNullableString(input.knowledgeObjects);
    const objectives = getNullableString(input.objectives);
    const methodology = getNullableString(input.methodology);
    const observationsTemplate = getNullableString(input.observationsTemplate);
    const plannedDate = getNullableDateString(input.plannedDate);
    const lessonNumber = getPositiveInteger(input.lessonNumber);
    const durationLessons = getPositiveInteger(input.durationLessons);
    const status =
      input.status === undefined ? undefined : getString(input.status);
    const errors: string[] = [];

    if (!teachingPlanId) {
      errors.push("Informe o planejamento da aula.");
    }

    if (!title) {
      errors.push("Informe o título da aula.");
    }

    if (!lessonNumber) {
      errors.push("O número da aula deve ser maior que zero.");
    }

    if (!durationLessons) {
      errors.push("A quantidade de tempos deve ser maior que zero.");
    }

    if (
      methodology &&
      !SIAGE_METHODOLOGIES.includes(
        methodology as (typeof SIAGE_METHODOLOGIES)[number]
      )
    ) {
      errors.push("Selecione uma metodologia compatível com o SIAGE.");
    }

    if (plannedDate === "__invalid_date__") {
      errors.push("Informe uma data prevista válida.");
    }

    if (status !== undefined && !isPlannedLessonStatus(status)) {
      errors.push("Selecione um status válido para a aula planejada.");
    }

    if (errors.length > 0) {
      return failure(...errors);
    }

    const normalizedStatus =
      status !== undefined && isPlannedLessonStatus(status) ? status : undefined;

    return success({
      teachingPlanId,
      planUnitId,
      title,
      knowledgeObjects,
      objectives,
      methodology,
      observationsTemplate,
      plannedDate: plannedDate === "__invalid_date__" ? null : plannedDate,
      lessonNumber,
      durationLessons,
      status: normalizedStatus
    });
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(value: unknown) {
  const normalized = getString(value);

  return normalized.length > 0 ? normalized : null;
}

function getNullablePositiveNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getPositiveInteger(value: unknown) {
  const numeric = Number(value);

  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function getNullablePositiveInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return getPositiveInteger(value) || null;
}

function getNullableDateString(value: unknown) {
  const normalized = getNullableString(value);

  if (normalized === null) {
    return null;
  }

  const date = new Date(`${normalized}T12:00:00`);

  return Number.isNaN(date.getTime()) ? "__invalid_date__" : normalized;
}
