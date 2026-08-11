import {
  getTeachingPlanById as getTeachingPlanByIdQuery,
  listTeachingPlanAssignments,
  listTeachingPlans
} from "../queries";

import type {
  PlanningAssignmentListItem,
  TeachingPlanDetail,
  TeachingPlanListItem,
  TeachingPlanStatus
} from "../types";

export * from "../queries";

export async function getPlanningAssignments(filters: {
  serie: string;
  disciplina: string;
  semestre: string;
  status: string;
  base: string;
}) {
  const [assignmentsResult, plansResult] = await Promise.all([
    listTeachingPlanAssignments(),
    listTeachingPlans()
  ]);

  if (assignmentsResult.error) {
    return {
      data: emptyPlanningAssignmentsData(),
      error: assignmentsResult.error,
      configured: assignmentsResult.configured
    };
  }

  if (plansResult.error) {
    return {
      data: emptyPlanningAssignmentsData(),
      error: plansResult.error,
      configured: plansResult.configured
    };
  }

  const items = assignmentsResult.data.map((assignment) => {
    const relatedPlans = plansResult.data.filter(
      (plan) => plan.teacherAssignmentId === assignment.assignmentId
    );
    const selectedPlan = pickPrimaryPlan(relatedPlans);

    return {
      assignmentId: assignment.assignmentId,
      planId: selectedPlan?.id ?? null,
      turmaNome: assignment.className,
      serie: assignment.grade,
      letra: assignment.letter,
      disciplinaNome: assignment.subjectName,
      semester: assignment.semester ?? "Sem semestre",
      componentType: assignment.componentType,
      educationBase: selectedPlan?.educationBase ?? null,
      planStatus: selectedPlan?.status ?? "missing",
      lessonCount: selectedPlan?.lessonsCount ?? 0,
      schoolName: assignment.schoolName
    } satisfies PlanningAssignmentListItem;
  });

  const filteredItems = items.filter((item) => {
    if (filters.serie && item.serie !== filters.serie) {
      return false;
    }

    if (filters.disciplina && item.disciplinaNome !== filters.disciplina) {
      return false;
    }

    if (filters.semestre && item.semester !== filters.semestre) {
      return false;
    }

    if (filters.status && item.planStatus !== filters.status) {
      return false;
    }

    if (filters.base && item.educationBase !== filters.base) {
      return false;
    }

    return true;
  });

  return {
    data: {
      items: filteredItems,
      allItems: items,
      assignmentOptions: items.map((item) => ({
        assignmentId: item.assignmentId,
        disciplinaNome: item.disciplinaNome,
        semester: item.semester,
        label: `${item.serie}${item.letra ? ` ${item.letra}` : ""} · ${item.turmaNome} · ${item.disciplinaNome} · ${item.semester}`
      }))
    },
    error: null,
    configured: assignmentsResult.configured && plansResult.configured
  };
}

export async function getTeachingPlanDetail(planId: string) {
  const result = await getTeachingPlanByIdQuery(planId);

  if (!result.data) {
    return {
      data: null,
      error: result.error,
      configured: result.configured
    };
  }

  return {
    data: mapLegacyTeachingPlanDetail(result.data),
    error: result.error,
    configured: result.configured
  };
}

function emptyPlanningAssignmentsData() {
  return {
    items: [] as PlanningAssignmentListItem[],
    allItems: [] as PlanningAssignmentListItem[],
    assignmentOptions: [] as Array<{
      assignmentId: string;
      disciplinaNome: string;
      semester: string;
      label: string;
    }>
  };
}

function pickPrimaryPlan(plans: TeachingPlanListItem[]) {
  return [...plans].sort((left, right) => {
    const priority = getStatusPriority(left.status) - getStatusPriority(right.status);

    if (priority !== 0) {
      return priority;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  })[0];
}

function getStatusPriority(status: TeachingPlanStatus) {
  switch (status) {
    case "active":
      return 0;
    case "draft":
      return 1;
    case "completed":
      return 2;
    case "archived":
      return 3;
  }
}

function mapLegacyTeachingPlanDetail(plan: TeachingPlanDetail) {
  return {
    ...plan,
    assignment: {
      ...plan.assignment,
      turmaNome: plan.assignment.className,
      serie: plan.assignment.grade,
      disciplinaNome: plan.assignment.subjectName
    }
  };
}
